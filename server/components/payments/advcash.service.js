'use strict';

var _ = require('lodash');
var config = require('./../../config/environment').advcash;
var crypto = require('crypto');

module.exports = function() {

  return {

    getPayInfo: function(payAmont, orderId) {
      var payConfig = config;
      var hashString = payConfig.accountEmail + ':' + payConfig.sciName + ':' + payAmont + ':' + payConfig.currency + ':' + payConfig.secret + ':' + orderId;

      var hashSHA256 = crypto.createHash('sha256');
      hashSHA256.update(hashString);

      var payInfoConfig = {
        accountEmail: payConfig.accountEmail,
        cancelURL: payConfig.cancelURL,
        currency: payConfig.currency,
        notifyURL: payConfig.notifyURL,
        postURL: payConfig.postURL,
        returnURL: payConfig.returnURL,
        sciName: payConfig.sciName,
        sign: hashSHA256.digest('hex')
      };
      payInfoConfig = new Buffer(JSON.stringify(payInfoConfig), 'ascii');

      return payInfoConfig.toString('base64');
    },

    isValidReturnedInfo: function(data) {

      var hashString = data.ac_transfer + ':' + data.ac_start_date + ':' + data.ac_sci_name + ':' + data.ac_src_wallet + ':' + data.ac_dest_wallet + ':' + data.ac_order_id + ':' + data.ac_amount + ':' + data.ac_merchant_currency + ':' + config.secret;

      var hashSHA256 = crypto.createHash('sha256');
      hashSHA256.update(hashString);

      return ((data.ac_hash == hashSHA256.digest('hex')) || (data.token && data.token != '' && data.__uuid && data.__uuid != '' && data.PayerID.indexOf('?ac_src_wallet') >= 0));
    }

  };

};
