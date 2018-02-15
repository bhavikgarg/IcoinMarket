'use strict';

var _       = require('lodash');
var systemConfig  = require('./../../config/environment');
var config  = systemConfig.blockIO;
var configWD  = systemConfig.blockIOWithdrawal;
var uuid = require('uuid');
var request = require('request');
var crypto  = require('crypto');
var BlockIo = require('block_io');
var version = 2; // API version
var block_io = new BlockIo(config.apiKey, config.apiSecret, version);
var Payment = require('./../../api/payment/payment.model');


function randomString(length, chars) {
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
}

module.exports = function() {
  return {
    myArchivedAddressList : [],
    network : '',
    getValidAddressFromList: function(callback) {
        let self = this;
          if(self.myArchivedAddressList.length){
              var index = _.random(0, self.myArchivedAddressList.length);
                console.log('Address index:',index);
                block_io.get_address_balance({ 'address': self.myArchivedAddressList[index].address }, function(err, data){
                  if(err || data.status == 'fail'){
                    //callback(err, null);
                    self.getValidAddressFromList(callback);
                  }
                  else if(data.data && (data.data.available_balance > 0 || data.data.pending_received_balance > 0 ))
                  {
                    block_io.unarchive_address({'addresses': self.myArchivedAddressList[index].address}, function(berr, bdata){
                      console.log(berr, bdata);
                      self.getValidAddressFromList(callback);
                    });
                  }
                  else{
                    block_io.unarchive_address({'addresses': self.myArchivedAddressList[index].address}, function(err_1, data_1){
                       if(err_1 || data_1.status == 'fail'){
                         console.log("Unable to unarchive_address:"+err_1, data_1);
                         self.getValidAddressFromList(callback);
                       }
                       else{
                         console.log("Successfully unarchive_address:"+data_1);
                         callback(null, {
                             status: 'success',
                             data: {
                                 network: self.network,
                                 user_id: self.myArchivedAddressList[index].user_id,
                                 address: self.myArchivedAddressList[index].address,
                                 label:  self.myArchivedAddressList[index].label
                             }
                         });
                       }
                    });
                  }
                });
          }
          else{
            block_io.get_my_archived_addresses({}, function(err, data){
              if(err || data.status == 'fail'){
                console.log("Unable to get archived address list:"+err, data);
                callback({error : err}, null);
              }
              else{
                self.network = data.data.network;
                self.myArchivedAddressList = data.data.addresses;
                //console.log(data.data.addresses);
                if(data.data && data.data.addresses && data.data.addresses.length){
                  var index = _.random(0, data.data.addresses.length);
                  console.log('Address index:',index);
                  block_io.get_address_balance({ 'address': self.myArchivedAddressList[index].address }, function(err, data){
                    if(err || data.status == 'fail'){
                      self.getValidAddressFromList(callback);
                    }
                    else if(data.data && (data.data.available_balance > 0 || data.data.pending_received_balance > 0 ))
                    {
                      block_io.unarchive_address({'addresses': self.myArchivedAddressList[index].address}, function(berr, bdata){
                        console.log(berr,bdata);
                        self.getValidAddressFromList(callback);
                      });
                    }
                    else{
                      block_io.unarchive_address({'addresses': self.myArchivedAddressList[index].address}, function(err_1, data_1){
                         if(err_1 || data_1.status == 'fail'){
                           console.log("Unable to unarchive_address:"+err_1, data_1);
                           self.getValidAddressFromList(callback);
                         }
                         else{
                           console.log("Successfully unarchive_address:"+data_1);
                           callback(null, {
                               status: 'success',
                               data: {
                                   network: self.network,
                                   user_id: self.myArchivedAddressList[index].user_id,
                                   address: self.myArchivedAddressList[index].address,
                                   label:  self.myArchivedAddressList[index].label
                               }
                           });
                         }
                      });
                    }
                  });
                }
                else{
                    callback({error : {message : 'Archive address list is empty'} }, null );
                }
              }
            });
          }
    },
    generateTxAddress: function(TxID, callback) {
      let self = this;
      block_io.get_new_address({'label': TxID}, function(err, data){
        console.log(data);
            if(err || (data && data.status == 'fail')){
              console.log("[Err] Blockio Address create error:"+err);
              self.getValidAddressFromList(callback);
            }
            else{
              callback(err, data);
            }
      });
    },
    estimateNetworkFee: function(toAddress, amount, callback) {
      block_io.get_network_fee_estimate({'to_address': toAddress, amount : amount }, callback);
    },
    currentRate : function(currency, callback){
      currency = (!currency? 'USD' : currency);
      block_io.get_current_price({'price_base': currency }, callback);
    },
    createNotification : function(address, callback){
      block_io.create_notification({'type': 'address', 'address': address, 'url': config.notificationUrl}, callback);
    },
    deleteNotification : function(id, callback){
      console.log("Delete notification called");
      block_io.delete_notification({'notification_id': id}, callback);
    },
    createTx : function(TxID, amount, callback){
      let self = this;
      self.generateTxAddress(TxID, function(err, data){
        if(err || (data && data.status == 'fail')){
          console.log("[Err] Blockio Address create error:"+err);
          callback({error : err }, null);
        }
        else{
          self.currentRate('USD', function(err_1, data_1){
            if(err_1 || (data_1 && data_1.status == 'fail')){
              console.log("[Err] Blockio get current rate error:"+err_1);
              callback({error : err_1 }, null);
            }
            else{
              var price = _.find(data_1.data.prices, function(o) {
                return (o.exchange === 'coinbase');
              });
              price = price || data_1.data.prices[0];
              var fee = (amount*config.blockchainFee/100);
              var paidAmount = (amount+fee);
              var btcfee = parseFloat(parseFloat(fee)/parseFloat(price.price)).toFixed(8);
                  paidAmount = parseFloat(parseFloat(paidAmount)/parseFloat(price.price)).toFixed(8);

              self.createNotification(data.data.address, function(err_2, data_2){
                 if(err_2 || data_2.status == 'fail'){
                     callback({error : err_2 }, null);
                 }
                 else{
                    callback(null, { fee : btcfee, amount : paidAmount, label: data.data.label, address : data.data.address, btnrt : price.price, notification_id : data_2.data.notification_id });
                 }
              });
              //callback(null, { fee : btcfee, amount : paidAmount, label: data.data.label, address : data.data.address, btnrt : price.price, notification_id : 'data_2.data.notification_id' });
            }
          });
        }
      });
    },
    createTestTx : function(TxID, amount, callback){
      let self = this;
      self.generateTxAddress(TxID, function(err, data){
        if(err || (data && data.status == 'fail')){
          console.log("[Err] Blockio Address create error:"+err);
          callback({error : err }, null);
        }
        else{
              var price =  { price : 1000 };
              var fee = (amount*config.blockchainFee/100);
              var paidAmount = (amount+fee);
              var btcfee = parseFloat(parseFloat(fee)/parseFloat(price.price)).toFixed(8);
                  paidAmount = parseFloat(parseFloat(paidAmount)/parseFloat(price.price)).toFixed(8);
              self.createNotification(data.data.address, function(err_2, data_2){
                 if(err_2 || data_2.status == 'fail'){
                     callback({error : err_2 }, null);
                 }
                 else{
                    callback(null, { fee : btcfee, amount : paidAmount, label: data.data.label, address : data.data.address, btnrt : price.price, notification_id : data_2.data.notification_id });
                 }
              });
        }
      });
    },
    createTxPayment : function(TxID, amount, callback){
      let self = this;
      if(config.testMode){
        self.createTestTx(TxID, amount, callback);
      }
      else {
        self.createTx(TxID, amount, callback);
      }
    },
    verifyPayment : function(address, callback){
      block_io.get_address_balance({'address': address}, function(err, data){
        if(err || data.status == 'fail'){
          callback(err, null);
        }
        else{
          callback(null, data.data);
        }
      });
    },
    archriveAddress : function(address, callback){
      block_io.archive_address({'address': address}, function(err, data){
        if(err || data.status == 'fail'){
          callback(err, null);
        }
        else{
          callback(null, data.data);
        }
      });
    },
    unarchriveAddress : function(address, callback){
        block_io.unarchive_address({'addresses': address}, function(err, data){
        if(err || data.status == 'fail'){
          callback(err, null);
        }
        else{
          callback(null, data);
        }
      });
    },
    getArchriveAddress : function(callback){
      block_io.get_my_archived_addresses({}, function(err, data){
        if(err || data.status == 'fail'){
          callback(err, null);
        }
        else{
          callback(null, data.data);
        }
      });
    },
    getUnArchriveAddress : function(callback){
      block_io.get_my_addresses({}, function(err, data){
        if(err || data.status == 'fail'){
          callback(err, null);
        }
        else{
          callback(null, data.data);
        }
      });
    },
    transferAmount : function(amount, address, apiSecret,callback){
      let token = randomString(32, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'),
          block_io_withdrawal = new BlockIo(configWD.apiKey, apiSecret, version);
          amount = parseFloat(amount).toFixed(8);

      block_io_withdrawal.withdraw({amounts : amount, to_addresses : address, nonce : token }, function(err, data){
        if(err || data.status == 'fail'){
          callback(err, data);
        }
        else{
          callback(null, data.data);
        }
      });
    },
    getBTCRate : function(callback) {
      let self = this;
      self.currentRate('USD', function(err, data) {
        if(config.testMode) {
          let result = {
                        	"status": "success",
                        	"data": {
                        		"network": "BTC",
                        		"prices": [{
                        			"price": "1000",
                        			"price_base": "USD",
                        			"exchange": "coinbase",
                        			"time": 1493113578
                        		}]
                        	}
                        };
           callback(null, result);
        } else {
          callback(err, data);
        }
      })
    }
  };
};
