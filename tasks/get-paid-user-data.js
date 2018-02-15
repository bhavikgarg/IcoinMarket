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
var WorkerData        = require('./../server/api/payment/payment.model');
var User = require('./../server/api/user/user.model');
var Commitments = require('./../server/api/commitments/commitments.model');

var PaidUserData = function() {

  var _self = this;
  

  _self.getData = function* (){
    var addFundUsers = yield WorkerData.distinct("userid", {status: "COMPLETED"});
    var commitmentUsers = yield Commitments.distinct("userid", {"status": { "$in": ["COMMITTED", "ON TRADE"] }});
    commitmentUsers.forEach(function (userid) {
        if (addFundUsers.indexOf(userid + '') < 0) {
            addFundUsers.push(userid + '');
        };
    });
    return addFundUsers;
  };

  _self.processInfo = function(data, index, len, callback) {
    console.log("\n\r\n\r", 'Processing For: ', index, len, "\n\r\n\r");
    if(index < len) {
       var userid = data[index];
       console.log("Processing for Payment for user id :", userid);
       User.update({_id: Object(userid)}, {$set: {paidUser: true}}, function(err, _user){
       // User.findByIdAndUpdate(userid, {"paidUser": true}, function(err, _user){
       // user.update(function (err, _user) {
           if (err || !_user) {
               console.log('error while updating the user', err);
               return _self.processInfo(data, (index + 1), len, callback);
           } else {
               return _self.processInfo(data, (index + 1), len, callback);
           }
       });

    } else {
      return callback();
    }
  };

  _self.startWorker = function (callback) {
    co(function*(){
      let payments = yield _self.getData();
      if(payments && payments.length > 0){
        _self.processInfo(payments, 0, payments.length, function(err, result){

        });
      }
      else{
        console.log("No records found to process ");
        process.exit(0);
      }
    }).catch(function(err){
      console.log("[Error] Unable to process verify payments: "+err);
      process.exit(0);
    });
  };

  return {
    execute: _self.startWorker
  }
}

var paidUserData = new PaidUserData();

paidUserData.execute(function(err, data){
  console.log(err, data);
//  process.exit(0);
});
