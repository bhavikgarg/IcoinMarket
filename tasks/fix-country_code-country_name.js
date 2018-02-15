'use strict';

var mongoose         = require('mongoose');
var config           = require('./../server/config/environment');
var co = require('co');

mongoose.connect(config.mongo.uri, config.mongo.options);
mongoose.connection.on('error', function(err) {
  console.error('MongoDB connection error: ' + err);
  process.exit(-1);
  }
);

var Commissions = require('./../server/api/credits/commission-log.model');
var CreditLogs = require('./../server/api/credits/credit-logs.model');
var CreditService = require('./../server/components/credits/credits.service');
var DistributionService = require('./../server/components/distribution/distribution.service');
var User = require('./../server/api/user/user.model');
var Countries = require('./../server/api/utilities/countries.model.js');

var ReleaseOldCommissions = function() {

  var _self = this;

  _self.getData = function* (){
    return yield User.find({
        "verified": true,
        "isBlocked": false,
        // "createdat": {$gte: new Date(config.ICM_PRE_LAUNCH_TIME)},
        "mobile": {$regex: '\\+\\-.*'},
        "countryName": {$exists: true}
    });
  };

  _self.processInfo = function(data, index, len, callback) {
    console.log("\n\r", 'Processing For: ', index, len);
    if(index < len) {
       var user = data[index];
       console.log("Processing for User :", user._id);
       if (user.countryName && user.countryName.length != 0) {
            Countries.findOne({ name: user.countryName}, function (err, cData) {
                if (err || !cData) {
                    console.log(err);
                    return _self.processInfo(data, (index + 1), len, callback);
                } else {
                    var countryCode = cData.code;
                    var mobile  = user.mobile && user.mobile.split("-").slice(1).join("-");
                    mobile = cData.dial_code + '-' + mobile;
                    User.update({_id: Object(user._id)}, {$set: {mobile: mobile, countryCode: countryCode}}, {returnNewDocument : true}, function(err, _user){
                    // user.update(function (err, _user) {
                        if (err || !_user) {
                            console.log('error while updating the user', err);
                            return _self.processInfo(data, (index + 1), len, callback);
                        } else {
                            return _self.processInfo(data, (index + 1), len, callback);
                        }
                    });
                }

            });
       } else {
            return _self.processInfo(data, (index + 1), len, callback);
       }
    } else {
      return callback();
    }
  };

  _self.startWorker = function (callback) {
    co(function*(){
      let users = yield _self.getData();
      if(users && users.length > 0){
        _self.processInfo(users, 0, users.length, function(err, result){

        });
      }
      else{
        console.log("No records found to process ");
        process.exit(0);
      }
    }).catch(function(err){
      console.log("[Error] Unable to process verify users: "+err);
      process.exit(0);
    });
  };


  return {
    execute: _self.startWorker
  }
}

var releaseOldCommissions = new ReleaseOldCommissions();

setTimeout(function () {
    releaseOldCommissions.execute(function(err, data){
      console.log(err, data);
    //  process.exit(0);
    });

}, 15000);
