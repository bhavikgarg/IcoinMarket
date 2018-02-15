'use strict';

var path = require('path');
var _ = require('lodash');

function requiredProcessEnv(name) {
   if (!process.env[name]) {
      throw new Error('You must set the ' + name + ' environment variable');
   }
   return process.env[name];
}

// All configurations will extend these options
// ============================================
var all = {
   env: process.env.NODE_ENV,

   // Root path of server
   root: path.normalize(__dirname + '/../../..'),

   // Server port
   port: process.env.PORT || 9000,

   // Server IP
   ip: process.env.IP || '0.0.0.0',

   // Should we populate the DB with sample data?
   seedDB: false,

   // Secret for session, you will want to change this and make it an environment variable
   secrets: {
      //session: 'aXh0hQNnTAxLGAzV3iHuNkPcbggQxUvGMzCBs3aEaPw5skJZ'
      //session: 'HADJU9bBMuFb5kC0ctEVOT706qa0qx076Eu6MEbxKTM8x05V119F'
      session: 'HADJU9bBMuFb5kC0ctEVOT706qa0qx076Eu6MEbxKTM8x0'
   },

   // List of user roles
   userRoles: ['guest', 'user', 'admin', 'solo', 'finance', 'watchuser', 'moderator', 'supervisor', 'support'],
   businessRoles: ['exchanger', 'trainer'],
   porfolioManagerRoles: ['manager','support', 'finance'],

   // MongoDB connection options
   mongo: {
      options: {
         db: {
            safe: true
         },
         server: {
            socketOptions: {
               keepAlive: 300000,
               connectTimeoutMS: 30000
            }
         }
         // replset: {
         //    rs_name: 'rs0',
         //    socketOptions: {
         //       keepAlive: 300000,
         //       connectTimeoutMS : 30000
         //    }
         // }
      }
   },

   facebook: {
      clientID: process.env.FACEBOOK_ID || 'id',
      clientSecret: process.env.FACEBOOK_SECRET || 'secret',
      callbackURL: (process.env.DOMAIN || '') + '/auth/facebook/callback'
   },

   google: {
      clientID: process.env.GOOGLE_ID || 'id',
      clientSecret: process.env.GOOGLE_SECRET || 'secret',
      callbackURL: (process.env.DOMAIN || '') + '/auth/google/callback'
   },

   generalogyRootId: 1,

   // paymentMethods: {
      //cdcard: 'Credit/Debit Card',
      //paypal: 'Paypal Express Checkout',
      //ic: 'Gold Coins',
      //stp: 'Solid Trust Pay (STP Fee: (3.50 % + 0.50)/0.96 USD)',
      //quickipay: 'Quicki Pay',
      //payza: 'Payza (Payza Fee: (3.90 % + 0.59)/0.96 USD)',
      //bitcoin: 'Bitcoin (CoinBase)',
   // },

   paymentMethods: {
      bitcoinBlockIO: 'bitcoin.png',
      litecoinBlockIO: 'litecoin.png',
      bitcoinBlockIOANDGC: 'cicio.png',
      ic: 'walletiv.png'
   },


   maxQuantityAllowed: 21,

   packsInfo: {
      adscash: {
         price: 25,
         coins: 1000,
         qty: 1
      }
      // gold: {
      //   price: 25,
      //   coins: 1000,
      //   qty: 1
      // },
      // silver: {
      //   price: 25,
      //   coins: 1000,
      //   qty: 1
      // }
   },

   execIncentive: {
      'text': {
         low: 5,
         medium: 10,
         high: 15
      },
      'fbshare': {
         low: 20,
         medium: 30,
         high: 40
      },
      'fblike': {
         low: 20,
         medium: 30,
         high: 40
      }
   },

   productSubTypes: [{
      key: 'normal',
      label: 'Normal'
   }, {
      key: 'soloemail',
      label: 'Solo Email'
   }, {
      key: 'dailyads',
      label: 'Daily Login Ads'
   }],

   signupBonus: {
      usd: 10,
      description: 'Signup bonus'
   },

   defTarget: 'b4433c50-b85e-11e5-9a14-c9612f4d8447',

   wsdlInfo: {
      url: 'http://demozone.in/ci/clickservices.asmx?wsdl',
      key: 'click@k#gg57hGw(jG%_5g$123'
   },

   advcashWSDLInfo: {
      url: 'https://wallet.advcash.com:8443/wsm/merchantWebService?wsdl',
      key: '',
      name: 'Adscash-API',
      email: 'finance@adscash.us'
   },

   paypalLimit: 150,

   earnCreditLimit: {
      gold: 100,
      silver: 100
   },

   payouts: ['bitcoin', 'ethtoken'],

   payoutLimit: 100, // In USD i.e. $100,

   defaultTextAds: ['582ae2e75675107d251acebc', '582ae2e75675107d251acebd', '582ae2e75675107d251acebe', '582ae2e75675107d251acebf', '582ae2e75675107d251acec0', '582ae2e75675107d251acec1', '582ae2e75675107d251acec2', '582ae2e75675107d251acec3', '582ae2e75675107d251acec4', '582ae2e75675107d251acec5', '583ff6fc3ef441246bbe491c'],

   blockedIds: [],
   noLimitFundTransferUsers: ["569764a66110ef9f6810c2ea"],
   sansibleAdminEmail: 'sansible-admin@adscash.us',

   /**
    * KYC MODULE ==========================================================================================================
    *-----------
    * Roles
    * ======
    * Moderator Can verify , but cannot approve
    * Supervisor Can Approve, but cannot verify
    * Admin Can both Approve and verify
    * Rest all cannot do anything
    */
   kycRole: {
      admin: {
         canApprove: true,
         canVerify: true
      },
      supervisor: {
         canApprove: true,
         canVerify: false
      },
      moderator: {
         canApprove: false,
         canVerify: true
      }
   },

   /**
    * Status
    * ======
    * PENDING : User has applied for verification and cannot edit his details till he is rejected
    * UNVERIFIED : Users initial state, can edit his KYC records
    * ONHOLD : Admin defined status for further review, user cannot edit his kyc
    * REJECTED : Kyc Rejected, user can again apply for verification and can edit his details
    * APPROVED : KYC verified now user cannot edit his kyc records
    */
   kycFlagsList: ["PENDING", "UNVERIFIED", "ONHOLD", "REJECTED", "APPROVED", "VERIFIED"],

   kycFlags: {
      kycPendingFlag: {
         status: "PENDING",
         text: "Pending Verification",
         approvalStatus: false,
         canEdit: false
      },
      kycUnverifiedFlag: {
         status: "UNVERIFIED",
         text: "Unverified",
         approvalStatus: false,
         canEdit: true
      },
      kycHoldFlag: {
         status: "ONHOLD",
         text: "On Hold",
         approvalStatus: false,
         canEdit: false
      },
      kycVerifiedFlag: {
         status: "VERIFIED",
         text: "Verified",
         approvalStatus: false,
         canEdit: false
      },
      kycRejectedFlag: {
         status: "REJECTED",
         text: "Rejected",
         approvalStatus: false,
         canEdit: true
      },
      kycApprovedFlag: {
         status: "APPROVED",
         text: "Pending Verification",
         approvalStatus: true,
         canEdit: false
      }
   },

   /**
    * Allowed File Types
    * ==================
    */
   kycUploadFileTypes: ["image/png", "image/jpeg", "image/jpg"],

   /**
    * Allowed Upload Doctypes
    * ==================
    */

   kycAllowedDocs: {
      NA: {
         text: "Not Available",
         key: 'NA'
      },
      OTHERS: {
         text: "Other Government issued ids",
         key: 'OTHERS'
      },
      DL: {
         text: "Driving Licence",
         key: "DL"
      },
      PASSPORT: {
         text: "PASSPORT",
         key: "PASSPORT"
      }
   },

    trade_packages: {
      'aggressive': {
         maintenance_fee: 60,
         maturityPeriod: 3
      },
      'distributive': {
         maintenance_fee: 40,
         maturityPeriod: 6
      },
      'safe': {
         maintenance_fee: 30,
         maturityPeriod: 12
      },
      'stable': {
         maintenance_fee: 20,
         maturityPeriod: 18
      },
      'fixed': {
         maintenance_fee: 10,
         maturityPeriod: 24
      },
      'agile' : {
        maintenance_fee : 0,
        maturityPeriod : 4
      }
    },

    fixed_profit : {
      packages : ['Agile'],
      profitpercent : 0.2918
    },
   /**
    * END OF KYC MODULE ===================================================================================================
    *------------------
    */

   apiConstants: {
      L1_QUALIFIED: 100,
      L2_QUALIFIED: 1000,
      L3_QUALIFIED: 10000,

      USD_TRANSFER_FEE: 2,
      WITHDRAWAL_ADMIN_FEE: 2,
      REPURCHASE_PERCENT: 0,
      STATUS_PENDING: 'PENDING',
      STATUS_COMPLETED: 'COMPLETED',
      STATUS_CANCELLED: 'CANCELLED',
      STATUS_COMMITTED: 'COMMITTED',
      STATUS_ON_TRADE: 'ON TRADE',
      STATUS_MATURED: 'MATURED',
      STATUS_WITHDRAWN: 'WITHDRAWN',
      STATUS_MATURED_WITHDRAWN: 'MATURED_WITHDRAWN',
      STATUS_MATURED_PROFIT_WITHDRAWN: 'MATURED_PROFIT_WITHDRAWN',
      MIN_COMMITMENT_LIMIT: 100,
      MIN_WITHDRAWAL_LIMIT: 25,
      MAX_WITHDRAWAL_LIMIT: 500,
      MIN_ADC_WITHDRAWAL_LIMIT: 100,
      MAX_ADC_WITHDRAWAL_LIMIT : 100,
      TOTAL_SUPPLY: 300000000,
      GC_USE: 0.75,
      APPRECIATION_PERCENTAGE: 1,
      APPRECIATION_RATE_INCREMENT: 0.004,
      OTP_TIME_LIMIT: 10,
      MIN_ADD_FUND_BUSINESS_USER: 2500,
   },
   minPaginationLimit: 25,
   maxPaginationLimit: 50,
   textAdsDailyLimit: 10,
   adscash_current_rate: 0.14,
   compoffUsers: [],
   compoffUsersAtLevel7: []
};

// Export the config object based on the NODE_ENV
// ==============================================
module.exports = _.merge(
   all,
   require('./' + process.env.NODE_ENV + '.js') || {});
