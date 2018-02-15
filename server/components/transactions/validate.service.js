/**
 * Generate a unique token for payment, withdrawals, transfer
 * and verify before user do anything related to payment, withdrawals, transfer
 */

'use strict';

var uuid = require('uuid');

var ValidateService = function(TokenValidatorModel) {

  var _self = this;

  // Validating Token
  _self.verifyRequest = function(userId, tokenType, tokenValue, callback) {

    return TokenValidatorModel.update({
      userid: userId+'',
      reqtype: tokenType,
      token: tokenValue
    }, {
      "$set": {
        "reqtype": tokenType,
        "token": uuid.v1()
      },
      "$inc": {"rev": 1}
    }, function(e, d) {
      console.log(d);
      if(e || !d || (d.nModified !== 1)) {

        return callback(true, 'Invalid Request, Required information is missing.');
      }

      return callback(false, null);
    });

  }

  _self.verifyUSDTransactionRequest = function(userId, tokenType, tokenValue, callback) {
    var token = uuid.v1();
    return TokenValidatorModel.update({
      userid: userId+'',
      reqtype: tokenType,
      token: tokenValue
    }, {
      "$set": {
        "reqtype": tokenType,
        "token": token
      },
      "$inc": {"rev": 1}
    }, function(e, d) {

      if(e || !d || (d.nModified !== 1)) {
        return callback(true, 'Invalid Request, Required information is missing.');
      }

      return callback(false, token);
    });

  }

  // Generate New Token
  _self.getRequestToken = function(userId, tokenType, callback) {

    var uniqueToken = uuid.v1();
    return TokenValidatorModel.update({
      userid: userId+''
    }, {
      "$set": {
        "reqtype": tokenType,
        "token": uniqueToken
      },
      "$inc": {"rev": 1}
    }, {"upsert": true}, function(e, d) {
      console.log(d);
      if(e) {
        return callback(true, 'Unable to take request.');
      }

      return callback(false, uniqueToken);
    });

  }

  return {
    isValid: _self.verifyRequest,
    getToken: _self.getRequestToken,
    isValidTransaction: _self.verifyUSDTransactionRequest
  }
}

module.exports = ValidateService;
