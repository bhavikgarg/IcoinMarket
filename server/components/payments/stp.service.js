'use strict';

var _       = require('lodash');
var config  = require('./../../config/environment').stp;
var request = require('request');
var crypto  = require('crypto');

module.exports = function() {

  return {

    getPayInfo: function() {
      var payConfig = JSON.stringify(config);
      payConfig = new Buffer(payConfig, 'ascii');
      return payConfig.toString('base64');
    },

    isValidReturnedInfo: function(payment, stpResponse) {
      return (stpResponse.ACK === "COMPLETE" && parseFloat(stpResponse.AMOUNT) === parseFloat(payment.paidamount) && stpResponse.ITEMID === "Gold Packs");
    },

    validateAccounts: function(accountName, callback) {

      var isValid  = (/^([0-9a-zA-Z\.\-\_]{3,16})$/.test(accountName) === true);
      console.log(accountName, (/^([0-9a-zA-Z\.\-\_]{3,16})$/.test(accountName)));
      var data = {
        "return": [{
          "present": isValid
        }]
      };

      return callback((!isValid), data, null);
    },

    transerFunds: function(payoutInfo, callback) {

      var apiKey    = config.apiName,
          apiSecret = config.apiPass,
          postUrl   = config.payoutApiUrl,
          secureUp  = 's+E_a*',
          testMode  = (config.testMode === 'ON' ? 1 : 0),
          headers   = {
            'Content-Type': 'application/x-www-form-urlencoded'
          };

      apiSecret = crypto.createHash('md5').update(apiSecret+secureUp).digest("hex");

      // Configure the request
      var options = {
        url: postUrl,
        method: 'POST',
        headers: headers,
        form: {
          "user": payoutInfo.user,
          "api_id": apiKey,
          "api_pwd": apiSecret,
          "amount": payoutInfo.amount,
          "paycurrency": config.currency,
          "comments": payoutInfo.comment,
          "fee": 0,
          "udf1": payoutInfo.customInfo1,
          "udf2": payoutInfo.customInfo2,
          "testmode": testMode
        },
        timeout: 5000
      };

      console.log('Payment Request: ', JSON.stringify(options));

      request(options)
      .on('response', function(response) {
        var responseInfo    = response.toJSON(),
            responseHeaders = responseInfo.headers;
        if(
          !responseHeaders.etag &&
          responseHeaders['cache-control'] === 'no-cache' &&
          typeof responseHeaders['transfer-encoding'] === 'undefined'
        ) {
          console.log('[err] STP Not Return Data: ', JSON.stringify(responseInfo));
          return callback('Unable to pay, as STP account balance is low.', 1);
        }
        else {
          console.log('[info] Wating For STP Response...', JSON.stringify(responseInfo));
        }
      })
      .on('error', function(err) {
        
        if(err && err.code !== 'ETIMEDOUT') {
          return callback(err, null);
        }

        if(err && err.code === 'ETIMEDOUT' && err.connect === true) {
          return callback(null, {
            amount: payoutInfo.amount,
            username: payoutInfo.user,
            status: 'PROCESSING',
            transactionid: '-'
          });
        }
        else {
          return callback('Unable to connect with STP, Please wait some time and then request', 1);
        }
      })
      .on('data', function (httpRequest) {
        
        httpRequest = (new Buffer(httpRequest)).toString();
        if(httpRequest.indexOf('DECLINED:!ERROR!') >=0)  {
          console.log('[err]', httpRequest);
          return callback(httpRequest, null);
        }

        var data = (httpRequest.split('\n\n') || []),
            processedInfo = {};

        if(data && data[0] && data[0] === 'An error occurred during the transaction') {
          console.log('[err]', httpRequest);
          return callback('STP Response: An error occurred during the transaction', 1);
        }

        try {
          data.forEach(function(info) {
            if(info.indexOf(' is ') >= 0) {
              var _info = info.split(' is ');
            }
            else {
              var _info = info.replace(/(\s+)/g,'').split('=');
            }

            processedInfo[_info[0].trim().toLowerCase()+''] = unescape(_info[1].trim());
          });

          console.log('[info] STP Response: ', processedInfo, httpRequest);
          return callback(null, processedInfo);
        }
        catch(e) {
          console.log('[err] Catch STP Response: ', httpRequest);
          return callback('STP Response: ' + httpRequest, 1);
        }

      });
    }
  };
};
