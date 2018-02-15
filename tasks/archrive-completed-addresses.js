'use strict';

var mongoose = require('mongoose');
var config = require('./../server/config/environment');
var co = require('co');



mongoose.connect(config.mongo.uri, config.mongo.options);
mongoose.connection.on('error', function(err) {
    console.error('MongoDB connection error: ' + err);
    process.exit(-1);
});

mongoose.set('debug', true);

var WorkerData = require('./../server/api/payment/payment.model');
var BlockIoService = require('./../server/components/payments/block.io.service');
var BlockIoLtcService = require('./../server/components/payments/block.io.ltc.service');
var PayService = require('./../server/components/payments/pay.service');

var ArchriveCompletedAddresses = function() {
    var _self = this;
    _self.addresses = [];
    _self.ltcAddresses = [];
    _self.archriveIndex = 0;
    _self.blockIoService = new BlockIoService();
    _self.blockIoLtcService = new BlockIoLtcService();
    _self.payService = new PayService();

    _self.getData = function*(startDate, endDate) {
        return yield WorkerData.find({
            "$or": [{"paymode": 'bitcoinBlockIO'}, {"paymode": 'litecoinBlockIO'}, {"paymode2": 'bitcoinBlockIO'}],
            "status": {"$in": ['COMPLETED']},
            "createdAt": {"$gte": startDate, "$lte" : endDate }
        }).sort({createdat: 1}).exec();
    };

    _self.getBalance = function(TxAddress, payMode, callback) {
        if (payMode == 'litecoinBlockIO') {
            _self.blockIoLtcService.verifyPayment(TxAddress, callback);
        } else if (payMode == 'bitcoinBlockIO') {
            _self.blockIoService.verifyPayment(TxAddress, callback);
        }
    };
    _self.archriveAddress = function(addressString, callback) {
        _self.blockIoService.archriveAddress(addressString, callback);
    };

    _self.archriveLtcAddress = function(addressString, callback) {
        _self.blockIoLtcService.archriveAddress(addressString, callback);
    };

    _self.archriveAddressList = function(list, index, length, callback) {
        console.log("\n\r\n\r", 'Processing archrive cuncked array: ', index, length, "\n\r\n\r");
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

    _self.archriveLtcAddressList = function(list, index, length, callback) {
        console.log("\n\r\n\r", 'Processing archrive cuncked array: ', index, length, "\n\r\n\r");
        if (index < length) {
            var arr = list[index];
            var addressString = arr.join();
            _self.archriveLtcAddress(addressString, function(err, data) {
                console.log("Archrived addresses:" + err, data);
                return _self.archriveLtcAddressList(list, (index + 1), length, callback);
            });
        } else {
            callback();
        }
    };


    _self.processInfo = function(data, index, len, callback) {
        console.log("\n\r\n\r", 'Processing For: ', index, len, "\n\r\n\r");
        if (index < len) {
            var d = data[index];
            var TxAddress = d.gatewaydata.address;
            var payMode = d.paymode;
            _self.getBalance(TxAddress, payMode, function(err, resData) {
                if (err || !resData) {
                    console.log("Unable to get payment details from blockio for address:" + err, TxAddress);
                    return _self.processInfo(data, (index + 1), len, callback);
                } else if (resData && resData.available_balance == 0) {
                    if (d.paymode == "litecoinBlockIO") {
                        _self.ltcAddresses.push(TxAddress);
                    } else if (d.paymode == "bitcoinBlockIO") {
                        _self.addresses.push(TxAddress);
                    }
                    return _self.processInfo(data, (index + 1), len, callback);
                }
                //  else if (index == 0 && resData && resData.available_balance > 0) {
                //    console.log("Stop job because amount is not Withdrawal even from first address. No need to check for further addresses.");
                //    return callback();
                //  }
                else {
                    return _self.processInfo(data, (index + 1), len, callback);
                }
            });
        } else {
            if (_self.addresses.length > 0 || _self.ltcAddresses.length > 0) {
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

    _self.startWorker = function(startDate, endDate, callback) {
        co(function*() {
            let data = yield _self.getData(startDate, endDate);
            if (data && data.length > 0) {
                _self.processInfo(data, 0, data.length, function() {
                    return callback(false, 'All Done ...');
                });
            } else {
                console.log("No records found for payment verification.");
                process.exit(0);
            }
        }).catch(function(err) {
            console.log("[Error] Unable to process verify payment: " + err);
            process.exit(0);
        });
    };

    return {
        execute: _self.startWorker
    }
}

module.exports = ArchriveCompletedAddresses;