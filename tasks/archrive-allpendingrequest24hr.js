'use strict';

var mongoose         = require('mongoose');
var config           = require('./../server/config/environment');
var co = require('co');
var request = require('request'),
    Payment = require('../server/api/payment/payment.model');

mongoose.connect(config.mongo.uri, config.mongo.options);
mongoose.connection.on('error', function(err) {
	console.error('MongoDB connection error: ' + err);
	process.exit(-1);
	}
);

var WorkerData        = require('./../server/api/payment/payment.model');
var BlockIoService = require('./../server/components/payments/block.io.service');
var BlockIoLtcService = require('./../server/components/payments/block.io.ltc.service');
var PayService = require('./../server/components/payments/pay.service');

var JobService = function() {
  var _self = this;
  _self.addresses = [];
  _self.ltcAddresses = [];
  _self.archriveIndex = 0;
  _self.blockIoService = new BlockIoService();
  _self.blockIoLtcService = new BlockIoLtcService();
  _self.payService = new PayService();

  _self.getData = function* (startDate, endDate) {
    return yield WorkerData.find({
      "$or": [{"paymode": 'bitcoinBlockIO'}, {"paymode": 'litecoinBlockIO'}, {"paymode2": 'bitcoinBlockIO'}],
      "status": {"$in": ['PENDING']},
      "createdAt": {"$gte": startDate, "$lte" : endDate }
    }).sort({createdat:1}).exec();
  };

  _self.getBalance = function(TxAddress, payMode, callback){
        if (payMode == 'litecoinBlockIO') {
            _self.blockIoLtcService.verifyPayment(TxAddress, callback);
        } else if (payMode == 'bitcoinBlockIO') {
            _self.blockIoService.verifyPayment(TxAddress, callback);
        }
  };
  _self.archriveAddress = function(addressString, callback){
    _self.blockIoService.archriveAddress(addressString, callback);
  };
  _self.archriveLtcAddress = function(addressString, callback) {
      _self.blockIoLtcService.archriveAddress(addressString, callback);
  };
  _self.deleteNotification = function(notificationid, callback){
      _self.blockIoService.deleteNotification(notificationid, callback);
  };

  _self.archriveAddressList = function(list, index, length, callback){
    console.log("\n\r\n\r", 'Processing archrive chuncked array: ', index, length, "\n\r\n\r");
    if(index < length){
      var arr = list[index];
      var addressString = arr.join();
      _self.archriveAddress(addressString, function(err, data){
          console.log("Archrived addresses:"+err, data);
          return _self.archriveAddressList(list, (index + 1), length, callback);
      });
    }
    else{
      callback();
    }
  };

  _self.archriveLtcAddressList = function(list, index, length, callback){
    console.log("\n\r\n\r", 'Processing archrive chuncked LTC array: ', index, length, "\n\r\n\r");
    if(index < length){
      var arr = list[index];
      var addressString = arr.join();
      _self.archriveLtcAddress(addressString, function(err, data){
          console.log("Archrived addresses:"+err, data);
          return _self.archriveLtcAddressList(list, (index + 1), length, callback);
      });
    }
    else{
      callback();
    }
  };


  _self.processInfo = function(data, index, len, callback) {
    console.log("\n\r\n\r", 'Processing For: ', index, len, "\n\r\n\r");
    if(index < len) {
     var payment = data[index];
     var TxAddress = payment.gatewaydata.address;
     var payMode = payment.paymode;
      _self.getBalance(TxAddress, payMode, function(err, resData){
       if(err || !resData){
           console.log("Unable to get payment details from blockio for address:"+err, TxAddress);
           return _self.processInfo(data, (index + 1), len, callback);
       }
       else if(resData && resData.available_balance == 0){
         payment.update({status: 'CANCELLED', comment : 'Payment not received till 24 Hr.'}, function(_err, _data) {
          console.log('Payment cancelled :'+_err, _data._id);
           _self.deleteNotification(payment.gatewaydata.notification_id, function(delerr, deldata){
             console.log("Blockio notification delete:"+payment.gatewaydata.notification_id, delerr, deldata);

             /* add function to refund ci coins */
                if (payment.paymode == 'gc' && payment.gcused > 0) {
                    _self.refundCIGoldGoins(payment, function(e, res) {
                        if (e) {
                            console.log("GC Refund Error  : ", e);
                            return callback();
                        } else {
                            _self.addresses.push(TxAddress);
                            return _self.processInfo(data, (index + 1), len, callback);
                        }
                    });

                } else {
                    if (payment.paymode == "litecoinBlockIO") {
                        _self.ltcAddresses.push(TxAddress);
                    } else if (payment.paymode == "bitcoinBlockIO") {
                        _self.addresses.push(TxAddress);
                    }
                    return _self.processInfo(data, (index + 1), len, callback);
                }
           });
         });
       }
       else {
         return _self.processInfo(data, (index + 1), len, callback);
       }
     });
    } else {
        if(_self.addresses.length > 0 || _self.ltcAddresses.length > 0){
            var chunckAddressList = [],
                chunckLtcAddressList = [],
                i;
            for (i = 0; i < _self.addresses.length; i += 100) {
                chunckAddressList.push(_self.addresses.slice(i, i + 100));
            }
            for (i = 0; i < _self.ltcAddresses.length; i += 100) {
                chunckLtcAddressList.push(_self.ltcAddresses.slice(i, i + 100));
            }
            _self.archriveAddressList(chunckAddressList, 0, chunckAddressList.length, function() {
                _self.archriveLtcAddressList(chunckLtcAddressList, 0, chunckLtcAddressList.length, function() {
                    return callback();
                });
            });
        }
      else{
          return callback();
      }
    }
  };

  _self.startWorker = function (startDate, endDate, callback) {
    co(function*(){
      let data = yield _self.getData(startDate, endDate);
      if(data && data.length > 0){
        _self.processInfo(data, 0, data.length, function() {
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

  _self.refundCIGoldGoins = function(payment, callback) {
    console.log("Refunding ci gold coins");
    var options = {
        url: config.clickintensityApiDomain + '/auth/local',
        form: config.clickintensityIntermidiator
    };
    request.post(options, function(err, httpResp, resp){
      let body = JSON.parse(resp);
      console.log(body);
      if(body && body.token) {
        var reqOptions = {
          url: config.clickintensityApiDomain + '/api/pay/refund-adscash-purchase',
          headers: {
            'Authorization': 'Bearer '+body.token
          },
          form: {
            userid : payment.userid,
            coins : payment.gcused,
            purchaseid : payment._id.toString()
          }
        };

        request.post(reqOptions, function(_e, httpResponse, result){
          if(!result.error){
            Payment.findOneAndUpdate({_id : payment._id}, {status : 'CANCELLED', comment : 'Full payment not received, Gold coins refunded at CI.'}, function(__e, res) {
                if(__e) {
                  console.log("Error : "+__e);

                }
                callback(_e, result);
            });
          }
          else{
            callback(null, result);
          }
        });

      }
      else if(body && body.error){
          console.log("Error from ci:"+result.body);
          callback(body.error, JSON.parse(result.body));
      }
      else{
        console.log("Response from ci:"+JSON.stringify(body));
        callback('Unable to authenticate from clickintensity.', null);
      }
    });
  }

  return {
    execute: _self.startWorker
  }
}

module.exports = JobService;


