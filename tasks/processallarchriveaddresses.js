'use strict';

var mongoose         = require('mongoose');
var config           = require('./../server/config/environment');
var crontab = require('node-crontab');
var co = require('co');

mongoose.connect(config.mongo.uri, config.mongo.options);
mongoose.connection.on('error', function(err) {
	console.error('MongoDB connection error: ' + err);
	process.exit(-1);
	}
);

var BlockIoService = require('./../server/components/payments/block.io.service');
var BlockIoLtcService = require('./../server/components/payments/block.io.ltc.service');

var ProcessArchiveAddresses = function() {

  var _self = this;
  _self.addresses = [];
  _self.ltcAddresses = [];
  _self.blockIoService = new BlockIoService();
  _self.blockIoLtcService = new BlockIoLtcService();


  _self.verifyPayment = function(TxAddress, paymode, callback){
      if (paymode == 'litecoinBlockIO') {
          _self.blockIoLtcService.verifyPayment(TxAddress, callback);
      } else {
          _self.blockIoService.verifyPayment(TxAddress, callback);
      }
  };

  _self.unarchiveAddress = function(addresses, paymode, callback){
        if (paymode == 'litecoinBlockIO') {
            _self.blockIoLtcService.unarchriveAddress(addresses, callback);
        } else {
            _self.blockIoService.unarchriveAddress(addresses, callback);
        }
  };

  _self.processInfo = function(data, paymode, index, len, callback) {
    console.log("\n\r\n\r", 'Processing For: ', index, len, "\n\r\n\r");

    if(index < len) {
     var addressinfo = data[index];
     _self.verifyPayment(addressinfo.address, paymode, function(err, resData){
       if(err || !resData){
           console.log("Unable to get payment details from blockio for address:"+err, resData);
           return _self.processInfo(data, paymode, (index + 1), len, callback);
       }
       else if(resData && (resData.available_balance > 0 || resData.pending_received_balance > 0)){
           _self.unarchiveAddress(addressinfo.address, paymode, function(err, unarchrivedata){
               console.log("Address unarchrived.", addressinfo.address);
               return _self.processInfo(data, paymode, (index + 1), len, callback);
           });
       } else {
	       console.log(paymode + " Address detail not processed:",addressinfo.address);
            setTimeout(function(){
              return _self.processInfo(data, paymode, (index + 1), len, callback);
            }, 200);
       }

     });
    }
    else {
      return callback();
    }
  };

    _self.startWorker = function(callback) {
        co(function*() {
            _self.blockIoService.getArchriveAddress(function(err, data) {
                if (err || data.status == 'fail') {
                    callback(err, null);
                } else {
                    var addresses = data.addresses;
                    console.log(addresses.length);
                    _self.processInfo(addresses, "bitcoinBlockIO", 0, addresses.length, function() {
                        _self.blockIoLtcService.getArchriveAddress(function(err, ltcdata) {
                            if (err || ltcdata.status == 'fail') {
                                callback(err, null);
                            } else {
                                var ltcAddresses = ltcdata.addresses;
                                console.log(ltcAddresses.length);
                                _self.processInfo(ltcAddresses, "litecoinBlockIO", 0, ltcAddresses.length, function() {
                                    return callback(false, 'All Done ...');
                                });
                            }
                        });
                    });
                }
            });
        }).catch(function(err) {
            console.log("[Error] Unable to process verify payment: " + err);
            process.exit(0);
        });
    };

  return {
    execute: _self.startWorker
  }
}

//module.exports = ProcessArchiveAddresses;

crontab.scheduleJob("*/6 * * *", function() { // Every Day at 6:00 AM
    var lw = new ProcessArchiveAddresses();
    lw.execute(function(err, data) {
        console.log(err, data);
        process.exit(0);
    });
});