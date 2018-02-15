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
var CreditService = require('./../server/components/credits/credits.service');
var DistributionService = require('./../server/components/distribution/distribution.service');

var ReleaseOldCommissions = function() {

  var _self = this;
  _self.creditService = new CreditService();
  _self.distributionService = new DistributionService();

	_self.getData = function* (){
		return yield WorkerData.find({ productid : 'adscash', status : 'COMPLETED', tech_comment : { $ne : 'COMMISSION_RELEASED'} }).sort({createdAt : 1}).limit(1);
	};

  _self.processInfo = function(data, index, len, callback) {
    console.log("\n\r\n\r", 'Processing For: ', index, len, "\n\r\n\r");
    if(index < len) {
       var payment = data[index];
       _self.distributionService.adscashCoinOldDistribution(payment.userid, payment.coins, 1, payment.createdAt, '', true, function(result){
         console.log("Commissions is released :", result, payment);
         var adcpacks = parseFloat(parseInt(payment.coins) / 1000).toFixed(2);
         _self.creditService.updateCredits(payment.userid, {
           adscash: 0,
           usd: 0,
           adcpacks: adcpacks
         },function(err, _data) {
           if(err || !_data){
              console.log("Unable to update user adcpacks. ",err, _data);
              return callback();
           }
           else{
             payment.update({tech_comment: 'COMMISSION_RELEASED'}, function(err, _d) {
               console.log('Payment Info Updated', err);
             });

              console.log("User adcpacks update. ",err, _data);
              return _self.processInfo(data, (index + 1), len, callback);
           }
         });
       });
    }
    else {
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
      console.log("[Error] Unable to process verify payment: "+err);
      process.exit(0);
    });
  };

  return {
    execute: _self.startWorker
  }
}

//module.exports = ValidateTransaction;


var releaseOldCommissions = new ReleaseOldCommissions();
releaseOldCommissions.execute(function(err, data){
  console.log(err, data);
//  process.exit(0);
});
