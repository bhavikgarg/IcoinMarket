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

//mongoose.set('debug', true);

var WorkerData        = require('./../server/api/payment/payment.model');
var CurrencyRate        = require('./../server/api/payment/currency-rate.model');
var BlockIoService = require('./../server/components/payments/block.io.service');
var BlockIoLtcService = require('./../server/components/payments/block.io.ltc.service');
var PayService = require('./../server/components/payments/pay.service');

var ValidateTransaction = function() {

  var _self = this;
  _self.addresses = [];
  _self.goldcoinRate = 0.025;
  _self.blockIoService = new BlockIoService();
  _self.blockIoLtcService = new BlockIoLtcService();
  _self.payService = new PayService();

  _self.getData = function* () {
    return yield WorkerData.find({
      "$or": [{"paymode": 'bitcoinBlockIO'}, {"paymode": 'litecoinBlockIO'}, {"paymode2": 'bitcoinBlockIO'}],
      "status": {"$in": ['PROCESSING']},
    }).populate({ path : "userid", select : "commission", model : "User" }).sort({createdat:1}).exec();
  };

  _self.verifyPayment = function(TxAddress, payMode, callback){
        if (payMode == 'litecoinBlockIO') {
            _self.blockIoLtcService.verifyPayment(TxAddress, callback);
        } else if (payMode == 'bitcoinBlockIO') {
            _self.blockIoService.verifyPayment(TxAddress, callback);
        }
  };

  _self.deleteNotification = function(notification_id, payMode, callback){
        if (payMode == 'litecoinBlockIO') {
            _self.blockIoLtcService.deleteNotification(notification_id, callback);
        } else if (payMode == 'bitcoinBlockIO') {
            _self.blockIoService.deleteNotification(notification_id, callback);
        }
  };

  _self.getAdscashRate = function*(){
    return yield CurrencyRate.findOne({currency : 'adscash', isactive: true, expireat: null});
  };

  _self.processInfo = function(data, index, len, adscashrate, callback) {
    console.log("\n\r\n\r", 'Processing For: ', index, len, "\n\r\n\r");

    if(index < len) {
     var d = data[index];
     var TxAddress = d.gatewaydata.address;
     var payMode = d.paymode;
     _self.verifyPayment(TxAddress, payMode, function(err, resData){
       if(err || !resData){
           console.log("Unable to get payment details from blockio for address:"+err, TxAddress);
           return _self.processInfo(data, (index + 1), len, adscashrate, callback);
       }
       else if(resData && resData.available_balance > 0){
           WorkerData.findOne({ status : { "$in" : ['PROCESSING'] }, _id : d._id}, function(rchkpayerr, rchkpaydata){
             if(rchkpaydata){
               var blockchainFee = (payMode == 'litecoinBlockIO') ? config.ltcBlockIO.blockchainFee: config.blockIO.blockchainFee
               let fee = ((resData.available_balance/(100+parseFloat(blockchainFee)))*blockchainFee);

               let usdamtpaid = parseFloat(d.gatewaydata.btnrt*parseFloat(resData.available_balance - fee));
               if (d.productid == 'usd') {
                 let businessCommission = { amount : 0, type : 'usd', percent : 0 };
                 let amount = Math.round(usdamtpaid * 10)/10;
                 if (d.is_business_payment) {
                   let commissionsAmount = ((amount * d.userid.commission)/100);
                   businessCommission =  { amount : commissionsAmount, type : 'usd', percent : d.userid.commission };
                 }
                 let payService = new PayService();
                 payService.updatePaymentInfo({
                   params : { id : d._id },
                   body: {
                    paidamount : Math.round(usdamtpaid * 10)/10,
                    status:'COMPLETED',
                    gatewaysuccess : resData,
                    commission : businessCommission
                   }
                 }, function(__err, pdata){
                   _self.deleteNotification(d.gatewaydata.notification_id, payMode, function(dnerr, dndata){
                          console.log("Blockio notification delete:"+d.gatewaydata.notification_id, dnerr, dndata);
                          console.log("Payment processed:"+d._id)	;
                          return _self.processInfo(data, (index + 1), len, adscashrate, callback);
                   });
                 });
               }
               else if(d.productid == 'adscash'){
                 if(resData.available_balance < d.gatewaydata.amount){
                   console.log("Partial payment done for ",resData, d);
                   return _self.processInfo(data, (index + 1), len, adscashrate, callback);
                 }
                 else{
									 let adcrt = (d.unitprice/d.unitcoins);
                   let coinbybtc = Math.round((usdamtpaid/adcrt)*10)/10;
                   let coinbygc = Math.round(((d.gcused*_self.goldcoinRate)/adcrt)*10)/10;
                   let coins = (coinbybtc+coinbygc);
                   let payService = new PayService();
                   payService.updatePaymentInfo({
                     params : { id : d._id },
                     body: {
                      status:'COMPLETED',
                      coins : coins,
                      paidamount : usdamtpaid,
                      gatewaysuccess : resData
                     }
                   }, function(__err, pdata){
                     _self.deleteNotification(d.gatewaydata.notification_id, payMode, function(dnerr, dndata){
                      console.log("Blockio notification delete:"+d.gatewaydata.notification_id, dnerr, dndata, d.gatewaydata.notification_id);
                      return _self.processInfo(data, (index + 1), len, adscashrate, callback);
                    });
                   });
                 }
               }
               else{
                   console.log("Product type not supported."+d);
                   return _self.processInfo(data, (index + 1), len, adscashrate, callback);
               }
             }
             else{
                console.log("Payment is already COMPLETED."+d);
                return _self.processInfo(data, (index + 1), len, adscashrate, callback);
             }
           });
       }
       else {
         console.log("Tx is still pending:"+d._id);
         console.log(err);
         console.log(resData);
         return _self.processInfo(data, (index + 1), len, adscashrate, callback);
       }
     });
    }
    else {
      return callback();
    }
  };

  _self.startWorker = function (callback) {
    co(function*(){
      // let rate = yield _self.getAdscashRate();
      // if(!rate || !rate.rate){
      //   console.log("No rates defind for adscash.");
      //   process.exit(0);
      // }

      let data = yield _self.getData();
      if(data && data.length > 0){
        _self.processInfo(data, 0, data.length, 0, function() {
          return callback(false, 'All Done ...');
        });
      }
      else{
          console.log("No records found for payment verification.");
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

module.exports = ValidateTransaction;
