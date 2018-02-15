'use strict';

var _ = require('lodash');
var Config = require('./../../config/environment');
var soap   = require('./adv-soap/soap');
var crypto = require('crypto');

module.exports = function() {

  var self = this;
  self.getClient = function(callback) {
    soap.createClient(Config.advcashWSDLInfo.url, callback);
  };

  self.getAuthenticationToken = function() {
    var currentDate  = new Date(),
        currentYear  = currentDate.getUTCFullYear().toString(),
        currentHours = currentDate.getUTCHours().toString(),
        currentMonth = (currentDate.getUTCMonth() + 1).toString();
        currentMonth = (currentMonth < 10 ? ('0' + currentMonth) : currentMonth),
        currentDate  = (currentDate.getUTCDate() < 10 ? '0' + currentDate.getUTCDate() : currentDate.getUTCDate()).toString();

    currentHours     = (currentHours < 10 ? '0'+currentHours : currentHours);
    var currentGMT   = currentYear+currentMonth+currentDate+':'+currentHours,
        hashSHA256   = crypto.createHash('sha256');
        hashSHA256.update(Config.advcashWSDLInfo.key + ':' + currentGMT);

    return hashSHA256.digest('hex');
  };

  self.getAccountArgs = function() {

    return {
      apiName: Config.advcashWSDLInfo.name,
      accountEmail: Config.advcashWSDLInfo.email,
      authenticationToken: self.getAuthenticationToken(),
      ipAddress: '',
      systemAccountName: ''
    }
  };

  return {

    findTransaction: function(advEmail, callback) {

      self.getClient(function(err, client) {

        if(!err) {

          client.findTransaction({
            arg0: self.getAccountArgs(),
            arg1: advEmail
          }, callback);
        }
        else {
          callback(new Error('Unable to validate user account existance'), null);
        }
      });
    },

    validateAccounts: function(advEmail, callback) {

      self.getClient(function(err, client) {

        if(!err) {

          client.validateAccounts({
            arg0: self.getAccountArgs(),
            arg1: advEmail
          }, callback);
        }
        else {
          callback(new Error('Unable to validate user account existance'), null);
        }
      });
    },

    sendMoney: function(info, callback) {

      self.getClient(function(err, client) {

        if(!err) {
          client.sendMoney({
            arg0: self.getAccountArgs(),
            arg1: info
          }, callback);
        }
        else {
          callback(new Error('Unable to send money'), null);
        }
      });
    }
  }

};
