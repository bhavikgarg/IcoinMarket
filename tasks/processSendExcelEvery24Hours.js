'use strict'

var neo4j = require('neo4j');
var mongoose = require('mongoose');
var config = require('./../server/config/environment');
var User = require('./../server/api/user/user.model');
var PremiumUsers = require('./../server/api/user/premiumusers.model');
var _conInfo = config.neo4j;
var moment = require('moment');
var neoDB = new neo4j.GraphDatabase(_conInfo.protocol + _conInfo.username + ':' + _conInfo.password + '@' + _conInfo.uri);
var fs = require('fs');
var json2xls = require('json2xls');
var co = require('co');
var EmailService = require('./../server/components/emails/email.service');
//Connect to database
mongoose.connect(config.mongo.uri, config.mongo.options);
	mongoose.connection.on('error', function(err) {
		console.error('MongoDB connection error: ' + err);
		process.exit(-1);
	}
);

var job = function() {

  var _self = this;

	_self.resultData = [];
	_self.getPremiumUsers = function *() {
		return yield PremiumUsers.find({isActive : true}).exec();
	}

	_self.getNeoData = function(query) {
		console.log(query);
		return new Promise(function(resolve, reject) {
			neoDB.cypher(query, function(err, _result) {
				if(err && !_result) {
					console.log("[Err] Error in getting details from neo4j : ", err);
					reject(err);
				}
				if(undefined != _result && null != _result && _result.length >= 0) {
					resolve(_result);
				}
			})
		})
	}

	_self.base64_encode = function(file) {
		var fileData = fs.readFileSync(file);
		return new Buffer(fileData).toString('base64');
	}

	_self.emailFileToClient = function(file, user) {
		return new Promise(function(resolve, reject) {
			var _email = new EmailService();
			var encodedFileString = _self.base64_encode(file);
			// var emailResult = _email.sendExcelToClient({filename : file, filecontent : encodedFileString}, user);
			// if(emailResult) {
			// 	resolve(true);
			// } else {
			// 	reject(false);
			// }
			_email.sendExcelToClient({filename : file, filecontent : encodedFileString}, user, function(emailResult) {
         if(emailResult) {
           resolve(true);
         } else {
           reject(false);
         }
      });
		})
	}

	_self.processNeo = function(data, index, len, callback) {
		if(index < len) {
			var obj = data[index],
          userid = obj.userid.toString(),
          startDate = moment().subtract(1, 'days')._d.toISOString(),
          i = 0, len = 0,
					endDate = moment().toISOString(),
          neoQuery = "MATCH (n:ICUser {id: '"+userid+"'})-[:MEMBER_OF*]->(r) WHERE r.joinat >= '"+startDate+"' AND r.joinat <= '"+endDate+"' RETURN r.sponsor as sponsor, r.countryname as country, r.joinat as joinat, r.name as name, r.id as id, r.email as email, r.sponsorUsername as sponsorUn";
          //neoQuery = "MATCH (n:ICUser {id: '"+userid+"'})-[:MEMBER_OF*]->(r) WHERE r.joinat > '2016-05-07T19:09:17.163Z' AND r.joinat < '2016-05-08T19:09:17.156Z' RETURN r.sponsor as sponsor, r.countryname as country, r.joinat as joinat, r.name as name, r.id as id, r.email as email, r.sponsorUsername as sponsorUn";

			let neoData = _self.getNeoData(neoQuery)
											.then(function(result) {
												return result;
											})
											.catch(function(err) {
												console.log("[Err] Error in getting data from neo4j ", err);
												console.log("Processing for next");
												_self.processNeo(data, (index+1), data.length, callback);
											});

			neoData.then(function(result) {
				co(function* () {
					if(result && result.length > 0) {
						len = result.length;
						for(; i<len; i++) {
							let userObj = result[i],
									user_id = userObj.id.toString(),
									userData = yield User.findOne({_id: user_id}, {mobile: 1, username: 1}).exec();

							if(userData) {
								let dataObj = {
									id : user_id,
									name : userObj.name,
									email : userObj.email,
									username : userData.username,
									country : userObj.country,
									mobile : userData.mobile,
									joinat: userObj.joinat
								};

								_self.resultData.push(dataObj);
							}
						}

						if(_self.resultData && _self.resultData.length == len) {
							let exportData = [], count = 0;
		          _self.resultData.forEach(function(d) {
								var date = new Date(d.joinat);
		            count += 1;
		            exportData.push({
		              "S No" : count,
		              "System ID" : d.id,
		              "Name" : d.name,
		              "Email" : d.email,
									"Username" : d.username,
									"Mobile" : d.mobile,
		              "User Country" : d.country,
									"Joined On" : date.toUTCString()
		            })
		          });

		          var xls = json2xls(exportData);
		          var filename = 'register_'+ userid + '_'+moment().format('DD_MM_YYYY')+'.xlsx';
							let promiseToWriteFile = new Promise(function(resolve, reject) {
								fs.writeFile(filename, xls, 'binary', function(err, response) {
									if(err) {
										reject(err);
									} else {
										resolve(response);
									}
								})
							});
		          // var fd = fs.openSync( filename, 'w');
		          // fs.writeFile( filename, xls, 'binary', function(err, result) {
							// 	console.log(err, result);
							// });
							// console.log("Excel created successfully");
							promiseToWriteFile.then(function(response){
								_self.emailFileToClient(filename, obj)
									.then(function(response) {
										if(response) {
											// delete file here
											fs.unlink(filename);
										}
										console.log("Processing for next");
										_self.processNeo(data, (index+1), data.length, callback);
									}).catch(function(err) {
										console.log("[Err] There was error in mailing file to client", err);
										setTimeout(function() {
											fs.unlink(filename);
										}, 2000);
										console.log("Processing for next");
										_self.processNeo(data, (index+1), data.length, callback);
									})
							}).catch(function(e) {
								console.log("[Err] Error in writin to file", e);
							});
						} else {
							console.log("There are no records to process");
							console.log("Processing for next");
							_self.processNeo(data, (index+1), data.length, callback);
						}
					} else {
						console.log("No records from neo4j");
						console.log("Processing for next");
						_self.processNeo(data, (index+1), data.length, callback);
					}
				})
				.catch(function(e) {
					console.log("[Err] Error in getting data", e);
					console.log("Processing for next");
					_self.processNeo(data, (index+1), data.length, callback);
				})
			})
			.catch(function(err) {
				console.log("[Err] Error in getting data from neo4j ", err);
				console.log("Processing for next");
				_self.processNeo(data, (index+1), data.length, callback);
			})

		} else {
			console.log("No records");
			callback(false, "done");
		}
	}

	_self.startWorker = function(callback) {
		co(function* () {
			let data = yield _self.getPremiumUsers();
			if(data) {
				_self.processNeo(data, 0, data.length, function(_err, result) {
          if(_err) {
            console.log("[Err] Error in processing : ", _err);
          }
          console.log("Done all");
          callback(false, "No more records");
        })
			} else {
				console.log("No records found to process");
				//callback(false, "No records found to process");
				process.exit(0);
			}
		})
		.catch(function(err) {
			console.log(err);
			process.exit(0);
		})
  }

	return {
	  execute : _self.startWorker
	};
}

module.exports = job;