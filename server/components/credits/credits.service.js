'use strict';

var _ = require('lodash');
var Credits = require('../../api/credits/credits.model');
var CreditLogs = require('../../api/credits/credit-logs.model');
var CommissionLogs = require('../../api/credits/commission-log.model');
var Payments = require('../../api/payment/payment.model');
var ViewCampaign = require('../../api/campaign/viewcampaignlog.model');
var Campaign = require('../../api/campaign/campaign.model');
var ActivePacks = require('../../api/payment/activesilverpacks.model');
var CurrencyRate = require('../../api/payment/currency-rate.model');
var Withdrawals = require('../../api/withdrawal/withdrawal.model');

/**
 * credit component.
 * @module ci-server/credit-component
 */
module.exports = function() {
  /** @class */
  var creditService = {
    /** @lends creditService */
    /**
    *  get user's gold credits which get by like or share
    * memberof components/creditservice
    * @method
    * @param {string} userid - user id
    * @param {object} createdat - Object has fromDate and toDate
    * @return {json} viewcampaign goldcoins
    * callback {function} callback - invoke callback with the data
    */
    getGoldCreditsView: function (userid, createdat, callback) {
      var query = {userid: userid+'', logtype : {"$in": ["fblike", "fbshare"]} };
      if(createdat && createdat.fromDate && createdat.toDate) {
        query['createdAt'] = {
          "$gte": (new Date(createdat.fromDate)),
          "$lt": (new Date(createdat.toDate))
        }
      }
      ViewCampaign.aggregate([
        {$match: query},
        {$group: {_id: "$userid", total: {$sum: "$goldcoins"}}}
      ], function(err, vc) {
        callback(err, {
          viewcampaign: vc
        });
      })
    },
    /**
    *  get user's creditinfo from usercredits
    * memberof components/creditservice
    * @method
    * @param {string} userid - user id
    * @return {json} usercredit doc
    * callback {function} callback - invoke callback with the doc
    */
    getCredits: function (userid, callback) {
      return Credits.findOne({userid: userid+''}, callback);
    },

    /**
    *  Silver Credits are computed through creditlogs, viewcampaignlogs
    * @method
    * @param {string} userid - user id
    * @return {json} { creditlogs : <number>, viewcampaign : <number>, campaign : <number> }
    * callback {function} callback - invoke callback with the doc
    */
    getSilverCredits: function(userid, callback) {

      return CreditLogs.aggregate([
        {$match: {type: "silver", cointype: "gold", userid: userid+''}},
        {$group: {_id: "$userid", total: {$sum: "$coins"}}}
      ], function(err, cl) {

        ViewCampaign.aggregate([
          {$match: {userid: userid+'', logtype : 'view' }},
          {$group: {_id: "$userid", count: {$sum: 1}}}
        ], function(_err, vc) {

          Campaign.aggregate([
            {$match: {"campaigntype":"text", "userid": userid+''}},
            {$group: {"_id":"$userid", credits: {"$sum": "$credits"}}}
          ], function(__err, cg) {

            var clTotal = (cl && cl.length > 0 ? cl[0].total : 0),
                vcTotal = (vc && vc.length > 0 ? vc[0].total : 0),
                cTotal  = (cg && cg.length > 0 ? cg[0].total : 0);

              /* verifing credit coins and user credit coins difference */
              Credits.findOne({userid : userid+''}, function(err, credit){
                var userGolSilverCoins = (clTotal+vcTotal-cTotal);
                if(credit && (parseInt(credit.silvercoins) < parseInt(userGolSilverCoins) || parseInt(credit.silvercoins) > parseInt(userGolSilverCoins)))
                {
                  console.log("User credit differ. Userid:"+userid+', csc:'+credit.silvercoins+', clsc:'+userGolSilverCoins );
                }
              });
            callback((err || _err || __err), {
              creditlogs: cl,
              viewcampaign: vc,
              campaign: cg
            });
          })
        })
      })
    },

    /**
    *  Get Silver Packs. From payments collection, all the completed transaction with productid 'silver'
    * @method
    * @param {string} userid - user id
    * @return {json} aggregated list of payment amounts
    */
    getSilverPacks: function(userid, callback) {
      return Payments.aggregate([
        {$match: {status:'COMPLETED', active:true, userid: userid+'', paymode: {$in: ["ic","paypal"]}, productid: "silver"}},
        {$group: {_id: "$userid", qty: {$sum: "$quantity"}, total: {$sum: "$paidamount"}}}
      ], callback);
    },

    /**
    *  Active Silver Packs, packs are active for 60 days after purchase
    * @method
    * @param {string} userid - user id
    * @return {json} aggregated list of packs
    */
    getActiveSilverPacks: function(userid, callback) {

      return ActivePacks.aggregate([
        {$match: {userid: userid+''}},
        {$group: {
          _id: "$userid",
          totalpacks: { $sum: "$totalpacks" },
          activepacks:{"$sum":{"$cond":{if: {$eq: ["$isactive", true]}, then: "$totalpacks", else: 0}}}
        }}
      ], callback );
    },

    /**
    *  Get silver packs with in a time window, search successful payments for productid : silver within the given time window
    * @method
    * @param {string} userid - user id
    * @param {json} _query - { createdat : { fromDate : <date>, to : <date> } }
    * @return {json} aggregated list of payment docs
    */
    getSilverPacksTime: function(userid, _query, callback) {
      return Payments.aggregate([
        {$match: {status:'COMPLETED', active:true, userid: userid+'',createdAt:{$gte: (new Date(_query.createdat.fromDate)), $lt: (new Date(_query.createdat.to))}, paymode: {$in: ["ic","paypal"]}, productid: "silver"}},
        {$group: {_id: "$userid", qty: {$sum: "$quantity"}, total: {$sum: "$paidamount"}}}
      ], callback);
    },

    /**
    *  Get Active silver packs with in a time window, search activepacks within the given time window
    * @method
    * @param {string} userid - user id
    * @param {json} _query - { createdat : { fromDate : <date>, to : <date> } }
    * @return {json} aggregated list of payment docs
    */
    getActiveSilverPacksTime: function(userid,_query, callback) {
      var query = {userid: userid+''};
      if(_query.createdat && _query.createdat.fromDate && _query.createdat.toDate) {
        query['createdat'] = {
          "$gte": (new Date(_query.createdat.fromDate)),
          "$lt": (new Date(_query.createdat.toDate))
        }
      }

      return ActivePacks.aggregate([
        {$match: query},
        {$group: {
          _id: "$userid",
          totalpacks: {$sum: "$totalpacks"},
          activepacks:{"$sum":{"$cond":{if: {$eq: ["$isactive", true]}, then: "$totalpacks", else: 0}}}
        }}
      ], callback );
    },


    /**
    *  Get Gold credits. aggregate creditlogs for 'gold' type, 'gold' cointype
    * @method
    * @param {string} userid - user id
    * @return {json} { _id : <objectid>, total : <number> }
    */
    getGoldCredits: function(userid, callback) {
      return CreditLogs.aggregate([
        {$match: {type: {"$in": ["product", "gold"]}, cointype: "gold", userid: userid+''}},
        {$group: {_id: "$userid", total: {$sum: "$coins"}}}
      ], function(err, cl){
        ViewCampaign.aggregate([
          //{$match: {userid: userid+'', logtype : 'fbshare' }},
          {$match: {userid: userid+'', logtype : {"$in": ["fblike", "fbshare"]} }},
          {$group: {_id: "$userid", total: {$sum: "$goldcoins"}}}
        ], function(_err, vc) {
          Campaign.aggregate([
            {$match: {"campaigntype":{"$in": ["fblike", "fbshare"]}, "userid": userid+''}},
            //{$match: {"campaigntype":"fbshare", "userid": userid+''}},
            {$group: {"_id":"$userid", total: {"$sum": "$credits"}}}
          ], function(__err, cg) {
            var clTotal = (cl && cl.length > 0 ? cl[0].total : 0),
                vcTotal = (vc && vc.length > 0 ? vc[0].total : 0),
                cTotal  = (cg && cg.length > 0 ? cg[0].total : 0);

                /* verifing credit coins and user credit coins difference */
                Credits.findOne({userid : userid+''}, function(err, credit){
                  var userGoldCoins = (clTotal+vcTotal-cTotal);
                  if(credit && (parseInt(credit.goldcoins) < parseInt(userGoldCoins) || parseInt(credit.goldcoins) > parseInt(userGoldCoins)))
                  {
                    console.log("User credit differ. Userid:"+userid+', cgc:'+credit.goldcoins+', clgc:'+userGoldCoins );
                  }
                });

                callback((err || _err || __err), {
                  _id: userid,
                  total: (clTotal+vcTotal-cTotal)
                });
          });
        });
      });

      // return CreditLogs.aggregate([
      //   {$match: {userid: userid+'', subtype: 'P', $or: [{type: 'gold'}, {type: 'product'}]}},
      //   {$group: {
      //     _id: "$userid",
      //     total: {$sum: "$coins"},
      //   }}
      // ], callback);
    },

    /**
    *  Get gold packs : aggregate successful payments for productid 'gold' with paymode ! 'ic'
    * @method
    * @param {string} userid - user id
    * @return {json} { _id : <objectid>, qty : <number>, total : <number> }
    */
    getGoldPacks: function(userid, callback) {
      return Payments.aggregate([
        {$match: {status:'COMPLETED', active:true, userid: userid+'', paymode: {$ne: "ic"}, productid: "gold"}},
        {$group: {_id: "$userid", qty: {$sum: "$quantity"}, total: {$sum: "$paidamount"}}}
      ], callback);

      // return CreditLogs.aggregate([
      //   {$match: {userid: userid+'', subtype: 'P', type: 'gold'}},
      //   {$group: {
      //     _id: "$userid",
      //     total: {$sum: "$coins"},
      //   }}
      // ], callback);
    },

    /**
    *  Get gold packs within a time window
    * @method
    * @param {string} userid - user id
    * @param {json} _query - { createdAt : { fromDate : <date>, toDate : <toDate> } }
    * @return {json} valid or not
    */
    getGoldPacksTime: function(userid, _query, callback) {
      var query = {status:'COMPLETED', active:true, userid: userid+''};
      if(_query.createdat && _query.createdat.fromDate && _query.createdat.toDate) {
        query['createdAt'] = {
          "$gte": (new Date(_query.createdat.fromDate)),
          "$lt": (new Date(_query.createdat.toDate))
        }
      }
      query.paymode   = {$ne: "ic"};
      query.productid = 'gold';

      return Payments.aggregate([
        {$match: query},
        {$group: {_id: "$userid", qty: {$sum: "$quantity"}, total: {$sum: "$paidamount"}}}
      ], callback);
    },

    /**
    *  Get purchased packs - aggregate payments for gold/silver payments
    * @method
    * @param {string} page - query param page ref
    * @return {json} valid or not
    */
    getPurchasedPacks: function(userid, callback) {

      return Payments.aggregate([
        {$match: {status:'COMPLETED', active:true, userid: userid+'', productid: {"$in": ["gold", "silver"]}}},
        {$group: {_id: {"userid": "$userid", "product": "$productid"}, packs: {$sum: "$quantity"}}}
      ], callback);
    },

    /**
    *  Get all silver packs
    * @method
    * @param {string} userid - user id
    * @return {json} list of payments
    */
    getAllSilverPacks: function (userid, callback) {
      return Payments.aggregate([
        {$match: {userid: userid+'', productid: {"$in": ["silver"]}}},
      ], callback);
    },

    /**
    *  Get wallet info - desc ordered by createdat. Get gold,product creditlogs with description filtering
    * @method
    * @param {string} userid - user id
    * @param {string} skipRows - rows to skip
    * @param {string} pageLimit - rows to return
    * @return {json} valid or not
    */
    getWalletInfo: function(userid, skipRows, pageLimit, callback) {
      return CreditLogs.find({
        userid: userid+'',
        //type: {"$in": ['gold','product']},
        type: {"$in": ['adscash']},
        description: {"$nin": [/Withdrawal/, /Commission/, /Revenue/]}
      }).sort({_id: -1, createdat: -1}).skip(skipRows).limit(pageLimit).exec(callback);
    },

    /**
    *  get silver wallet : find successful payment for 'silver' product, desc by createdat
    * @method
    * @param {string} userid - user id
    * @param {string} skipRows - rows to skip
    * @param {string} pageLimit - rows to return
    * @return {json} [ <payment-doc> ]
    */
    getSilverWalletInfo: function(userid, skipRows, pageLimit, callback) {
      return Payments.find({
        userid: userid+'',
        productid: "silver",
        status: {"$ne": 'PENDING PAYMENT'}
      }).sort({_id: -1, createdAt: -1}).skip(skipRows).limit(pageLimit).exec(callback);
    },
    /**
    *  get gold coin earned
    * @method
    * @param {string} userid - user id
    * @param {string} skipRows - rows to skip
    * @param {string} pageLimit - rows to return
    * @return {json} [ <docs> ]
    */
    getEarnedInfoGold : function(userid, skipRows, pageLimit, callback){
      return ViewCampaign.find({
        userid: userid+'',
        goldcoins: { '$gt' : 0 },
        logtype : {"$in": ["fblike", "fbshare"]}
      }).sort({_id: -1, createdAt: -1}).skip(skipRows).limit(pageLimit).exec(callback);
    },
    /**
    *  get usd coins transactions
    * @method
    * @param {string} userid - user id
    * @param {string} skipRows - rows to skip
    * @param {string} pageLimit - rows to return
    * @return {json} [ <docs> ]
    */
    getUsdTransactionsInfo : function(userid, skipRows, pageLimit, subtype, callback){
        var conditions = {userid: userid+'',active: true};
        if (subtype) {conditions.subtype = subtype;}
        return CreditLogs.find(conditions).sort({_id: -1, createdAt: -1}).skip(skipRows).limit(pageLimit).exec(callback);
    },
    /**
    *  Get withdrawal info : find gold type creditlogs with 'withdrawal' desc
    * @method
    * @param {string} page - query param page ref
    * @return {json} valid or not
    */
    getWithdrawalInfo: function(userid, skipRows, pageLimit, callback) {
      return Withdrawals.find({
        userid: userid+''
      }).sort({_id: -1, createdat: -1}).skip(skipRows).limit(pageLimit).exec(callback);
    },

    /**
    *  Get total commission : aggregate creditlogs with description : 'commission'
    * @method
    * @param {string} userid - user id
    * @return {json} { _id : <ObjectId>, coins : <number> }
    */
    getTotalCommission: function(userid, callback) {
      var cl = new CommissionLogs();
      return cl.getCommissionDetails(userid).exec(callback);
    },

    /**
    *  Get commission : paginated list of commissions paid
    * @method
    * @param {string} userid - user id
    * @param {string} skipRows - rows to skip
    * @param {string} pageLimit - rows to return
    * @return {json} [ <creditlogs> ]
    */
    getCommissionInfo: function(userid, skipRows, pageLimit, callback) {
      return CreditLogs.find({
        userid: userid+'',
        type: 'adscash',
        description: {"$regex": "Commission", "$options": "i"}
      }).sort({_id: -1, createdat: -1}).skip(skipRows).limit(pageLimit).exec(callback);
    },

    /**
    *  Get commission : paginated list of revenue share paid
    * @method
    * @param {string} userid - user id
    * @param {string} skipRows - rows to skip
    * @param {string} pageLimit - rows to return
    * @return {json} [ <creditlogs> ]
    */
    getRevenueInfo: function(userid, skipRows, pageLimit, callback) {
      return CreditLogs.find({
        userid: userid+'',
        type: {"$in": ['gold','silver']},
        description: {"$regex": "Revenue", "$options": "i"}
      }).sort({_id: -1, createdat: -1}).skip(skipRows).limit(pageLimit).exec(callback);
    },

    /**
    *  Get wallet entries count : description is not withdrawal,commission,revenue
    * @method
    * @param {string} userid - user id
    * @return {number}
    */
    getWalletRowsCount: function(userid, callback) {
      return CreditLogs.count({userid: userid+'', type: {"$in": ['adscash']}, description: {"$nin": [/Withdrawal/, /Commission/, /Revenue/]}}).exec(callback);
    },

    /**
    *  Get withdrawals count
    * @method
    * @param {string} userid - user id
    * @return {number} withdrawals
    */
    getWithdrawalRowsCount: function(userid, callback) {
      return Withdrawals.count({userid: userid+''}).exec(callback);
    },

    /**
    *  Get Revenue rows count, @todo why type != silver ?
    * @method
    * @param {string} userid - user id
    * @return {number} revenue entries
    */
    getRevenueInfoRowsCount: function(userid, callback) {
      return CreditLogs.count({userid: userid+'', type: {$ne: 'silver'}, description: {"$regex": "Revenue", "$options": "i"}}).exec(callback);
    },

    /**
    *  Get Commission rowcount, @todo why type != 'silver'
    * @method
    * @param {string} userid - user id
    * @return {json} valid or not
    */
    getCommissionInfoRowsCount: function(userid, callback) {
      return CreditLogs.count({userid: userid+'', type: {$ne: 'silver'}, description: {"$regex": "Commission", "$options": "i"}}).exec(callback);
    },

    /**
    *  Get silver purchases : find successful payment for silver productid
    * @method
    * @param {string} userid - user id
    * @return {number} silver coins purchases
    */
    getSilverWalletRowsCount: function(userid, callback) {
      return Payments.count({userid: userid+'', productid: 'silver', status: {"$ne": 'PENDING PAYMENT'}}).exec(callback);
    },

    /**
    *  Get gold coin earned rows count
    * @method
    * @param {string} userid - user id
    * @return {number} gold coins earned
    */
    getEarnedInfoGoldRowsCount: function(userid, callback) {
      return ViewCampaign.count({userid: userid+'', goldcoins: { '$gt' : 0 }, logtype : {"$in": ["fblike", "fbshare"]}}).exec(callback);
    },

    /**
    *  Get usd transactions count
    * @method
    * @param {string} userid - user id
    * @return {number} transactions
    */
    getUsdTransactionsRowsCount: function(userid, subtype, callback) {
      return CreditLogs.count({userid: userid+'', type : 'usd', subtype: subtype }).exec(callback);
    },

    /**
    *  add credit transfer info into creditlogs
    * @method
    * @param {string} userid - user id
    * @param {string} creditinfo - user creditinfo
    * @return {json} valid or not
    */
    addCreditTransferLog: function(userid, creditInfo, callback) {
      var createdAt = (creditInfo.createdat ? (creditInfo.createdat) : (new Date()));
      CreditLogs.create({
        userid: userid,
        coins: creditInfo.amount,
        description: creditInfo.description,
        type: creditInfo.type,
        subtype: creditInfo.subtype,
        cointype: creditInfo.cointype,
        createdat: createdAt,
        active: true,
        modified: false
      }, callback);
    },

    addCommissionLog: function(userid, commissionInfo, callback) {
      CommissionLogs.create({
        userid: userid,
        coins: commissionInfo.amount,
        desc: commissionInfo.description,
        createdat: commissionInfo.createdat
      }, callback);
    },

    getCurrencyRate : function (currency, callback){
      CurrencyRate.findOne({currency : currency, isactive: true, expireat: null}, callback);
    },

    /**
    *  remove a credit info from creditlogs
    * @method
    * @param {string} userid - user id
    * @param {string} creditinfo - user creditinfo
    * @return {json} valid or not
    */
    deleteCreditTransferLog: function(userid, creditInfo, callback) {
      CreditLogs.findOne({
        userid: userid+'',
        coins: creditInfo.amount,
        description: creditInfo.description+'',
        type: creditInfo.type+'',
        subtype: creditInfo.subtype+'',
        cointype: creditInfo.cointype+''
      }).sort({_id: -1}).exec(callback);
    },

    getAdcPacksByDate: function(userid, date, callback) {
      date = new Date(date);
      Payments.find({userid: userid+'', productid: "adscash", createdAt : { $lte : date }}, function(err, data){
        if(err){
            callback(err, {adcpacks : 0 });
        }
        else{
          var packs = 0;
          data.forEach(function(record){
            var pk = (record.coins/1000);
                packs = packs+pk;
          });
          callback(null, { adcpacks : packs});
        }
      });
    },

    /**
    *  add credits for a user into its usercredits doc
    * @method
    * @param {string} userid - user
    * @param {json} creditinfo - usercredits doc
    * @callback {function} callback - invoke it
    */
    updateCredits: function(userid, creditInfo, callback) {
      console.log(creditInfo);
      Credits.findOneAndUpdate(
                  { userid: userid + ''},
                  {
                     $inc: {
                      adscash: parseFloat(creditInfo.adscash),
                      usd: parseFloat(creditInfo.usd),
                      adcpacks: (creditInfo.adcpacks) ? parseInt(creditInfo.adcpacks) : 0
                    }
                  },
                  {
                    returnNewDocument : true
                  }, function(err, credits){
                  if(err) {
                    console.log('updateCredits: Update Err: ', err);
                    callback(err, null);
                  }
                  console.log('updateCredits success: ', credits);
                  callback(null, credits);
                });
    }
  };
  return creditService;

};
