'use strict'

var neo4j = require('neo4j');
var mongoose = require('mongoose');
var config = require('./../server/config/environment');
var UserCredits = require('./../server/api/credits/credits.model');
var _conInfo = config.neo4j;
var neoDB = new neo4j.GraphDatabase(_conInfo.protocol + _conInfo.username + ':' + _conInfo.password + '@' + _conInfo.uri);
var co = require('co');

//Connect to database
mongoose.connect(config.mongo.uri, config.mongo.options);
	mongoose.connection.on('error', function(err) {
		console.error('MongoDB connection error: ' + err);
		process.exit(-1);
	}
);

var UpdateADCPacks = function() {

  var _self = this;

  _self.getUserCredits = function *() {
    return yield UserCredits.find({adcpacks : {$gt : 0}},{adcpacks : 1, userid : 1});
  }

  _self.updatePacks = function(query) {
    return new Promise(function(resolve, reject) {
      neoDB.cypher(query, function(err, result) {
        console.log("From neo4j : ", err, result);
        if(err || !result) {
          reject(err);
        } else if(undefined != result && null != result){
          resolve(result);
        }
      })
    })
  }

	_self.processInfo = function(data, index, len, callback) {
		if(index < len) {
			var obj = data[index],
          userid = obj.userid.toString(),
          adcpacks = obj.adcpacks,
          neoQuery = 'MATCH (n:ICUser {id: "'+userid+'"}) SET n.adcpacks = '+adcpacks+' RETURN n';

          console.log("Neo Query : ", neoQuery);

      _self.updatePacks(neoQuery).then(function(result) {
        if(result) {
          console.log("Record updated successfully", result);
          _self.processInfo(data, (index+1), len, callback);
        } else {
          console.log("in else ");
          _self.processInfo(data, (index+1), len, callback);
        }
      }).catch(function(err) {
        console.log("[Err] Error in updating adcpacks : Failed for user : " ,userid, err);
        _self.processInfo(data, (index+1), len, callback);
      })
		} else {
			console.log("No records");
			callback(false, "done");
		}
	}

	_self.startWorker = function(callback) {
		co(function* () {
			let data = yield _self.getUserCredits();
      console.log("Total records : ",data.length, data);
			if(data) {
				_self.processInfo(data, 0, data.length, function(_err, result) {
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

module.exports = UpdateADCPacks;
