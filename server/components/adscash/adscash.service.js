'use strict';

var _ = require('lodash');
var mongoose = require('mongoose');
var request = require('request');

module.exports = function() {
  var adsCashService = {
   adsCashLiveRate: function (callback) {
        return request.get({
            url: 'https://login.ads.cash/api/pay/currency-rate',
            headers: {'Content-Type': 'application/json'}
        }, callback);
    },
  };
  return adsCashService;
};
