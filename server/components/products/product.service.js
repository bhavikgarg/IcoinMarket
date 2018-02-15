'use strict';

var _ = require('lodash');
var Products = require('../../api/products/products.model');
var config   = require('./../../config/environment');
var http     = require('http');

module.exports = function() {

  return {

    isDTCreditPurchase: function(productid, callback) {
      var productTypes = config.productTypes,
          dtCredits    = productTypes[1].key;
      Products.findOne({_id: productid+'', ptype: dtCredits}, function(err, data) {
        console.log('Error: While validating products ', err);
        callback(!(!data));
      });
    },

    getPurchaseProductType: function(productid, callback) {
      var productTypes = config.productTypes;
      if(productid === 'gold' || productid === 'silver') {
        callback({
          silverCoins: (productid === 'silver'),
          goldCoins: (productid === 'gold'),
          dtCredits: false,
        });
      }
      else {
        Products.findOne({_id: productid+''}, function(err, data) {
          console.log('Error: While validating products ', err);
          callback({
            silverCoins: (data.ptype==productTypes[0].key),
            goldCoins: (data.ptype==productTypes[1].key),
            dtCredits: (data.ptype==productTypes[2].key),
          });
        });
      }
    },

    getProductTypes: function() {
      return {types: config.productTypes};
    },

    getExecIncentives: function( type ) {
      return config.execIncentive[type];
    },

    isValidContnetUrl: function(contentURL, userAgent, callback) {
      var request = http.request({
        host: contentURL.host,
        path: '/',
        headers: {
          'User-Agent': userAgent
        }
      }, function (_res) {
        var validUrl   = false,
            xFrameOpt  = _res.headers['x-frame-options'],
            statusCode = _res.statusCode;

        validUrl = (typeof xFrameOpt == 'undefined') || (typeof xFrameOpt != 'undefined' && xFrameOpt.toLowerCase() !== 'sameorigin');
        validUrl = (validUrl && (statusCode >=200 && statusCode < 400));

        return callback({
          valid: validUrl,
          'default': true,
          error: (!validUrl ? 'Invalid URL OR Unable to load URL in iFrame' : '')
        });
      });

      request.on('error', function (e) {
        return callback({valid: false, 'default': false, error: 'Unable to validate specified URL'});
      });

      request.end();
    }
  }

};
