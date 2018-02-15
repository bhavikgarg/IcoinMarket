'use strict';

var mongoose = require('mongoose');
var config = require('./../server/config/environment');
var crontab = require('node-crontab');
var co = require('co');

mongoose.connect(config.mongo.uri, config.mongo.options);
mongoose.connection.on('error', function(err) {
    console.error('MongoDB connection error: ' + err);
    process.exit(-1);
});

var WorkerData = require('./../server/api/payment/payment.model');
var BlockIoService = require('./../server/components/payments/block.io.service');
var BlockIoLtcService = require('./../server/components/payments/block.io.ltc.service');

var ProcessUnarchiveAddresses = function() {

    var _self = this;
    _self.addresses = [];
    _self.ltcAddresses = [];
    _self.blockIoService = new BlockIoService();
    _self.blockIoLtcService = new BlockIoLtcService();

    _self.archriveAddress = function(addressString, callback) {
        _self.blockIoService.archriveAddress(addressString, callback);
    };

    _self.archriveLtcAddress = function(addressString, callback) {
        _self.blockIoLtcService.archriveAddress(addressString, callback);
    };

    _self.archriveAddressList = function(list, index, length, callback) {
        console.log("\n\r\n\r", 'Processing archrive chuncked array: ', index, length, "\n\r\n\r");
        if (index < length) {
            var arr = list[index];
            var addressString = arr.join();
            _self.archriveAddress(addressString, function(err, data) {
                console.log("Archrived addresses:" + err, data);
                return _self.archriveAddressList(list, (index + 1), length, callback);
            });
        } else {
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
      } else{
        callback();
      }
    };

    _self.processInfo = function(data, paymode, index, len, callback) {
        console.log("\n\r\n\r", 'Processing For: ', index, len, "\n\r\n\r");

        if (index < len) {
            var addressinfo = data[index];
            console.log(addressinfo);
            WorkerData.findOne({
                status: 'PENDING',
                paymode: paymode,
                'gatewaydata.address': addressinfo.address
            }, function(werr, wdata) {
                if (werr || wdata || addressinfo.available_balance > 0 || addressinfo.pending_received_balance > 0 || addressinfo.address == config.blockIO.walletAddress || addressinfo.address == config.ltcBlockIO.walletAddress) {
                    console.log("Tx is in pending state or address has available balance:" + werr, wdata, addressinfo);
                    return _self.processInfo(data, paymode, (index + 1), len, callback);
                } else {
                    console.log("Address need to be archrive:", addressinfo);
                    if (paymode == "litecoinBlockIO") {
                        _self.ltcAddresses.push(addressinfo.address);
                    } else {
                        _self.addresses.push(addressinfo.address);
                    }
                    return _self.processInfo(data, paymode, (index + 1), len, callback);
                }
            });
        } else {
            //return callback();
            if (_self.addresses.length > 0 || _self.ltcAddresses.length > 0){
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
            } else {
                return callback();
            }
        }
    };

    _self.startWorker = function(callback) {
        co(function*() {
            _self.blockIoService.getUnArchriveAddress(function(err, data) {
                if (err || data.status == 'fail') {
                    callback(err, null);
                } else {
                    var addresses = data.addresses;
                    console.log("bitcoinBlockIO addresses length: " + addresses.length);
                    _self.processInfo(addresses, "bitcoinBlockIO", 0, addresses.length, function() {
                        _self.addresses = [];
                        _self.blockIoLtcService.getUnArchriveAddress(function(err, ltcdata) {
                            if (err || ltcdata.status == 'fail') {
                                callback(err, null);
                            } else {
                                var ltcAddresses = ltcdata.addresses;
                                console.log("litecoinBlockIO addresses length: " + ltcAddresses.length);
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

//module.exports = ProcessUnarchiveAddresses;

crontab.scheduleJob("*/6 * * *", function() { // Every Day at 6:00 AM
    var lw = new ProcessUnarchiveAddresses();
    lw.execute(function(err, data) {
        console.log(err, data);
        process.exit(0);
    });
});