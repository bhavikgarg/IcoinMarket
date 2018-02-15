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

var Commitments = require('./../server/api/commitments/commitments.model');


var ReleaseOldCommissions = function() {

  var _self = this;
  _self.creditService = new CreditService();

  _self.getData = function* (){
    return yield Commitments.find({"createdat": {$gt: new Date('2017-08-02T06:30:00Z')}});
  };

  _self.processInfo = function(data, index, len, callback) {
    console.log("\n\r\n\r", 'Processing For: ', index, len, "\n\r\n\r");
    var dservice = new DistributionService();
    if(index < len) {
       var commitment = data[index];
       console.log("Processing for CreditLog :", commitment);
       dservice.commissionDistribution(commitment.userid + '', commitment.amount.value, commitment.createdat, 1, null, '', function(err, _data) {
            if(err || !_data){
               console.log("Unable to update user adcpacks. ",err, _data);
               return callback();
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
      let commitments = yield _self.getData();
      if(commitments && commitments.length > 0){
        _self.processInfo(commitments, 0, commitments.length, function(err, result){

        });
      }
      else{
        console.log("No records found to process ");
        process.exit(0);
      }
    }).catch(function(err){
      console.log("[Error] Unable to process verify commitments: "+err);
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
