'use strict';

var _ = require('lodash');
var config           = require('./../../config/environment');
var moment           = require('moment');
var ActiveSilverPack = require('./../../api/payment/activesilverpacks.model');
var Payment = require('./../../api/payment/payment.model');
var UserModel = require('./../../api/user/user.model');
var ProductService = require('../products/product.service');
var Credits = require('../credits/credits.service');
var DistributionService = require('../distribution/distribution.service');
var EmailService = require('../emails/email.service');
let co = require("co");
let request = require("co-request");


module.exports = function() {
  var timePattern = /T[\d{2}]\:[\d{2}]\:[\d{2}]\.[\d{3}]Z/;
  var timeReplace = 'T00:00:00.000Z';

  var replaceTime = function(_date) {
    var replacedDate = _date.replace(timePattern, timeReplace);
    return (new Date(replacedDate));
  };

  var salesResult = function(fromDate, uptoDate, userIds, saleType, _callback) {
    if(saleType == 'silver')
    {
      return ActiveSilverPack.aggregate([
        {"$match": {"createdat": {"$gte": fromDate, "$lt": uptoDate}, "userid": {"$in": userIds}}},
        {"$group": {"_id": null, "totalSale": {"$sum": "$totalpacks"}}},
        {"$sort": {"_id": 1}}
      ], _callback);
    }
    else if(saleType == 'gold')
    {
      return Payment.aggregate([
        {"$match": {"createdAt": {"$gte": fromDate, "$lt": uptoDate}, "userid": {"$in": userIds}, active : true, status : 'COMPLETED', productid : 'gold' }},
        {"$group": {"_id": null, "totalSale": {"$sum": "$quantity"}}},
        {"$sort": {"_id": 1}}
      ], _callback);
    }
    else {
      _callback(true, null);
    }
  };

  return {

    getPaymentsServices: function() {
      return config.paymentMethods;
    },

    getSalesByDate: function(days, userIds, saleType, _callback) {
      var fromDate = replaceTime(moment().subtract(parseInt(days), 'day').toISOString());
      var uptoDate = replaceTime(moment().toISOString());

      return salesResult(fromDate, uptoDate, userIds, saleType, _callback);
    },

    updatePaymentInfo: function (req, callback) {
      // Query to get payment's information, used only at advcash payment verification cronjob

      Payment.findById(req.params.id , function (err, payment) {

        if (err) { return callback(err, null); }

        if(!payment) { return callback(true, 'Not Found'); }

        var extraPaymentData = { quantity : 0, amount : 0, coins : 0 };
        var _data   = req.body;
            _data['updatedat'] = new Date();

        /* Case when user pay grater amount from paid amount using advcash */

        var updatedPayment = _.merge(payment, _data);
        let businessCommission = ( req.body.commission && req.body.commission.amount > 0 ) ? req.body.commission.amount : 0;
        // Update Withdrawal's information
        updatedPayment.save(function (err) {
	        if (err) { return callback(true, null); }
          //var productService = new ProductService();
          //productService.getPurchaseProductType(payment.productid, function(productTypeInfo) {
          //var cointype = payment.gcused ? 'GC-AND-BTC' : 'BTC';
          var cointype = 'btc';

            if(payment.requirecredit === true) {
              var adcpacks = 0;
              if(payment.productid === 'adscash') {
                adcpacks = parseInt(parseInt(payment.coins) / 1000);
              }
              var _Credits = new Credits();
              _Credits.updateCredits(payment.userid, {
                adscash: payment.productid == 'usd' ? 0 : parseInt(payment.coins),
                usd: payment.productid == 'usd' ? Math.round((payment.paidamount+businessCommission) * 10)/10 : 0,
                adcpacks: adcpacks
              },function(err, _data) {
                console.log('Payment verification credits add info: ', err, _data);
                _Credits.addCreditTransferLog(payment.userid, {
                  amount: payment.productid == 'usd' ? ((Math.round(payment.paidamount * 10)/10)) : parseInt(payment.coins),
                  description: 'Purchase '+payment.productname+'  Payment id:'+payment._id,
                  type: payment.productid == 'adscash' ? 'adscash' : 'usd',
                  subtype: 'P',
                  cointype: cointype,
                  createdat: (new Date())
                }, function(err, data) {
                  console.log('Credit Log Info: ', err, data._id);
                  /* add commission logs */
                  if(businessCommission > 0){
                    _Credits.addCreditTransferLog(payment.userid, {
                      amount: businessCommission,
                      description: 'Business user add fund commission (# '+payment._id+')',
                      type: 'usd',
                      subtype: 'P',
                      cointype: 'usd',
                      createdat: (new Date())
                    }, function(err, clog) {
                      console.log("Transaction log for business payment", err, clog);
                    });
                    _Credits.addCommissionLog(payment.userid, {
                      amount: businessCommission,
                      description: 'Business user add fund commission ( # '+ payment._id +')',
                      createdat: (new Date())
                    }, function(_err, cmlog) {
                      console.log('Commission Log of Business payment: '+ _err, cmlog);
                    });
                  }

                  // Send Purachase Coin Email to the customer
                  if(payment.productid == 'adscash'){
                    var dservice = new DistributionService();
                    dservice.distributeAdscashProductCredits(payment.userid, payment.coins, 1, 'adscash', '', function(res){
                      if(res)
                        console.log('Distribute commissions');
                      else
                        console.log('[Error] Unable to distribute commissions');
                        payment.update({tech_comment: 'COMMISSION_RELEASED'}, console.log);

                      UserModel.findById(payment.userid+'', function(e, u) {
                        if(!e && u) {
                          var emailService = new EmailService();
                          payment.status = 'COMPLETED';
                          emailService.sendPurchaseEmail(u.email, u.name, '', payment);
                          return callback(false, payment);
                        }
                      });
                       });
                  }
                  else if(payment.productid == 'usd'){
                    UserModel.findById(payment.userid+'', function(e, u) {
                      if(!e && u) {
                        var emailService = new EmailService();
                        payment.status = 'COMPLETED';
                        console.log('Payment:' + payment)
                        emailService.sendPurchaseEmail(u.email, u.name, '', payment);
                        return callback(false, payment);
                      }
                    });
                  }
                  else{
                    return callback(false, payment);
                  }
                });
              });
            }
            else{
              // Send Purachase Coin Email to the customer
              UserModel.findById(payment.userid+'', function(e, u) {
                if(!e && u) {
                  var emailService = new EmailService();
                  payment.status = 'COMPLETED';
                  emailService.sendPurchaseEmail(u.email, u.name, '', payment);
                  return callback(false, payment);
                }
              });
            }
          //});
        });
      });
    },

    getCIGoldCoins : function* (userid){
      var options = {
          url: config.clickintensityApiDomain + '/auth/local',
          form: config.clickintensityIntermidiator
      };
        let result = yield request.post(options);
        let body = JSON.parse(result.body);
        if(body && body.token){
            let result1 = yield request.get({
                                  url: config.clickintensityApiDomain + '/api/pay/getbalancebyid/'+userid,
                                  headers: {
                                    'Authorization': 'Bearer '+body.token
                                  }
                                  });
            return JSON.parse(result1.body);
        }
        else if(body && body.error){
            console.log("Error from ci:"+result.body);
            return JSON.parse(result.body);
        }
        else{
          console.log("Response from ci:"+JSON.stringify(body));
          return {error: true, message: 'Unable to authenticate from clickintensity.'};
        }
    },

    deductCIGoldCoins : function* (userid, coins){
      var options = {
          url: config.clickintensityApiDomain + '/auth/local',
          form: config.clickintensityIntermidiator
      };
        let result = yield request.post(options);
        let body = JSON.parse(result.body);
        if(body && body.token){
            let result1 = yield request.post({
                                  url: config.clickintensityApiDomain + '/api/pay/purchase-adscash-deduction',
                                  headers: {
                                    'Authorization': 'Bearer '+body.token
                                  },
                                  form: {
                                          userid : userid,
                                          coins : coins
                                        }
                                  });
            return JSON.parse(result1.body);
        }
        else if(body && body.error){
            console.log("Error from ci:"+result.body);
            return JSON.parse(result.body);
        }
        else{
          console.log("Response from ci:"+JSON.stringify(body));
          return {error: true, message: 'Unable to authenticate from clickintensity.'};
        }
    },

    refundCIGoldGoins : function* (payment){
      var options = {
          url: config.clickintensityApiDomain + '/auth/local',
          form: config.clickintensityIntermidiator
      };
        let result = yield request.post(options);
        let body = JSON.parse(result.body);

        if(body && body.token){
            let result1 = yield request.post({
                                  url: config.clickintensityApiDomain + '/api/pay/refund-adscash-purchase',
                                  headers: {
                                    'Authorization': 'Bearer '+body.token
                                  },
                                  form: {
                                          userid : payment.userid,
                                          coins : payment.gcused,
                                          purchaseid : payment._id.toString()
                                        }
                                  });


            let refBody = JSON.parse(result1.body);
             if(!refBody.error){
              yield Payment.findOneAndUpdate({_id : payment._id}, {status : 'CANCELLED', comment : 'Full payment not received, Gold coins refunded at CI.'});
              return refBody;
            }
            else{
              return refBody;
            }
        }
        else if(body && body.error){
            console.log("Error from ci:"+result.body);
            return JSON.parse(result.body);
        }
        else{
          console.log("Response from ci:"+JSON.stringify(body));
          return {error: true, message: 'Unable to authenticate from clickintensity.'};
        }
    }

  }

};
