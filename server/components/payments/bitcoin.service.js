'use strict';

var _ = require('lodash');
var config = require('./../../config/environment').bitcoin;
var CoinBaseClient = require('coinbase').Client;
var request = require('request');

module.exports = function() {

  var getCoinbaseApiOptions = function() {
    var coinbaseOpt = {
      'apiKey':config.apiKey,
      'apiSecret':config.apiSecret
    };

    if(config.isSandbox === true) {
      coinbaseOpt['baseApiUri'] = config.baseApiURL;
      coinbaseOpt['tokenUri'] = config.tokenURL;
    }

    return coinbaseOpt;
  }

  return {

    getPayInfo: function() {
      var payConfig = JSON.stringify(config);
      payConfig = new Buffer(payConfig, 'ascii');
      return payConfig.toString('base64');
    },

    getDetails: function(token, callback) {

      ec.get_details({token: token}, callback);
    },

    getAuthorizeURL: function(sessionToken) {

      return config.authorizeURL+'?client_id='+config.clientId+'&response_type=code&scope=wallet:buys:create,wallet:checkouts:create,wallet:checkouts:read,wallet:orders:create,wallet:orders:read,wallet:orders:refund,wallet:sells:create,wallet:transactions:read,wallet:user:email&redirect_uri='+encodeURIComponent(config.redirectURI)+sessionToken;
    },

    getTransactionInfo: function(transactionId, callback) {

      var client = new CoinBaseClient(getCoinbaseApiOptions());

      client.getAccount(config.accountId, function(err, account) {
        console.log('Account Info Loaded >>> ', transactionId);

        account.getTransaction(transactionId, function(err, tx) {
          callback(err, tx);
        });
      });
    },

    trasferToWallet: function(transferInfo, callback) {

      var client        = new CoinBaseClient(getCoinbaseApiOptions());
      var blockchainFee = config.blockchainFee;

      client.getAccount(config.accountId, function(err, account) {
        if(!err && account) {
          account.sendMoney({
            'to': transferInfo.toAddress,
            'amount': transferInfo.amount,
            'currency': transferInfo.currency,
            'idem': transferInfo.id,
            'description': transferInfo.description,
            'skip_notifications': false,
            'instant_exchange': true,
            'fee': blockchainFee
          }, function(_err, tx) {
            if(!_err && tx) {
              callback((err || _err), {accountInfo: {
                name: account.name,
                type: account.type,
                currency: account.currency,
                balance: account.balance
              }, sendMoney: {
                id: tx.id,
                type: tx.type,
                status: tx.status,
                amount: tx.amount,
                native_amount: tx.native_amount,
                description: tx.description,
                created_at: tx.created_at,
                updated_at: tx.updated_at,
                resource: tx.resource,
                resource_path: tx.resource_path,
                instant_exchange: tx.instant_exchange,
                idem: tx.idem,
                network: tx.network,
                to: tx.to,
                details: tx.details
              }});
            }
            else {
              callback(_err, {accountInfo: account, sendMoney: {}});
            }
          });
        }
        else {
          callback(err, {accountInfo: account, sendMoney: {}});
        }
      });
    },

    /* need to update */
    validateAccounts: function(accountName, callback) {
      //var isValid  = (/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,3}$/.test(accountName) === true);
      var isValid  = true;
      var data = {
        "return": [{
          "present": isValid
        }]
      };
      return callback((!isValid), data, null);
    }
  };

};
