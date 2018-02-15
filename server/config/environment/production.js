'use strict';

// Development specific configuration
// ==================================
module.exports = {
   // Server IP
   ip: (process.env.IP || '0.0.0.0'),

   // MongoDB connection options
   mongo: {
      uri: 'mongodb://10.132.116.22:27017/icoin'
   },

   neo4j: {
      username: 'neo4j',
      password: 'icmneo4jlive', // This must include : before password
      uri: 'localhost:7474',
      protocol: 'http://'
   },

   protocol: 'https://',
   appDomain: 'login.icoinmarket.com',
   emailDomain: 'https://login.icoinmarket.com',
   captchaKey : '6Lco5SUUAAAAAGaNg_t5U9f3hN3TfaTN8iFsMD0a',
   ICM_PRE_LAUNCH_TIME: 1498471200000, // Time is set to 26th June 2017, 3:30 IST which is ICM pre launch launch time

   paypal: {
      username: '',
      password: '',
      signature: '',
      returnUrl: 'http://' + (process.env.IP || 'icoindevelop.com') + ':' + (process.env.PORT || '9000') + '/api/pay/success/return',
      cancelUrl: 'http://' + (process.env.IP || 'icoindevelop.com') + ':' + (process.env.PORT || '9000') + '/api/pay/cancel/return',
      sandbox: true,
      version: '95',
      currency: 'USD',
      solutionType: 'sole',
      category: 'Digital',
      paypalFee1: 5,
      paypalFee2: 0.5
   },

   payza: {
      apMerchant: '',
      apPurchasetype: 'item',
      apItemname: 'Gold Packs',
      apAmount: 25,
      apCurrency: 'USD',
      apItemcode: 'gold',
      apDescription: 'Adscash - Gold Packs',
      apReturnurl: 'http://localhost:' + (process.env.PORT || '9000') + '/api/pay/success/return',
      apCancelurl: 'http://localhost.com:' + (process.env.PORT || '9000') + '/api/pay/cancel/return',
      apAlerturl: 'http://localhost.com:' + (process.env.PORT || '9000') + '/api/pay/notify',
      apTaxamount: 0,
      apAdditionalcharges: 3.90,
      apShippingcharges: 0,
      apDiscountamount: 0,
      apPostURL: 'https://secure.payza.com/checkout',
      apPayzaFee: 0.59,
      apPayzaFeeDivision: 0.96
   },

    blockIO: {
       apiKey: '3f23-881d-7f91-dd84', // info@icoinmarket.com
       apiSecret: 'P5Hz4Mb2AGgtjAByE6ddY',
       testMode: 0,
       currency: 'USD',
       network : 'BTC',
       blockchainFee: 5,
       walletAddress: '3NdsEyA3fprYbXo2gVQERd9yadQAhyuiM9',
       notificationUrl: 'https://api.icoinmarket.com/api/pay/notify-blockio-payment'
    },

    ltcBlockIO: {
   //    apiKey: 'daaf-ca36-4e4f-62f9',
       apiKey: 'f320-664e-13eb-1474',
       apiSecret: 'P5Hz4Mb2AGgtjAByE6ddY',
       testMode: 0,
       currency: 'USD',
       blockchainFee: 5,
       network : 'LTC',
       walletAddress: '3JtHpQzbEtLohwe1GSNAWsJDLqwyqBFSfm',
       notificationUrl: 'http://staging.icoinmarket.com/api/pay/notify-blockio-payment'
    },

   blockIOWithdrawal: {
     apiKey : '24ed-d996-01e5-25e3',
     apiSecret: 'LMGbazuka999round',
     testMode : 0,
     currency: 'USD'
   },

   stp: {
      merchantAccount: '', //'rmtestacc',
      buttonName: '',
      testMode: 'ON',
      itemName: '',
      currency: 'USD',
      notifyURL: 'http://icoindevelop.com:' + (process.env.PORT || '9000') + '/api/pay/notify',
      returnURL: 'http://icoindevelop.com:' + (process.env.PORT || '9000') + '/api/pay/success/return',
      confirmURL: 'http://icoindevelop.com:' + (process.env.PORT || '9000') + '/api/pay/confirm',
      cancelURL: 'http://icoindevelop.com:' + (process.env.PORT || '9000') + '/api/pay/cancel/return',
      processingFee: 3.5,
      addOnProcessingFee: 0.5,
      processingFeeDivision: 0.96,
      postURL: 'https://solidtrustpay.com/handle.php',
      apiName: '', // 'Testing-123',
      apiPass: '', // ')SSax=F5jBB!!f9',
      payoutApiUrl: 'https://solidtrustpay.com/accapi/process.php',
   },

   advcash: {
      accountEmail: '',
      sciName: 'Adscash',
      currency: 'USD',
      sign: '',
      postURL: 'https://wallet.advcash.com/sci/',
      secret: '',
      returnURL: 'http://icoindevelop.com:' + (process.env.PORT || '9000') + '/api/pay/success/return',
      cancelURL: 'http://icoindevelop.com:' + (process.env.PORT || '9000') + '/api/pay/cancel/return',
      notifyURL: 'http://icoindevelop.com:' + (process.env.PORT || '9000') + '/api/pay/notify'
   },

   productTypes: [{
      'key': 'silver',
      'name': 'Silver Coins'
   }, {
      'key': 'gold',
      'name': 'Gold Coins'
   }, {
      'key': 'dtcredits',
      'name': 'DT Credits'
   }],

   withdrawals: {
      gateways: ['stp', 'advcash'], //, 'advcash', 'bitcoin'],
      instantlimit: 0, // USD
      payoutafter: 1, // in days
      coinsLimit: {
         bitcoin: 4000,
         others: 1000
      }
   },

   paymentMethods: {
      bitcoinBlockIO: 'bitiocn.png',
      bitcoinBlockIOANDGC: 'cicio.png',
      ic: 'walletiv.png'
   },

   seedDB: false,
   sponsorId: '569764a66110ef9f6810c2ea', //'570bc5eb9ca37256a57e299b',
   sponsorUn: 'icoincompany', //'admin',

   facebook: {
      clientID: '1960194467340037',
      clientSecret: 'ee1fd65e8a70bdef9a0a750c471959d8',
      callbackURL: 'https://login.icoinmarket.com/auth/facebook/callback'
   },

   google: {
      clientID: '122309111622-par95gaml2f670sn4sp1oteu8fr4bgce.apps.googleusercontent.com',
      clientSecret: 're8xo1aHhroJmtGDpuL-BkaG',
      callbackURL: 'https://login.icoinmarket.com/auth/google/callback'
   },

   email: {
	service: '192.168.1.1',
	userName: 'icoin-live',
	userPass: '',
	mailFrom: 'arvind.kumar@geminisolutions.in',
	fromName: 'Icoin Market',
	apiKey: 'fFRMlctvFGJKiF94a1N68Q',
	withdrawalEmailTo1: 'arvind.kumar@geminisolutions.in',
	withdrawalEmailTo2: 'arvind.kumar@geminisolutions.in',
	defaultOriginUrl: 'https://login.icoinmarket.com'
   },

   maxQuantityAllowed: 4000,
   dtCreditUnit: 10, // 10 seconds for 1 DT-Credit
   minViewTime: 10, // 10 seconds
   flagUrl: 'https://login.icoinmarket.com/assets/images/flags/FLAG_COUNTRY_CODE.png',

   advcashWSDLInfo: {
      url: 'https://wallet.adscash.com:8443/wsm/merchantWebService?wsdl',
      // key: 'Ravi~2009',
      // name: 'adscash-api',
      // email: 'ravi@allies.co.in',
      // adminFee: 2
      key: 'password123',
      name: 'adscash-api',
      email: 'arvind.kumar@geminisolutions.in',
      adminFee: 2
   },

   payzaAPIInfo: {
      apiURL: 'https://api.payza.com/svc/api.svc/sendmoney',
      user: 'finance@adscash.us',
      pass: 'finance~45Ad',
      currency: 'USD',
      sender: 'finance@adscash.us',
      purchaseType: 3,
      testMode: 1,
      adminFee: 1
   },

   allowCommissionAllLevel: ['564b0c86588917570d2c5360', '564abb5e0339b72903a59e00'],

   //AWS Development Keys
   aws: {
      accessKeyId: 'AKIAIXLH5QR6LXQENSOQ',
      secretAccessKey: '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',
      bucket: 'acassets-dev',
      region: 'us-east-1'
   }
};
