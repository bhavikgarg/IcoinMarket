'use strict';

// Development specific configuration
// ==================================
module.exports = {
   // Server IP
   ip: (process.env.IP || '0.0.0.0'),

   // MongoDB connection options
   mongo: {
      uri: 'mongodb://localhost/icoin-dev'
   },

   neo4j: {
      username: 'neo4j',
      password: 'Gemini@123', // This must include : before password
      uri: 'localhost:7474',
      protocol: 'http://'
   },

   protocol: 'http://',
   appDomain: 'icoindevelop.com:9000',
   emailDomain: 'http://icoindevelop.com:9000',
   captchaKey : '6Lco5SUUAAAAAGaNg_t5U9f3hN3TfaTN8iFsMD0a',
   clickintensityApiDomain: 'http://cidevelop.com:9001',
   clickintensityIntermidiator: {
      email: 'ad_ci_intermediator@ci.com',
      password: 'password123'
   },

   ICM_PRE_LAUNCH_TIME:14984712000,//  18471200000,

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
      //apiKey: 'a505-c11c-6acc-7b67',
      //apiKey : '283c-4aa1-fcfd-11ea',
      // apiKey: '4a07-e5e9-8f33-85bc',
      apiKey: '46f8-66cc-8c2b-c375',
      apiSecret: 'Gemini123',
      testMode: 1,
      currency: 'USD',
      blockchainFee: 5,
      network : 'BTCTEST',
      walletAddress: '3JtHpQzbEtLohwe1GSNAWsJDLqwyqBFSfm',
      notificationUrl: 'http://138.197.103.162/api/pay/notify-blockio-payment'
   },

    blockIOWithdrawal: {
        apiKey : '46f8-66cc-8c2b-c375',
        apiSecret: 'Gemini123',
        testMode : 1,
        currency: 'USD'
    },

    adscashWithdrawal: {
        transactionURL: 'http://localhost:3000/v1/api/token/transfer',
        account: '0x5cb1FFD42dea0aFeEfb8950AdCB2B6e5Cff2Efc3',
        secret: 'password',
        token : 'ADS'
    },

   ltcBlockIO: {
      apiKey: 'daaf-ca36-4e4f-62f9',
      apiSecret: 'Gemini123',
      testMode: 0,
      currency: 'USD',
      blockchainFee: 5,
      network : 'LTC',
      walletAddress: '3JtHpQzbEtLohwe1GSNAWsJDLqwyqBFSfm',
      notificationUrl: 'http://staging.icoinmarket.com/api/pay/notify-blockio-payment'
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

   seedDB: false,
   sponsorId: '569764a66110ef9f6810c2ea', //'570bc5eb9ca37256a57e299b',
   sponsorUn: 'icoincompany', //'admin',

   facebook: {
      clientID: '1506331292762284',
      clientSecret: 'edea94fced3b7071f051e65d9604c913',
      callbackURL: 'http://icoindevelop.com:9000/auth/facebook/callback'
   },

   google: {
      clientID: '122309111622-par95gaml2f670sn4sp1oteu8fr4bgce.apps.googleusercontent.com',
      clientSecret: 're8xo1aHhroJmtGDpuL-BkaG',
      callbackURL: 'http://icoindevelop.com:9000/auth/google/callback'
   },

   email: {
      service: '192.168.1.1',
      userName: '',
      userPass: '',
      mailFrom: '',
      fromName: 'ICoin',
      apiKey: '',
      withdrawalEmailTo1: '',
      withdrawalEmailTo2: '',
      defaultOriginUrl: 'http://icoindevelop.com:9000'
   },

   maxQuantityAllowed: 4000,
   dtCreditUnit: 10, // 10 seconds for 1 DT-Credit
   minViewTime: 10, // 10 seconds
   flagUrl: 'http://www.geonames.org/flags/x/FLAG_COUNTRY_CODE.gif',

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
