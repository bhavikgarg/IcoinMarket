'use strict';

var _ = require('lodash');
var config = require('./../../config/environment').paypal;
var PayPalEC = require('paypal-ec');

module.exports = function() {

  var ec = new PayPalEC({
    username  : config.username,
    password  : config.password,
    signature : config.signature
  }, {
    sandbox : config.sandbox,
    version : config.version
  });

  var identityInfo = '?__uuid=';

  var getPaymentParams = function(payInfo) {

    var paypalFee  = parseFloat((((payInfo.amount * config.paypalFee1) / 100) + config.paypalFee2).toFixed(2)),
        paidAmount = (payInfo.amount + paypalFee),
        unitPrice  = parseFloat((paidAmount / payInfo.quantity).toFixed(2));

    paidAmount = (unitPrice * payInfo.quantity);
    
    return {
      returnUrl                        : config.returnUrl + '/paypal' + identityInfo,
      cancelUrl                        : config.cancelUrl + '/paypal' + identityInfo,
      SOLUTIONTYPE                     : config.solutionType,
      PAYMENTREQUEST_0_AMT             : paidAmount,
      PAYMENTREQUEST_0_DESC            : payInfo.description,
      PAYMENTREQUEST_0_CURRENCYCODE    : config.currency,
      PAYMENTREQUEST_0_PAYMENTACTION   : payInfo.paymentAction,
      L_PAYMENTREQUEST_0_ITEMCATEGORY0 : config.category,
      L_PAYMENTREQUEST_0_NAME0         : payInfo.description,
      L_PAYMENTREQUEST_0_AMT0          : unitPrice, //payInfo.unitPrice,
      L_PAYMENTREQUEST_0_QTY0          : payInfo.quantity
    };
  }

  return {

    getToken: function(payInfo, callback) {

      console.log(getPaymentParams(payInfo), ' >>>> ');

      ec.set(getPaymentParams(payInfo), callback);
    },

    doPayment: function(payInfo, token, payerId, callback) {
      var params     = getPaymentParams(payInfo);
      params.TOKEN   = token;
      params.PAYERID = payerId;

      ec.do_payment(params, callback);
    },

    getDetails: function(token, callback) {

      ec.get_details({token: token}, callback);
    },

    setIdentify: function(identity) {
      identityInfo = identityInfo + identity;
    }

  };

};
