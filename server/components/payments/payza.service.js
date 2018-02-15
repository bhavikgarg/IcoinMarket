'use strict';

var _         = require('lodash');
var config    = require('./../../config/environment').payza;
var apiConfig = require('./../../config/environment').payzaAPIInfo;
var request   = require('request');
var crypto    = require('crypto');

module.exports = function() {

  return {
    validateAccounts: function(accountName, callback) {

      var isValid  = (/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,3}$/.test(accountName) === true);
      console.log(accountName, (/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,3}$/.test(accountName)));
      var data = {
        "return": [{
          "present": isValid
        }]
      };

      return callback((!isValid), data, null);
    },
    getPayInfo: function(payAmount, taxAmount) {
      var payConfig = config;

      var hashString = payConfig.apMerchant + ':' + payConfig.apPurchasetype + ':' + payAmount + ':' + payConfig.apItemname + ':' + payConfig.apCurrency + ':' + payConfig.apDiscountamount + ':' + taxAmount;

      var hashSHA256 = crypto.createHash('sha256');
      hashSHA256.update(hashString);

      payConfig = JSON.stringify(payConfig);
      payConfig = new Buffer(payConfig, 'ascii');
      return {payConfig: payConfig.toString('base64'), payHash: hashSHA256.digest('hex')};
    },

    getDetails: function(token, callback) {

      ec.get_details({token: token}, callback);
    },

    getIPNInfo: function(token, callback) {

      // Set the headers
      var headers = {
        'Content-Type': 'application/x-www-form-urlencoded'
      }

      // Configure the request
      var options = {
        url: 'https://secure.payza.com/ipn2.ashx',
        method: 'POST',
        headers: headers,
        form: {
          'token': token
        }
      };

      request(options, function (err, httpRequest) {

        if(err) {
          return callback(err, null);
        }

        var data = unescape(httpRequest.body),
            processedInfo = {};

        data = (data.split('&') || []);

        data.forEach(function(info) {
          var _info = info.split('=');
          processedInfo[_info[0]+''] = unescape(_info[1]);
        });

        return callback(null, processedInfo);
      });
    },

    validatePayment: function(data, payments) {
      var payConfig  = config;
      var isValid    = false;
      var parsedInfo = data;

      if(parsedInfo && parsedInfo['ap_merchant'] == payConfig.apMerchant) {
      var amount     = (parseFloat(data.ap_amount * data.ap_quantity) + parseFloat(data.ap_additionalcharges)).toFixed(2);
        var hashString = data.ap_merchant + ':' + data.ap_purchasetype + ':' + amount + ':' + data.ap_itemname.replace(/\+/g, ' ') + ':' + data.ap_currency + ':' + data.ap_discountamount + ':' + data.ap_additionalcharges;

        var hashSHA256 = crypto.createHash('sha256');
        hashSHA256.update(hashString);
        var dataHash = hashSHA256.digest('hex');

        isValid = ((dataHash == payments.paymentHash) && (parseInt(payConfig.apDiscountamount) == parseInt(data.ap_discountamount)));
      }

      return isValid;
    },

    sendMoney: function(receiver, amount, transferNote, callback) {

      // Set the headers
      var headers = {
        'Content-Type': 'application/x-www-form-urlencoded'
      }

      // Configure the request
      var options = {
        url: apiConfig.apiURL,
        method: 'POST',
        headers: headers,
        form: {
          "USER": apiConfig.user,
          "PASSWORD": apiConfig.pass,
          "AMOUNT": amount,
          "CURRENCY": apiConfig.currency,
          "RECEIVEREMAIL": receiver,
          "SENDEREMAIL": apiConfig.sender,
          "PURCHASETYPE": apiConfig.purchaseType,
          "NOTE": transferNote,
          "TESTMODE": apiConfig.testMode
        }
      };

      request(options, function (err, httpRequest) {

        if(err) {
          return callback(err, null);
        }

        var data = (httpRequest.body.split('&') || []),
            processedInfo = {};
        data.forEach(function(info) {
          var _info = info.split('=');
          processedInfo[_info[0]+''] = unescape(_info[1]);
        });

        callback(null, processedInfo);
      });
    }
  };

};
