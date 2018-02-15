'use strict';

var mongoose = require('mongoose');
var config   = require('./../server/config/environment');

// Connect to database
mongoose.connect(config.mongo.uri, config.mongo.options);
mongoose.connection.on('error', function(err) {
	console.error('MongoDB connection error: ' + err);
	process.exit(-1);
	}
);

var fs        = require('fs');
var Genealogy = require('./../server/api/genealogy/genealogy.model');
var Users     = require('./../server/api/user/user.model');
//var WSDL      = require('./../server/components/wsdl/mapwsdl.service');


var SyncUsers = function() {

  var _self = this;

  _self.logFilePath = './dbsync.log';

	_self.lockFilePath = './dbsync.lock';

  _self.totalUserSync = 0;

	_self.totalSyncLimit = 1000;

  //_self.wsdl = new WSDL();

  _self.execute = function() {

		fs.stat(_self.lockFilePath, function(err) {

			if(err) {

				fs.open(_self.lockFilePath, 'a+', function(err, file) {
					if (err) throw err;
					console.log('The "data to append" was appended to file!');

					fs.write(file, new Date() + '');
					fs.close(file);
				});

		    fs.stat(_self.logFilePath, function(err) {

		      if(err) {
		        fs.open(_self.logFilePath, 'a+', function(err, file) {
		          if (err) throw err;
		          console.log('The "data to append" was appended to file!');

		          fs.write(file, '2');
		          fs.close(file);

		          return _self.startSync(2, _self.totalSyncLimit);
		        });
		      }
		      else {

		        fs.readFile(_self.logFilePath, {encoding: 'utf-8'}, function(err, data) {
		          if (err) throw err;

		          console.log('File content Readed');
		          return _self.startSync(data, _self.totalSyncLimit);
		        });
		      }
		    });

			}
			else {

				console.log('Sorry! Sync already in progress');
				_self.removeLock(function() {
					process.exit(0);
				});
			}

		});
  }

	_self.updateLog = function(info, _callback) {

		/* fs.open(_self.logFilePath, 'w', function(err, file) {
			if (err) throw err;
			fs.write(file, info+'');
			fs.close(file);
			return _callback();
		}); */

		_callback();
	}

	_self.removeLock = function(_callback) {

		fs.stat(_self.lockFilePath, function(err) {
			if(!err) {
				fs.unlinkSync(_self.lockFilePath);
				_callback();
			}
	  });
	}

  _self.startSync = function(startAfter, syncLimit) {

    console.log('Start After: ' + startAfter, 'Sync Limit: ' + syncLimit, 'Starting Sync Process ....');

    var users = Users.find({userProfileId: {$gt: (startAfter * 1)}}).sort({userProfileId: 1}).limit(syncLimit);

    users.exec(function(err, data) {

      if(err) {
        console.log('Reading Users Info Raise Error: ', err);
        return false;
      }

      console.log('Start Time: ', new Date());
      return _self.synchronousSync(data, 0);
    });
  }

	_self.syncWithTree = function(user, _callback) {

		Genealogy.getMember({id: user._id+''}, function(err, data) {

			if(!err) {

				if(data && data.length > 0) {

					console.log('User exists on Server (No Sycn Required Neo4J)', user._id, user.userProfileId, (user.sponsor || config.sponsorId), '.');
					_callback(false);
				}
				else {

					var gmodel  = Genealogy.getModel();
					var sponsor = user.sponsor;  //|| config.sponsorId)+'';

					if(!sponsor || sponsor=='undefined') {
						sponsor = config.sponsorId;
					}

					console.log('Need to sync on Server (Neo4J): '+user._id+', '+user.userProfileId+', '+sponsor+'.');

					Users.findById(sponsor, function(err, _user) {
		        var _sponsorUserName = '';
		        if(!err && _user) {
		          _sponsorUserName = _user.username ? _user.username : '';
		        }

		        // Place user in Tree
		        gmodel.query(Genealogy._prepareQuery('create', {
		          'REFID': sponsor,
		          'JOINAT_SINCE': user.createdat
		        }), {
		          userId: user._id,
		          userName: user.name,
		          userSponsor: sponsor,
		          userJoinAt: user.createdat,
		          userIP: (user.ip || '0.0.0.0'),
		          userEmail: user.email,
		          countryName: (user.countryName || ''),
		          countryCode: (user.countryCode || ''),
		          userSponsorId: sponsor,
		          userSponsorName: (_sponsorUserName || config.sponsorUn)
		        }, function(err, data) {

							if(err) {
								console.log('[err] Adding Member In Tree (Neo4J): '+user._id+', '+user.userProfileId+', '+sponsor+'.');
							}

							_callback(true);
						});
		      });
				}
			}

			if(err) {

				console.log('[err] Member exists on Server (Unable Sycn Neo4J)', user._id, user.userProfileId, (user.sponsor || config.sponsorId), '.', err);
				_callback(false);
			}
		});
	}

	// _self.syncWithWSDL = function(user, _callback) {
	// 	_self.wsdl.memberExists(user._id+'', function(err, info) {
	//
	// 		if(!err) {
	//
	// 			if(info && info.Member_ExistsResult.Message.toLowerCase() === 'fail') {
	//
	// 				console.log('Need to sync on Server: '+user._id+', '+user.userProfileId+', '+(user.sponsor || config.sponsorId)+'.');
	//
	// 				// Register User By Using WSDL Service (Jaipur API Sync)
	// 				_self.wsdl.registerUser({
	// 					SponsorId: (user.sponsor || config.sponsorId)+'',
	// 					MemberId: user._id + '',
	// 					RegistrationDate: new Date(user.createdat),
	// 					key: config.wsdlInfo.key
	// 				}, function(err, response) {
	// 					console.log('WSDL user registration: if not see error info', err, response);
	// 					_callback(true);
	// 				});
	// 			}
	// 			else if(info && info.Member_ExistsResult.Message.toLowerCase() !== 'fail') {
	//
	// 				console.log('User exists on Server (No Sycn Required)', user._id, user.userProfileId, (user.sponsor || config.sponsorId), '.');
	// 				_callback(false);
	// 			}
	// 		}
	//
	// 		if(err) {
	//
	// 			console.log('[err] Member exists on Server (Unable Sycn WSDL)', user._id, user.userProfileId, (user.sponsor || config.sponsorId), '.', err);
	// 		}
	//
	// 	});
	// }

	_self.verifyAndSyncUser = function(user, callback) {

		// _self.syncWithWSDL(user, function(resp) {
		// 	var _wsdlResp = resp;

			_self.syncWithTree(user, function(_resp) {
				var _treeResp = _resp;

				//callback((_wsdlResp || _treeResp));
				callback(_treeResp);
			});

		// });
	}

  _self.synchronousSync = function(data, currentIndex) {

    if(data.length > 0 && currentIndex < data.length) {

      var user = data[currentIndex];

			_self.verifyAndSyncUser(user, function(needToAdd) {

				_self.totalUserSync += (needToAdd ? 1 : 0);
				_self.updateLog(user.userProfileId, function() {
					_self.synchronousSync(data, (currentIndex + 1));
				});
			});
    }
    else {

      console.log('Sync Completed: (Total Sync Required: ' + _self.totalUserSync + ')', new Date());
			_self.removeLock(function() {
				console.log('All Done');
				process.exit(0);
			});
    }
  }

  return _self;
}

module.exports = SyncUsers;

//
// var syncUsr = new SyncUsers();
// syncUsr.execute();
