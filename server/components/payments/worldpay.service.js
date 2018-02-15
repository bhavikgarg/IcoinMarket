'use strict';

var _ = require('lodash');
var config = require('./../../config/environment').worldPay;
var request = require('request');

module.exports = function() {

  return {

    getPayInfo: function() {
      var payConfig = JSON.stringify(config);
      payConfig = new Buffer(payConfig, 'ascii');
      return payConfig.toString('base64');
    },

    getDetails: function(token, callback) {

      ec.get_details({token: token}, callback);
    }

  };

};