'use strict';

// Test specific configuration
// ===========================
module.exports = {
   // MongoDB connection options
   mongo: {
      uri: 'mongodb://localhost/icoin-test'
   },

   neo4j: {
      username: 'neo4j',
      password: 'message2681',
      uri: 'localhost:7474',
      protocol: 'http://'
   },

   paypal: {
      username: 'ravi-facilitator_api1.allies.co.in',
      password: '1378730966',
      signature: 'AFcWxV21C7fd0v3bYYYRCpSSRl31A-ll4.emr2fBr9SYmOHKTQHkpxBw',
      returnUrl: 'http://192.168.1.61:' + (process.env.PORT || '9000') + '/api/pay/success/return',
      cancelUrl: 'http://192.168.1.61:' + (process.env.PORT || '9000') + '/api/pay/cancel/return',
      sandbox: true,
      version: '78.0',
      currency: 'USD',
      solutionType: 'sole',
      category: 'Digital'
   },

   paymentMethods: {
      paypal: 'Paypal Express Checkout',
      ic: 'Internal Credits',
      stp: 'Solid Trust Pay',
      quickipay: 'Quicki Pay'
   },

   maxQuantityAllowed: 21,

   sponsorId: '563f306b8ec0996f20899aec' // Required to set this
};