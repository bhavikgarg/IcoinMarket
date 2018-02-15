'use strict';

// var mongoose = require('mongoose');
//
//
// // Connect to database
// mongoose.connect(config.mongo.uri, config.mongo.options);
// mongoose.connection.on('error', function(err) {
// 	console.error('MongoDB connection error: ' + err);
// 	process.exit(-1);
// 	}
// );

var User = require('./../../api/user/user.model');
var config           = require('./../../config/environment');
var Purchase         = require('./../../api/payment/payment.model');
var CreditService    = require('./../credits/credits.service');
var Users            = require('./../../api/user/user.model');
var OverflowBkt      = require('./../../api/distribution/overflowbucket.model');
var QualificationBkt = require('./../../api/distribution/qualificationbucket.model');
var ActivePacks      = require('./../../api/payment/activesilverpacks.model');
var SilverTaskModel  = require('./../../api/payment/silvercommissiontask.model');
var Emails           = require('../emails/email.service');


var SilverCommission = function() {

  var _self = this;
  _self.Credits = new CreditService();
  _self.Emails  = new Emails();
  _self.distributionMaxLevel = null;
  _self.distributionInfo     = {};

  _self.getData = function(callback) {

		SilverTaskModel.findOne({status: 'PROCESSED'}, function(err, data) {

			if(err) {
				console.log('[err] Sorry ! Error Occour While getting Data', err);
				process.exit(0);
			}

			if(!data) {
				console.log('[info] Previous Task execution details not found or Previous task is running, Forced Stop');
				process.exit(0);
			}

			if(data) {

				var gtDate = new Date(data.lastdate);

				data.update({status: 'PROCESSING'}, function(err) {

					if(!err) {

						console.log('No error getting Purchase Info: ');

						return Purchase.find({
				      paymode: 'ic',
				      productid: 'silver',
				      active: true,
							createdAt: {"$gt": gtDate},
							"_id": {"$gt": data.lastpurchaseid+''}
				    }).sort({'_id': 1}).exec(callback);
					}
					else {
						console.log('[err] Sorry ! An error occur while updating task data');
					}
				});
			}
		})
  }

  _self.getSponsor = function(userId, callback) {

    return Users.findById(userId+'', callback);
  }

  _self.getUsersActivePacks = function(userId, callback) {

    return ActivePacks.aggregate([
      {$match: {userid: userId+'', isactive: true, $or: [{expirydate: null}, {expirydate: {"$gte": (new Date())}}]}},
      {$group: {
        _id: "$userid",
        totalpacks: {$sum: "$totalpacks"}
      }}
    ], function(err, data) {

      callback(err, data);
    });
  }

  _self.roundofAmount = function(userId, level, amount) {
    var calAmount   = 0,
        roundAmount = 0;

    console.log(userId, level, amount, parseInt(amount * 100000), (parseInt(amount * 100000) / 100000));

    calAmount = (parseInt(amount * 100000) / 100000); // To get the amount only with two decimal digit
    roundAmount = amount - calAmount;

    if(roundAmount > 0) {
      OverflowBkt.create({
        sponsorid: userId+'',
        level: level,
        amount: roundAmount
      }, function(_err, _d) {
        console.log('[info] Round of take place and Overflow Bucket Have: ', userId, level, amount, roundAmount, _err);
      });
    }

    return calAmount;
  }

  _self.startCommissionDistribution = function(userId, coins, level, productId, userName, ___info, __callback) {

    if(level <= _self.distributionMaxLevel && userId != config.sponsorId) {
      _self.getSponsor(userId, function(err, _user) {

        if(err || !_user) {
          console.log('Unable to distribute amount: ', userId, level, err);
          return false;
        }

        if(!userName) {
          var useremail = (_user ? _user.email : userId),
              username  = (_user ? _user.username : userId);
          userName  = {
            name: username,
            email: useremail
          };
        }

				console.log('Current User Name: ', userId, _user.username, level, _user.sponsor);

        var percentConfig  = _self.distributionInfo['l'+level];
        var distributePer  = percentConfig.percent;
        var reCall         = ((_user.sponsor && _user.sponsor!='') ? true : false);
        var sponsorId      = ((_user.sponsor && _user.sponsor!='') ? (_user.sponsor) : config.sponsorId);
        _self.getUsersActivePacks(sponsorId, function(_err, creditInfo) {

          var sponsorCoins = ((coins * percentConfig.percent) / 100);
          var allowedUsers = config.allowCommissionAllLevel;
          console.log('Sponsor Coin 1: ', sponsorCoins, coins, percentConfig.percent, ((coins * percentConfig.percent) / 100));

          if(_err) {
            console.log('[err] Unable to distribute Silver Pack Purcahse to User: '+sponsorId, 'As error while getting its silver packs info', distributePer, _err);

            return _self.startCommissionDistribution(sponsorId, coins, (level + 1), productId, userName, ___info, __callback);
          }

          if((!creditInfo || (creditInfo.length == 0) || (creditInfo[0] && creditInfo[0].totalpacks < percentConfig.qulification)) && allowedUsers.indexOf(sponsorId+'') < 0) {
            sponsorCoins   = (coins * percentConfig.notQulifyPercent) / 100;
            distributePer  = percentConfig.notQulifyPercent
          }

          console.log('Sponsor Coin 2: ', sponsorCoins, coins, percentConfig.notQulifyPercent+'%');

          if(level == 1 || (level > 1 && sponsorCoins > 0)) {

            var sponsorCoins = _self.roundofAmount(sponsorId, level, sponsorCoins);

            console.log('Sponsor Coin 3 (Roundof): ', sponsorCoins, sponsorId, level);

            _self.Credits.updateCredits(sponsorId, {
              userid: sponsorId,
              silvercoins: 0,
              goldcoins: sponsorCoins,
              silverquantity: 0,
              goldquantity: 0,
              dtcredits: 0
            }, function(err, credits) {

              if(err) {
                console.log('[err] Unable to distribute coins ', sponsorId, sponsorCoins, distributePer+'%');
              }

              console.log("\n\r\n\r", 'Adding Commission: >>>> ', credits, "\n\r\n\r");

              if(credits) {
                console.log('Credits created');
                Users.findById(userId + '',  function(err, user){
                  if(err){
                    console.log(err);
                    return _self.startCommissionDistribution(sponsorId, coins, (level + 1), productId, userName, ___info, __callback);
                  }
                  else {
                    console.log('User found', user);
                    _self.Credits.addCreditTransferLog(sponsorId, {
                      amount: sponsorCoins,
                      description: 'Team Sales Commission for \'SILVER PACK PURCHASE\' from level (By: '+userName.name+', Gen: ' + level + ')',
                      type: 'product',
                      subtype: 'P',
                      cointype: 'gold',
                      createdat: (new Date()),
                      username: userName.name, //user.username,
                      email: userName.email //user.email
                    }, function(err, clog) {
                      console.log("\n\r\n\r", ' >>>> Credit (Silver Pack) Log of Level: ' + level, distributePer+'%', err, sponsorCoins, "\n\r\n\r", clog);

                      _self.Credits.addCommissionLog(sponsorId, {
                        amount: sponsorCoins,
                        description: 'Team Sales Commission for \'SILVER PACK PURCHASE\' from level (By: '+userName.name+', Gen: ' + level + ')',
                        createdat: (new Date())
                      }, function(_err, cmlog) {
                        console.log("\n\r\n\r", ' >>>> Credit (Silver Pack) Commission Log of Level: ' + level, distributePer+'%', _err, sponsorCoins, "\n\r\n\r", cmlog);
                        _self.Emails.sendCommissionDistributionEmail(sponsorId, level, userName, sponsorCoins, 'silver');
                      });
                    });

                    return _self.startCommissionDistribution(sponsorId, coins, (level + 1), productId, userName, ___info, __callback);
                  }

                });
              }
            });
          }

          if(level > 1 && sponsorCoins <= 0) {
            // Add to dump bucket
            QualificationBkt.create({
              sponsorid: sponsorId+'',
              level: level,
              amount: sponsorCoins
            }, function(__err, __d) {
              console.log('Distribution is added to Qualification Dump Bucket: ', sponsorId, level, sponsorCoins, distributePer+'%', __err);

              return _self.startCommissionDistribution(sponsorId, coins, (level + 1), productId, userName, ___info, __callback);
            })
          }
        });
      })
    }
    else {

      console.log('Distribution of Silver Packs Purchase By Gold Coins Done: ', userId);
      return __callback(___info);
    }
  }

  return {

    startDistribution: _self.startCommissionDistribution,
    setDistributionConfig: function(maxLimit, distributionInfo) {
      _self.distributionMaxLevel = maxLimit;
      _self.distributionInfo     = distributionInfo;

      return _self;
    }
  }
}

module.exports = SilverCommission;
