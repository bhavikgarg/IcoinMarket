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

 

var ReleaseOldCommissions = function() {

  var _self = this;
  _self.creditService = new CreditService(); 

  _self.getData = function* (){
    //return yield CreditLogs.find({subtype : 'C'}).sort({createdat : 1}).limit(1);
    return yield CreditLogs.find({subtype : 'C'}).sort({createdat : 1});
  };

  _self.processInfo = function(data, index, len, callback) {
    console.log("\n\r\n\r", 'Processing For: ', index, len, "\n\r\n\r");
    if(index < len) {
       var commission = data[index]; 
       console.log("Processing for CreditLog :", commission); 
       var adscash = commission.type == 'adscash' && commission.coins ? commission.coins.value : 0;
       var usd     = commission.type == 'usd' && commission.coins ? commission.coins.value : 0; 
         _self.creditService.updateCredits(commission.userid, {
           adscash: adscash,
           usd: usd,
           adcpacks: 0
         },function(err, _data) {
           if(err || !_data){
              console.log("Unable to update user adcpacks. ",err, _data);
              return callback();
           }
           else{
             // commission.update({is_commission_released: true }, function(err, _d) {
             //   console.log('CreditLogs Info Updated', err);
             // });  
              return _self.processInfo(data, (index + 1), len, callback);
           }
         });
    }
    else {
      return callback();
    }
  };

  _self.startWorker = function (callback) {
    co(function*(){
      let commissions = yield _self.getData();
      if(commissions && commissions.length > 0){
        _self.processInfo(commissions, 0, commissions.length, function(err, result){

        });
      }
      else{
        console.log("No records found to process ");
        process.exit(0);
      }
    }).catch(function(err){
      console.log("[Error] Unable to process verify commissions: "+err);
      process.exit(0);
    });
  };

  return {
    execute: _self.startWorker
  }
}
 
var releaseOldCommissions = new ReleaseOldCommissions();
releaseOldCommissions.execute(function(err, data){
  console.log(err, data);
//  process.exit(0);
});
