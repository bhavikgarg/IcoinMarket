'use strict';
/**
 * payment module.
 * @module ci-server/payment-controller
 */

var _ = require('lodash');
var Payment = require('./payment.model');
var BankWire = require('./bankwire.model');
var Usergatewaysinfo = require('./usergatewaysinfo.model');
var ActiveSilverPack = require('./activesilverpacks.model');
var TransferModel = require('./transfer-admin.model');
var UserModel = require('./../user/user.model');
var PaypalService  = require('./../../components/payments/paypal.service');
var PayzaService   = require('./../../components/payments/payza.service');
var BlockIOLtcService   = require('./../../components/payments/block.io.ltc.service');
var BlockIOService   = require('./../../components/payments/block.io.service');
var STPService     = require('./../../components/payments/stp.service');
var BitcoinService = require('./../../components/payments/bitcoin.service');
var PayService     = require('./../../components/payments/pay.service');
var ADVCashService = require('./../../components/payments/advcash.service');
//var WorldPayService = require('./../../components/payments/worldpay.service');
var EmailService = require('../../components/emails/email.service');
var config = require('./../../config/environment');
var Credits = require('../../components/credits/credits.service');
var ProductService = require('../../components/products/product.service');
var Products = require('../products/products.model');
var ViewCampaignLog = require('../campaign/viewcampaignlog.model');
var DistributionService = require('../../components/distribution/distribution.service');
var uuid = require('uuid');
var async = require('async');
var ReveueCutof         = require('./revenue-cutof.model');
var CurrencyRate         = require('./currency-rate.model');
var UserWithdrawal      = require('./transfer-user.model');
var Circulation      = require('./circulation.model');
var CreditLogs      = require('../credits/credit-logs.model');
var ValidateService     = require('./../../components/transactions/validate.service');
var KycComponents       = require('./../usermeta/utils.component.js');
var GenealogyPurchase   = require('./../utilities/genealogy-purchase.model');
var SoloEmail           = require('./../soloemails/soloemails.model');
var DailyLoginAdService = require('./../../components/dailyads/dailyads.service');
var moment              = require('moment');
var json2xls            = require('json2xls');
var fs                  = require('fs');
let co = require("co");
let request = require("co-request");
let Withdrawal  = require('./../withdrawal/withdrawal.model');
var OtpGeneration = require('./otp-generation.model');
var CreditModel = require('./../credits/credits.model');
var AdscashService = require('../../components/adscash/adscash.service');
var Commitments = require('./../commitments/commitments.model');

/**
* Get list of payments
* @function
* @param {number} page - query param
* @access user
* @return {json} [ <payments> ] - 10 per page
*/

exports.index = function(req, res) {

  var query = {};
  if(req.user.role != 'admin') {
    //query.active = true;
    query.userid = req.user._id+'';
    query.status = {"$nin": ["PENDING PAYMENT"]};
  }
  var viewLimit   = parseInt(config.minPaginationLimit);
  var currentPage = (req.query.page ? req.query.page : 1);
  var skipRows    = (viewLimit * (currentPage - 1));

  Payment.find(query, 'orderId productid productname quantity unitprice unitcoins paidamount coins gcused paymode paymode2 active status seqPrefix createdAt paytoken.TOKEN commission').sort({createdAt: -1}).limit(viewLimit).skip(skipRows).exec(function (err, payments) {
    if(err) { return handleError(res, err); }
    var paymentIds = [], paymentInfo = [];
    payments = payments || [];
    payments.forEach(function(x) {
      paymentIds.push(x._id);
      paymentInfo.push({
        "_id": x._id+'',
        "orderId": x.orderId,
        "userid": x.userid,
        "productid": x.productid,
        "productname": x.productname,
         "quantity": x.quantity,
         "unitprice": x.unitprice,
         "unitcoins": x.unitcoins,
         "paidamount": x.paidamount,
         "gcused": x.gcused,
         "coins": x.coins,
         "paymode": x.paymode,
         "paymode2": x.paymode2,
         "active": x.active,
         "status": (x.status || '-'),
         "seqPrefix": x.seqPrefix,
         "createdAt": x.createdAt,
         "paytoken": x.paytoken,
         "commission": x.commission
       });
    });
    if(paymentIds.length > 0) {
      BankWire.find({paymentid: {"$in": paymentIds}}).sort({createdat: -1})
      .exec(function(be, bi) {
        if(bi && bi.length > 0) {
          bi.forEach(function(y) {
            var p = _.find(paymentInfo, function(n) { return n._id+'' === y.paymentid });
            if(p) {
              p.receiptPath = y.receiptpath;
            }
          });

          Payment.count(query, function(err, rows) {
            return res.status(200).json({data: paymentInfo, limit: viewLimit, rows: rows});
          });
        }
        else {
          Payment.count(query, function(err, rows) {
            return res.status(200).json({data: paymentInfo, limit: viewLimit, rows: rows});
         });
        }
      })
    }
    else {
      Payment.count(query, function(err, rows) {
        return res.status(200).json({data: payments, limit: viewLimit, rows: rows});
     });
   }
  });
};


/**
* Get total investment and earnings
* @function
* @access user
* @return {json} { investments : <number>, earned : <number>, silverpacks : <number> }
*/
exports.revenueshare = function(req, res){
  var query = {};
  query.userid = req.user._id+'';
  var _Credits = new Credits();
  _Credits.getSilverCredits(req.user._id, function(err, data) {
    if(err) { return handleError(res, err); }
    var viewcampaign = data.viewcampaign;
    var vcTotal = (viewcampaign[0] ? viewcampaign[0].count : 0);
    var earnings = vcTotal / (config.packsInfo.silver.coins / config.packsInfo.silver.price );
    ActiveSilverPack.find({
      "userid": req.user._id+'',
      "packs": {"$gt": 0},
      "$or": [{"expirydate": null}, {"expirydate": {"$gte": (new Date())}}],
      "isactive": true
    }).sort({createdat: -1}).exec(function(_err, _data) {
      if(err) { return handleError(res, err); }
      query['status']    = 'COMPLETED';
      query['paymode']   = {"$in": ["paypal", "ic"]};
      query['productid'] = 'silver';

      Payment.aggregate([
        {"$match": query},
        {"$group": {"_id": "$userid", "investment": {"$sum": "$paidamount"}}}]
      ).exec(function (err, payments) {
        if(err) { return handleError(res, err); }
          if(payments.length > 0){
            return res.status(200).json({ investment: (payments ? payments[0].investment : 0), earned: earnings, silverpacks: _data });
          }
      });
    });
  });
};

/**
* Revenue Share received for expired silver packs
* @function
* @access user
* @return {json} { investments : <number>, earned : <number>, silverpacks : <number> }
*/
exports.exrevenueshare = function(req, res){
  var query = {};
  query.userid = req.user._id+'';
  var _Credits = new Credits();
  _Credits.getSilverCredits(req.user._id, function(err, data) {
    if(err) { return handleError(res, err); }
    var viewcampaign = data.viewcampaign;
    var vcTotal = (viewcampaign[0] ? viewcampaign[0].count : 0);
    var earnings = vcTotal / (config.packsInfo.silver.coins / config.packsInfo.silver.price );
    ActiveSilverPack.find({
      userid: req.user._id,
      packs: {"$gt": 0},
      expirydate: {"$lt": (new Date())},
      "isactive": false
    }).sort({createdat: -1}).exec(function(_err, _data) {
      if(err) { return handleError(res, err); }
      query['status']    = 'COMPLETED';
      query['paymode']   = {"$in": ["paypal", "ic"]};
      query['productid'] = 'silver';

      Payment.aggregate([
        {"$match": query},
        {"$group": {"_id": "$userid", "investment": {"$sum": "$paidamount"}}}]
      ).exec(function (err, payments) {
        if(err) { return handleError(res, err); }
        console.log(payments);

        return res.status(200).json({
          investment: (payments.length ? payments[0].investment : 0),
          earned: earnings,
          silverpacks: _data
        });
      });
    });
  });
};

/**
* Get a single payment
* @function
* @param {ObjectId} id : url param
* @access user
* @return {json} payment
*/
exports.show = function(req, res) {
  Payment.findById(req.params.id, function (err, payment) {
    if(err) { return handleError(res, err); }
    if(!payment) { return res.status(404).send('Not Found'); }
    return res.json(payment);
  });
};

/**
* View Payment via token
* @function
* @param {ObjectId} id - url param token
* @access user
* @return {json} payment
*/
exports.viewByToken = function(req, res) {
  Payment.findOne({'paytoken.TOKEN': req.params.id}, '-gatewaysuccess -paytoken -userid', function (err, payment) {
    if(err) { return handleError(res, err); }
    if(!payment) { return res.status(404).send('Not Found'); }

    if(payment.requirecredit == false && payment.productsubtype != 'normal' && (payment.status != 'CANCELLED' || payment.status != 'CANCEL') && payment.productemailsent == false) {
      payment.update({"productemailsent": true}, function(e, d) {
        var emailService = new EmailService();
        emailService.sendProductPurchaseEmail(req.user, payment.productname, payment);
      });
    }

    if(payment.productsubtype == 'dailyads') {
      DailyLoginAdService.lockDailyAdsViewDates(payment._id+'', function() {
        return res.status(200).json(payment);
      });
    }
    else {
      return res.status(200).json(payment);
    }
  });
};

/**
* User redirect form payment gateway to here after successfull payment
* @function
* @access user
* @return {String} valid/invalid operation
*/
exports.returnSuccess = function(req, res) {
  var reqdata = {};
  if(req.method == 'POST'){
    reqdata = req.body;
  } else {
    for(var key in req.params) reqdata[key]=req.params[key];
    for(var key in req.query) reqdata[key]=req.query[key];
  }

  Payment.findOne({'paytoken.TOKEN': reqdata.token}, function(err, payment) {

    if(err) { console.log(err); return handleError(res, err); }
    if(!payment) { return res.status(404).send('Not Found'); }

    var payMode = reqdata.type.split('-');

    if(payMode[0] == payment.paymode) {

      if(typeof reqdata.token == 'undefined' || typeof reqdata.PayerID == 'undefined') {
        return res.status(200).send('Invalid request');
      }

      var productService = new ProductService();
      productService.getPurchaseProductType(payment.productid, function(productTypeInfo) {

        if(payment.paymode == 'paypal') {
          var service = new PaypalService();

          service.doPayment({
            amount: payment.paidamount,
            description: payment.productname,
            paymentAction: 'Sale',
            quantity: payment.quantity,
            unitPrice: payment.unitprice
          }, reqdata.token, reqdata.PayerID, function(err, data) {

            //if(err) { return handleError(res, err); }

            if(err || (data && data.ACK != 'Success')) {
              if(err) {
                var _data = data || {};
                _data['error'] = err.message;
                data = _data;
              }
              if(payment.status != 'COMPLETED') {
                payment.update({status: 'FAILED', gatewaysuccess: {}, gatewayfailure: data}, function(err, data) {
                  return res.redirect(config.email.defaultOriginUrl + '/purchase-failure/'+reqdata.token);
                });
              }
              else {
                return res.redirect(config.email.defaultOriginUrl + '/dashboard');
              }
            }
            else {
              payment.update({status: 'COMPLETED', gatewaysuccess: data, gatewayfailure: {}, active: true}, function(err, data) {

                if(payment.requirecredit === true) {
                  var _Credits = new Credits();
                  _Credits.updateCredits(payment.userid, {
                    silvercoins: (productTypeInfo.silverCoins ? (payment.coins) : 0),
                    goldcoins: (productTypeInfo.goldCoins ? (payment.coins) : 0),
                    silverquantity: (productTypeInfo.silverCoins ? (payment.quantity) : 0),
                    goldquantity: (productTypeInfo.goldCoins ? (payment.quantity) : 0),
                    dtcredits: (productTypeInfo.dtCredits ? (payment.coins) : 0)
                  }, function(err, data) {
                    console.log('Credits Info: ', err, data);
                  });

                  _Credits.addCreditTransferLog(payment.userid, {
                    amount: payment.coins,
                    description: 'Purchase Silver Pack',
                    type: 'silver',
                    subtype: 'P',
                    cointype: 'gold',
                    createdat: (new Date())
                  }, function(err, data) {
                    console.log('Credit Log Info: ', err, data._id);
                    doSilverPackPurchaseDistributionAndAddIntoActiveSilvePacks(payment, 1, 'silver');
                  });
                }

                // Send Paypal Purachase Silver Coin Email to the customer
                UserModel.findById(payment.userid+'', function(e, u) {
                  if(!e && u) {
                    var emailService = new EmailService();
                    payment.status = 'COMPLETED';
                    emailService.sendPurchaseEmail(u.email, u.name, '', payment);
                  }
                });

                res.cookie('token', reqdata.__uuid);
                return res.redirect(config.email.defaultOriginUrl + '/purchase-success/'+reqdata.token);
              });
            }

          });
        }

        if(payment.paymode == 'payza') {

          payment.update({gatewaysuccess: {}, gatewayfailure: {}, active: true}, function(err, data) {
            res.cookie('token', reqdata.__uuid);
            return res.redirect(config.email.defaultOriginUrl + '/purchase-success/'+reqdata.token);
          });
        }

        // var pzs = new PayzaService();
        // var isValid = pzs.validatePayment(reqdata, payment);
        // if(payment.paymode == 'payza' && isValid) {
        //
        //   payment.update({status: 'COMPLETED', gatewaysuccess: reqdata, gatewayfailure: {}, active: true}, function(err, data) {
        //
        //     var _Credits = new Credits();
        //     _Credits.updateCredits(payment.userid, {
        //       silvercoins: (productTypeInfo.silverCoins ? (payment.coins) : 0),
        //       goldcoins: (productTypeInfo.goldCoins ? (payment.coins) : 0),
        //       silverquantity: (productTypeInfo.silverCoins ? (payment.quantity) : 0),
        //       goldquantity: (productTypeInfo.goldCoins ? (payment.quantity) : 0),
        //       dtcredits: (productTypeInfo.dtCredits ? (payment.coins) : 0)
        //     }, function(err, data) {
        //       console.log('Credits Info: ', err, data);
        //     });
        //
        //     _Credits.addCreditTransferLog(payment.userid, {
        //       amount: payment.coins,
        //       description: 'Purchase Gold Pack',
        //       type: 'gold',
        //       subtype: 'P',
        //       cointype: 'gold'
        //     }, function(err, data) {
        //       console.log('Credit Log Info: ', err, data._id);
        //     });
        //
        //     res.cookie('token', reqdata.__uuid);
        //     return res.redirect('/purchase-success/'+reqdata.token);
        //   });
        //
        // }
        // else if(payment.paymode == 'payza' && !isValid) {
        //   payment.update({
        //     status: 'CANCELLED',
        //     gatewaysuccess: {
        //       STATUS: 'TEMPERED-INFO-RECEIVED',
        //       gResponse: reqdata
        //     },
        //     gatewayfailure: {},
        //     active: true
        //   }, function(err, data) {
        //     res.cookie('token', reqdata.__uuid);
        //     return res.redirect('/purchase-failure/'+reqdata.token);
        //   });
        // }

        if(payment.paymode == 'bankwire') {

          payment.update({status: 'PENDING', gatewaysuccess: {}, gatewayfailure: {}, active: true}, function(err, data) {
            res.cookie('token', reqdata.__uuid);
            return res.redirect(config.email.defaultOriginUrl + '/purchase-success/'+reqdata.token);
          });

        }

        if(payment.paymode == 'advcash' || payment.paymode == 'stp') {

          payment.update({gatewaysuccess: {}, gatewayfailure: {}, active: true}, function(err, data) {
            res.cookie('token', reqdata.__uuid);
            // Perform Notify task
            doNotifyWork(req, {token: reqdata.token,type: reqdata.type}, reqdata, null);
            return res.redirect(config.email.defaultOriginUrl + '/purchase-success/'+reqdata.token);
          });
        }

      });
    }
    else {
      return res.status(404).send('Invalid Request');
    }
  });
};

/**
* Confirmation before paying
* @function
* @param {string} token - url param, payment token
* @param {string} type - url param, payment type
* @access user
* @return {String} Pay Cancelled/pending/completed etc
*/
exports.payConfirm = function(req, res) {

  Payment.findOne({'paytoken.TOKEN': req.params.token, paymode: req.params.type}, function(err, payment) {

    var status = req.body.stp_transact_status;
    var gatewayData = {
      ACK: status,
      TOKEN: req.body.tr_id,
      AMOUNT: req.body.amount,
      MEMBER: req.body.member,
      ITEMID: req.body.item_id,
      EMAIL: req.body.email,
      MEMO: req.body.memo,
      TIMESTAMP: req.body.date
    }

    if(status == 'CANCELLED') {
      payment.update({status: 'CANCELLED', gatewaysuccess: {}, gatewayfailure: gatewayData, active: false}, function(err, data) {

        return res.status(200).send('Pay CANCELLED, ', payment._id);
      });
    }
    if(status == 'PENDING') {
      payment.update({status: 'PENDING', gatewaysuccess: gatewayData, gatewayfailure: {}, active: true}, function(err, data) {

        return res.status(200).send('Pay PENDING, ', payment._id);
      });
    }
    if(status == 'COMPLETE') {
      payment.update({status: 'COMPLETED', gatewaysuccess: gatewayData, gatewayfailure: {}, active: true}, function(err, data) {

        var productService = new ProductService();
        productService.getPurchaseProductType(payment.productid, function(productTypeInfo) {

          if(payment.requirecredit === true) {
            var _Credits = new Credits();
            _Credits.updateCredits(data.userid, {
              silvercoins: (productTypeInfo.silverCoins ? (data.coins) : 0),
              goldcoins: (productTypeInfo.goldCoins ? (data.coins) : 0),
              silverquantity: (productTypeInfo.silverCoins ? (data.quantity) : 0),
              goldquantity: (productTypeInfo.goldCoins ? (data.quantity) : 0),
              dtcredits: (productTypeInfo.dtCredits ? (data.coins) : 0)
            }, function(err, _data) {
              console.log('Credits Info: ', err, _data);
            });

            _Credits.addCreditTransferLog(data.userid, {
              amount: data.coins,
              description: 'Purchase Gold Pack',
              type: 'gold',
              subtype: 'P',
              cointype: 'gold'
            }, function(err, _data) {
              console.log('Credit Log Info: ', err, _data._id);
            });
          }

          return res.status(200).send('Pay Confirm');
        });
      });
    }
  });
};

/**
* Pay Notify
* @function
* @param {String} token - url param, payment token
* @param {String} type - url param, payment type
* @access user
* @return {string} error/success etc
*/
exports.payNotify = function(req, res) {
  console.log('[info] PayNotify : ' + req.params.token + ', ' + req.params.type, JSON.stringify(req.body));
  doNotifyWork(req, req.params, req.body, res);
};

/**
* @todo : fill in
* @function
* @param {string} body.token - payment token
* @access user
* @return {String} error/success etc
*/
exports.payzaNotify = function(req, res) {
  var pza = new PayzaService();

  pza.getIPNInfo(req.body.token, function(err, info) {

    if(!err) {
      Payment.findOne({'paytoken.TOKEN': info.apc_1+'', paymode: 'payza'}, function(err, payment) {

        if(!err && payment && pza.validatePayment(info, payment)) {
          doNotifyWork(req, {token: info.apc_1, type: 'payza'}, info, res);
        }
        else {

          console.log('[error] Payza IPN Payment Read Error >>> ');
          return res.status(200).send('Payza IPN Payment Read Error');
        }
      });
    }
    else {
      return res.status(200).send('Payza IPN Read Error');
    }
  })
};

/**
* User redirect from payment gateway to here by cancelling the payment process
* @function
* @param {number} query.token - payment token
* @access user
* @return {string} invalid request
*/
exports.returnCancel = function(req, res) {

  Payment.findOne({'paytoken.TOKEN': req.query.token}, function(err, payment) {

    res.cookie('token', req.query.__uuid);
    if(err) { console.log(err); return handleError(res, err); }
    if(!payment) { return res.status(404).send('Not Found'); }

    var payMode = req.params.type.split('-');

    if(payMode[0] == payment.paymode) {
      var gatewayFailure = req.query;
          gatewayFailure['TOKEN'] = req.query.token;
          gatewayFailure['ACK']   = "Cancel";

      payment.update({status: 'CANCELLED', gatewaysuccess: {}, gatewayfailure: gatewayFailure, active: false}, function(err, data) {
        return res.redirect(config.email.defaultOriginUrl + '/purchase-failure/'+req.query.token);
      });
    }
    else {
      return res.status(404).send('Invalid Request');
    }
  });
};


/**
* Do payment initial process here
* @todo : fill in
* @function
* @param {number} page
* @access user
* @return {json} payment info
*/
exports.doPaymentOld = function(req, res) {
  var paymentMethods = config.paymentMethods;

  if(parseInt(req.body.quantity) <= 0 || isNaN(parseInt(req.body.quantity))) {
    return res.status(200).json({error: true, message: 'Invalid Quantity'});
  }

  if(parseInt(req.body.quantity) >= 4000) {
    return res.status(200).json({error: true, message: 'Quantity must be in between 1 and 4000'});
  }

  // Validate reqest params so that required
  // parameters must be in their respective places
  if(
    (req.body.id != 'gold' && req.body.id != 'silver') ||
    (req.body.id != 'gold' && req.body.id == req.body.purchaseBy) ||
    (req.body.id == 'gold' && req.body.purchaseBy == 'silver') ||
    !paymentMethods[req.body.type] ||
    (req.body.id == 'gold' && req.body.type == 'ic') ||
    (req.body.id == 'silver' && req.body.type != 'ic' && req.body.type != 'paypal')
  ) {
    return res.status(200).json({error: true, message: 'Invalid Request'});
  }

  var ts = new ValidateService(UserWithdrawal);
  ts.isValid(req.user._id+'', 'payment', req.body.reqToken, function(error, _message) {

    if(error) { return res.status(200).json({ error: _message }); }

    var packsInfo   = config.packsInfo[req.body.id],
        unitcoins   = parseInt(packsInfo.coins),
        unitprice   = parseInt(packsInfo.price),
        quantity    = parseInt(req.body.quantity),
        paidAmount  = (quantity * unitprice),
        earnedCoins = (quantity * unitcoins);

    return processPaymentOld(req, res, {
      "unitcoins": unitcoins,
      "unitprice": unitprice,
      "quantity": quantity,
      "paidAmount": paidAmount,
      "earnedCoins": earnedCoins,
      "requirecredit": true,
      "productsubtype": 'normal'
    });
  });
};


/**
* Do payment initial process here
* @todo : fill in
* @function
* @param {number} page
* @access user
* @return {json} payment info
*/
exports.doPayment = function(req, res) {
  var paymentMethods = config.paymentMethods;
  if(req.body.coins) {
    if(parseInt(req.body.coins) < 1000 || isNaN(parseInt(req.body.coins)))
      return res.status(200).json({error: true, message: 'Invalid Quantity'});
    else if(parseInt(req.body.coins)%1000 != 0)
      return res.status(200).json({error: true, message: 'Coins must be multiple of 1000.'});
    else if(parseInt(req.body.quantity) > 4000)
      return res.status(200).json({error: true, message: 'Quantity must be in between 1 and 4000'});
  }

  if(isBusinessUser(req.user)){
    if(isNaN(parseInt(req.body.amount)))
      return res.status(200).json({error: true, message: 'Invalid Quantity'});
    else if(parseInt(req.body.amount) < config.apiConstants.MIN_ADD_FUND_BUSINESS_USER)
      return res.status(200).json({error: true, message: 'Amount must be grater then or equal to '+config.apiConstants.MIN_ADD_FUND_BUSINESS_USER});
  }

  if(!req.body.type  || !paymentMethods[req.body.type])
    return res.status(200).json({error: true, message: 'Invalid gateway'});
  else {
    var ts = new ValidateService(UserWithdrawal);
    ts.isValid(req.user._id+'', 'payment', req.body.reqToken, function(error, _message) {
      if(error) { return res.status(200).json({ error: true, message: _message }); }
      co(function*(){
        if(req.body.id === 'adscash') {
          let curInfo = yield CurrencyRate.findOne({currency : 'adscash', isactive: true, expireat: null});
          if(!curInfo){
            return res.json({error : true, message : 'Currency Rate not defind.'});
          }

          var unitcoins   = 1000,
              unitprice   = parseFloat(parseInt(unitcoins) * curInfo.rate),
              quantity    = parseInt(req.body.earnedCoins)/1000,
              paidAmount  = (quantity * unitprice),
              earnedCoins = parseInt(req.body.earnedCoins),
              gcrt = 0.025,
              gcPerAdc = parseFloat(curInfo.rate/gcrt),
              maxGoldCoinCanUse = parseInt(req.body.earnedCoins * config.apiConstants.GC_USE * gcPerAdc),
              gcUsed = parseInt(req.body.gcUsed);

            if(req.body.gcUsed && parseInt(req.body.gcUsed) > 0){
              /* validate gc at CI */
              var payService = new PayService();
              let ciGcCoins = yield payService.getCIGoldCoins(req.user._id);
              if(ciGcCoins.error){
                  return res.json({error : true, message : ciGcCoins.message});
              }
              if(ciGcCoins.coins < gcUsed)
                return res.json({error : true, message : 'You have only '+ciGcCoins.coins+' in CI wallet.'});
              else if(maxGoldCoinCanUse < gcUsed)
                return res.json({error : true, message : 'You can only use 75% payment using gold coins for this transaction'});
              else{
                paidAmount = parseFloat(paidAmount- parseFloat(req.body.gcUsed * gcrt));
              }
            }

            return yield processPayment(req, res, {
              "unitcoins": unitcoins,
              "unitprice": unitprice,
              "quantity": quantity,
              "paidAmount": paidAmount,
              "earnedCoins": earnedCoins,
              "gcUsed" : gcUsed,
              "requirecredit": true,
              "productsubtype": 'normal',
              "invoiceAmount" : req.body.invoiceAmount
            });
        }
        else if(req.body.id === 'usd') {
          var paidAmount = req.body.amount;
          if(paidAmount && isNaN(parseInt(paidAmount))){
            return res.json({error : true, message : 'Invalid fund.'});
          }
          else if (paidAmount && (paidAmount%100 != 0)) {
            return res.json({error : true, message : 'USD amount must be multiple of 100.'});
          }
          else{
            return yield processPayment(req, res, {
              "unitcoins": 0,
              "unitprice": 0,
              "quantity": 0,
              "paidAmount": paidAmount,
              "earnedCoins": 0,
              "gcUsed" : 0,
              "requirecredit": true,
              "productsubtype": 'normal'
            });
          }
        }
        else {
            return res.json({error : true, message : 'Invalid product.'});
        }
      }).catch(function(err){
        console.log("Error:"+err);
        return res.json({error : true, message : 'Something went wrong, please contact support team.'});
      });
    });
  }
};

exports.verifyPayment = function (req, res){
  co(function*(){
      if(!req.params.token)
        return res.json({error : true, message : 'Missing params'});

      let token = req.params.token;
      let payment = yield Payment.findOne({'paytoken.TOKEN' : token });
      if(!payment)
        return res.json({error : true, message : 'Payment details not found'});
      else if (!payment.gatewaydata || !payment.gatewaydata.address || !payment.gatewaydata.amount) {
        return res.json({error : true, message : 'Payment details are tempered., please contact support team'});
      }
      else if (payment.gatewaysuccess && ((payment.gatewaysuccess.data && payment.gatewaydata.amount == payment.gatewaysuccess.data.amount_received) || payment.gatewaydata.amount == payment.gatewaysuccess.available_balance)) {
            return res.json({error : false, istemp : 0, message : 'Payment success.', token : token });
      }
      else if (payment.gatewaysuccess && payment.gatewaysuccess.data && payment.gatewaysuccess.data.amount_received > 0) {
            return res.json({error : false, istemp : 1, message : 'You have paid incorrect amount, equalent amount of coins will be credited in your account.', token : token });
      }
      else{
        if (payment.paymode == "litecoinBlockIO") {
            return res.json({error : false, istemp : -1, message : "Payment not Confirmed. Please make sure that you've transferred the exact amount of LTC (plus Network Fee). Partial payments might cause unnecessary troubles!.", token : token });
        } else {
            return res.json({error : false, istemp : -1, message : "Payment not Confirmed. Please make sure that you've transferred the exact amount of BTC (plus Network Fee). Partial payments might cause unnecessary troubles!.", token : token });
        }
      }
  }).catch(function(err){
    console.log("[Err] Payment verification error:"+err);
    return res.json({error : true, message : 'Something went wrong, please contact support team.'});
  });
};

exports.doProductPayment = function(req, res) {

  var paymentMethods = config.paymentMethods;

  if(parseInt(req.body.quantity) <= 0 || isNaN(parseInt(req.body.quantity))) {
    return res.status(200).json({error: true, message: 'Invalid Quantity'});
  }

  if(parseInt(req.body.quantity) >= 4000) {
    return res.status(200).json({error: true, message: 'Quantity must be in between 1 and 4000'});
  }

  // Validate reqest params so that required
  // parameters must be in their respective places

  Products.findOne({"_id": req.body.id+''}, function(e, d) {
    if(e || !d) { return res.status(200).json({error: true, message: 'Invalid Request'}); }

    var ts = new ValidateService(UserWithdrawal);
    ts.isValid(req.user._id+'', 'payment', req.body.reqToken, function(error, _message) {

      if(error) { return res.status(200).json({ error: _message }); }

      if(d.subtype === 'soloemail') {
        var bdate = new Date(req.body.broadcastat);
        var _now  = new Date();

        if(bdate != 'Invalid Date' && bdate.getTime() >= _now.getTime()) {

          return SoloEmail.create({
            "userid": req.user._id,
            "broadcastdate": moment(bdate).format('YYYY-MM-DD'),
            "purchaseid": req.user.username+'-'+_now.getTime(),
            "subject": "Provide a 'cAtChY' subject line to attract eyeballs",
            "content": "Please provide content for the Email body. Include your contact details and website / link of your offer",
            "replyto": "People interested in your offer will contact on this email ID"
          }, function(_e, _d) {

            if(_e || !_d) {
              var _message = "Validation fail";

              if(_e) {
                console.log(_e);
                if(_e.errmsg.indexOf('duplicate') >=0 && _e.errmsg.indexOf("broadcastdate") >= 0) {
                  _message = "Ooops!!! Email Broadcast for this date is already booked. Please choose another slot.";
                }
                else if(_e.errmsg.indexOf('duplicate') >=0 && _e.errmsg.indexOf("purchaseid") >= 0) {
                  _message = "You have already registered your Soloemail content with us.";
                }
              }
              else if(!_e && !_d) {
                _message = 'Unable to take request now, please try after some time';
              }

              return res.status(200).json({error: true, "message": _message});
            }

            return processPayment(req, res, {
              "unitcoins": d.coins,
              "unitprice": d.amount,
              "quantity": parseInt(req.body.quantity),
              "paidAmount": d.amount,
              "earnedCoins": d.coins,
              "requirecredit": false,
              "product": _d,
              "productsubtype": d.subtype+'',
              "purchasemeta": {"broadcastdate": moment(bdate).format('YYYY-MM-DD')}
            });
          });
        }
        else {
          return res.status(200).json({error: true, message: 'Email broadcast date is invalid. Broadcast date should be greator than todays date'});
        }
      }
      else if(d.subtype === 'dailyads') {
        req.body.userid = req.user._id+'';
        var sdate = new Date(req.body.broadcaststart);
        var edate = new Date(req.body.broadcastend);
        return DailyLoginAdService.create(req.body, function(response) {
          if(response.error == true) {
            return res.status(200).json(response);
          }

          return processPayment(req, res, {
            "unitcoins": d.coins,
            "unitprice": d.amount,
            "quantity": parseInt(req.body.quantity),
            "paidAmount": (parseInt(d.amount) * parseInt(req.body.quantity)),
            "earnedCoins": (parseInt(d.coins) * parseInt(req.body.quantity)),
            "requirecredit": false,
            "product": response.data,
            "productsubtype": d.subtype+'',
            "purchasemeta": {
              "broadcaststart": moment(sdate).format('YYYY-MM-DD'),
              "broadcastend": moment(edate).format('YYYY-MM-DD'),
            }
          });
        })
      }
      else {
        return processPayment(req, res, {
          "unitcoins": d.coins,
          "unitprice": d.amount,
          "quantity": parseInt(req.body.quantity),
          "paidAmount": d.amount,
          "earnedCoins": d.coins,
          "requirecredit": true,
          "productsubtype": d.subtype+''
        });
      }
    });
  });
};

// return btc value of (- 2 %) of usdAmount and zero adscash coins for 20% of usdAmount
exports.calculatedBTCAdsCash = function(req, res) {
  co(function*() {
    var currencyType = 'USD',
        token = req.body.reqToken,
        usdAmount = parseFloat(req.body.amount),
        ts = new ValidateService(UserWithdrawal),
        blockIOService = new BlockIOService(),
        _Credits = new Credits(),
        time24Hour = new Date();

    if(isNaN(usdAmount) || parseFloat(usdAmount) < 0) {
      return res.status(200).json({error: true, message: 'Invalid amount to withdraw'});
    }

    if(usdAmount < config.apiConstants.MIN_WITHDRAWAL_LIMIT || usdAmount > config.apiConstants.MAX_WITHDRAWAL_LIMIT) {
      return res.status(200).json({error : true, message : 'Withdrawal amount must be within the range '+config.apiConstants.MIN_WITHDRAWAL_LIMIT+' USD and '+config.apiConstants.MAX_WITHDRAWAL_LIMIT+' USD'});
    }

    let credits = yield CreditModel.findOne({userid: req.user.id});
    if(!credits) {
      return res.status(200).json({ error : true, message : 'Unable to retrieve current account balance'});
    } else {
        if (credits.usd.value - usdAmount < config.signupBonus.usd) {
            return res.status(200).json({ error : true, message : 'You cannot withdraw Signup bonus'});
        }
    }

    ts.isValidTransaction(req.user._id+'', 'withdrawal', token, function(error, tokenData) {
      if(!error) {
        blockIOService.getBTCRate(function(err, data) {
          if(err || !data) {
            console.log("[Err] Error in getBTCRate ", err);
            return res.status(200).json({error: true, message: err});
          }
          if(data) {
            var priceObj = _.find(data.data.prices, function(o) {
              return (o.exchange === 'coinbase');
            });
            var price = parseFloat(priceObj.price).toFixed(8);
            var finalAmount = usdAmount - (config.apiConstants.WITHDRAWAL_ADMIN_FEE * usdAmount) / 100,
                btcAmount = parseFloat(finalAmount) / price;
            // _Credits.getCurrencyRate('adscash', function(cerr, crt){
              // if(cerr) {
              //   return res.status(200).json({error: true, message : 'Unable to get currency rates'});
              // }
              // var rate = crt.rate,
              //     repurchaseValue = (config.apiConstants.REPURCHASE_PERCENT * usdAmount) / 100;
              // adscashCoins = repurchaseValue / rate;
              // if(adscashCoins && btcAmount) {
            if(btcAmount) {
                time24Hour.setDate(time24Hour.getDate() - 1);
                Withdrawal.findOne({userid: req.user._id + '', withdrawaltype : 'usd', createdat : {$gte: time24Hour}}, function(_err, data) {
                  if(_err) {
                    console.log("[Err] Error in saving withdrawal : ", err);
                    return res.status(200).json({error: true, message : 'Could not process the request'});
                  }
                  if(data) {
                    var _message = "Cannot process another request within 24 hrs";
                    var exactDiff = '', hoursDiff = '', minuteDiff = '';
                    _message   = moment(data.createdat);
                    _message   = _message.add(1, 'day');
                    minuteDiff = _message.diff(moment(), 'minutes');
                    hoursDiff  = _message.diff(moment(), 'hours');
                    exactDiff  = (minuteDiff % 60);
                    exactDiff  = ((exactDiff && exactDiff > 1) ? ' ' + exactDiff + ' minutes' : ' an minute');
                    _message   = 'Please try again after ' + hoursDiff + ' hours' + (exactDiff != '' ? exactDiff : '');
                    return res.status(200).json({error: true, message : _message});
                  }
                  if(!data) {
                    Withdrawal.create({
                      userid : req.user._id + '',
                      username : req.user.username,
                      useremail : req.user.email,
                      userfullname : req.user.name,
                      status : 'INITIATED',
                      repurchasedamount : 0,
                      withdrawamount : finalAmount,
                      btcamount : btcAmount,
                      adscashcoins: 0,
                      withdrawaltype : 'usd',
                      // adscashcoins : parseInt(Math.round(adscashCoins)),
                      currentbtcrate: price,
                      requestedusd : usdAmount
                    }, function(err, withdrawal) {
                      if(err) {
                        console.log("[Err] Error in saving withdrawal : ", err);
                        return res.status(200).json({error: true, message : 'Could not process the request'});
                      } else {
                        // return res.status(200).json({error: false, adscash : parseInt(Math.round(adscashCoins)), btc : btcAmount, repurchase : repurchaseValue, withdrawamount: finalAmount, token : tokenData, currentbtcrate: price, id : withdrawal._id});
                        return res.status(200).json({error: false, btc : btcAmount, withdrawamount: finalAmount, token : tokenData, currentbtcrate: price, id : withdrawal._id});
                      }
                    })
                  }
                })
              } else {
                return res.status(200).json({error: true, message : 'Could not fetch calculated results'});
              }
            // });
          }
        })
      } else {
        return res.status(200).json({error: true, message : 'Invalid Request'});
      }
    });
  }).catch(function(err) {
    console.log("Error in calculatedBTC : ", err);
    return res.status(200).json({error: true, message : 'API Secret is not valid'});
  })
}

// return btc value of (80 % - 2 %) of usdAmount and no of adscash coins for 20% of usdAmount
exports.initializeWithdrawal = function(req, res) {
  co(function*() {
    var token = req.body.reqToken,
        ts = new ValidateService(UserWithdrawal),
        blockIOService = new BlockIOService(),
        _Credits = new Credits(),
        time24Hour = new Date();

    ts.isValidTransaction(req.user._id+'', 'withdrawal', token, function(error, tokenData) {
      if(!error) {

        if(req.body.withdrawaltype == 'usd'){
          var usdAmount = parseFloat(req.body.amount);
          if(isNaN(usdAmount) || parseFloat(usdAmount) < 0) {
            return res.status(200).json({error: true, message: 'Invalid amount to withdraw'});
          }

          if(usdAmount < config.apiConstants.MIN_WITHDRAWAL_LIMIT || usdAmount > config.apiConstants.MAX_WITHDRAWAL_LIMIT) {
            return res.status(200).json({error : true, message : 'Withdrawal amount must be within the range '+config.apiConstants.MIN_WITHDRAWAL_LIMIT+' USD and '+config.apiConstants.MAX_WITHDRAWAL_LIMIT+' USD'});
          }
          blockIOService.getBTCRate(function(err, data) {
            if(err || !data) {
              console.log("[Err] Error in getBTCRate ", err);
              return res.status(200).json({error: true, message: err});
            }
            if(data) {
              var priceObj = _.find(data.data.prices, function(o) {
                return (o.exchange === 'coinbase');
              });
              var price = parseFloat(priceObj.price).toFixed(8);
              // 2 % of 80 % of usd amount
              var eightyPercent = (((100 - config.apiConstants.REPURCHASE_PERCENT) * usdAmount) / 100),
                  finalAmount = eightyPercent - (config.apiConstants.WITHDRAWAL_ADMIN_FEE * eightyPercent) / 100,
                  btcAmount = parseFloat(finalAmount) / price,
                  adscashCoins = 0;
              _Credits.getCurrencyRate('adscash', function(cerr, crt){
                if(cerr) {
                  return res.status(200).json({error: true, message : 'Unable to get currency rates'});
                }
                var rate = crt.rate,
                    repurchaseValue = (config.apiConstants.REPURCHASE_PERCENT * usdAmount) / 100;
                adscashCoins = repurchaseValue / rate;
                if(adscashCoins && btcAmount) {
                  time24Hour.setDate(time24Hour.getDate() - 1);
                  Withdrawal.findOne({userid: req.user._id, withdrawaltype : 'usd', status : {$ne : 'INITIATED'}, createdat : {$gte: time24Hour}}, function(_err, data) {
                    if(_err) {
                      console.log("[Err] Error in saving withdrawal : ", err);
                      return res.status(200).json({error: true, message : 'Could not process the request'});
                    }
                    if(data) {
                      var _message = "Cannot process another request within 24 hrs";
                      var exactDiff = '', hoursDiff = '', minuteDiff = '';
                      _message   = moment(data.createdat);
                      _message   = _message.add(1, 'day');
                      minuteDiff = _message.diff(moment(), 'minutes');
                      hoursDiff  = _message.diff(moment(), 'hours');
                      exactDiff  = (minuteDiff % 60);
                      exactDiff  = ((exactDiff && exactDiff > 1) ? ' ' + exactDiff + ' minutes' : ' an minute');
                      _message   = 'Please try again after ' + hoursDiff + ' hours' + (exactDiff != '' ? exactDiff : '');
                      return res.status(200).json({error: true, message : _message});
                    }
                    if(!data) {
                      Withdrawal.create({
                        userid : req.user._id,
                        username : req.user.username,
                        useremail : req.user.email,
                        userfullname : req.user.name,
                        status : 'INITIATED',
                        repurchasedamount : repurchaseValue,
                        withdrawamount : finalAmount,
                        btcamount : btcAmount,
                        adscashcoins : parseInt(Math.round(adscashCoins)),
                        currentbtcrate: price,
                        requestedusd : usdAmount,
                        withdrawaltype : 'usd'
                      }, function(err, withdrawal) {
                        if(err) {
                          console.log("[Err] Error in saving withdrawal : ", err);
                          return res.status(200).json({error: true, message : 'Could not process the request'});
                        } else {
                          return res.status(200).json({error: false, adscash : parseInt(Math.round(adscashCoins)), btc : btcAmount, repurchase : repurchaseValue, withdrawamount: finalAmount, token : tokenData, currentbtcrate: price, id : withdrawal._id});
                        }
                      })
                    }
                  })
                } else {
                  return res.status(200).json({error: true, message : 'Could not fetch calculated results'});
                }
              });
            }
          });
        }
        else if (req.body.withdrawaltype == 'adscash') {
          var adscashcoins = parseFloat(req.body.amount),
              finalAmount = adscashcoins - (config.apiConstants.WITHDRAWAL_ADMIN_FEE * adscashcoins) / 100;
          if(isNaN(adscashcoins) || parseFloat(adscashcoins) < 0) {
            return res.status(200).json({error: true, message: 'Invalid amount to Withdrawal.'});
          }
          if(adscashcoins < config.apiConstants.MIN_ADC_WITHDRAWAL_LIMIT || adscashcoins > config.apiConstants.MAX_ADC_WITHDRAWAL_LIMIT) {
            return res.status(200).json({error : true, message : 'Withdrawal amount must be within the range '+config.apiConstants.MIN_ADC_WITHDRAWAL_LIMIT+' Coins and '+config.apiConstants.MAX_ADC_WITHDRAWAL_LIMIT+' Coins'});
          }

            time24Hour.setDate(time24Hour.getDate() - 1);
            Withdrawal.findOne({userid: req.user._id, withdrawaltype : 'adscash', status : {$ne : 'INITIATED'}, createdat : {$gte: time24Hour}}, function(_err, data) {
              if(_err) {
                console.log("[Err] Error in saving withdrawal : ", err);
                return res.status(200).json({error: true, message : 'Could not process the request'});
              }
              if(data) {
                var _message = "Cannot process another request within 24 hrs";
                var exactDiff = '', hoursDiff = '', minuteDiff = '';
                _message   = moment(data.createdat);
                _message   = _message.add(1, 'day');
                minuteDiff = _message.diff(moment(), 'minutes');
                hoursDiff  = _message.diff(moment(), 'hours');
                exactDiff  = (minuteDiff % 60);
                exactDiff  = ((exactDiff && exactDiff > 1) ? ' ' + exactDiff + ' minutes' : ' an minute');
                _message   = 'Please try again after ' + hoursDiff + ' hours' + (exactDiff != '' ? exactDiff : '');
                return res.status(200).json({error: true, message : _message});
              }
              if(!data) {
                Withdrawal.create({
                  userid : req.user._id,
                  username : req.user.username,
                  useremail : req.user.email,
                  userfullname : req.user.name,
                  status : 'INITIATED',
                  repurchasedamount : 0,
                  requestedadscash : adscashcoins,
                  withdrawamount : finalAmount,
                  btcamount : 0,
                  adscashcoins : 0,
                  currentbtcrate: 0,
                  requestedusd : 0,
                  withdrawaltype : 'adscash'
                }, function(err, withdrawal) {
                  if(err) {
                    console.log("[Err] Error in saving withdrawal : ", err);
                    return res.status(200).json({error: true, message : 'Could not process the request'});
                  } else {
                    return res.status(200).json({error: false, amount : withdrawal.requestedadscash, withdrawamount: finalAmount, token : tokenData, id : withdrawal._id});
                  }
                })
              }
            });

        }
        else {
            return res.status(200).json({error: true, message : 'Please specify a valid withdrawal type.'});
        }
      } else {
        return res.status(200).json({error: true, message : 'Invalid Request'});
      }
    });
  }).catch(function(err) {
    console.log("Error in calculatedBTC : ", err);
    return res.status(200).json({error: true, message : 'API Secret is not valid'});
  })
}

var processPayment = function* (req, res, paymentData) {
    try {
        var createData = {
            "userid": req.user._id,
            "icm": true,
            "productid": req.body.id,
            "productname": req.body.name,
            "quantity": paymentData.quantity,
            "unitprice": paymentData.unitprice,
            "unitcoins": paymentData.unitcoins,
            "paidamount": paymentData.paidAmount,
            "coins": paymentData.earnedCoins,
            "gcused": paymentData.gcUsed,
            "paymode": req.body.type,
            "paymode2": req.body.paymode2,
            "active": false,
            "status": 'PENDING PAYMENT',
            "requirecredit": paymentData.requirecredit,
            "productsubtype": paymentData.productsubtype,
            "purchasemeta": (paymentData.purchasemeta || {}),
            "is_business_payment" : isBusinessUser(req.user)
        };
        let payment = new Payment(createData);
        payment = yield payment.save();

        if(req.body.type == 'bitcoinBlockIO') {
          var blockIOService = new BlockIOService();
          var token = 'BLKBTC-'+uuid.v1();
          yield payment.update({ paytoken: {"TOKEN" : token, "ACK": "Success"} });
          blockIOService.createTxPayment(token, payment.paidamount, function(err, data){
            if(err){
              console.log("[Err] Blockio Payment error:");
              console.log(err);
              payment.update({ status : 'PENDING', gatewaydata : err }, function(err, pres){
                console.log("Payment Updated:",err,pres);
              });
              return res.json({ error: true, message: 'Unable to process payment.' });
            }
            else{
              payment.update({ status : 'PENDING', gatewaydata : data }, function(err, pres){
                console.log("Payment Updated:",err,pres);
              });
              data.id = payment._id;
              data.coins = payment.gcused;
              data.token = token;
              return res.json({ error: false, data : data });
            }
          });
        } else if (req.body.type == 'litecoinBlockIO') {
            var blockIOService = new BlockIOLtcService();
            var token = 'BLKLTC-'+uuid.v1();
            yield payment.update({ paytoken: {"TOKEN" : token, "ACK": "Success"} });
            blockIOService.createTxPayment(token, payment.paidamount, function(err, data){
              if(err){
                console.log("[Err] Blockio Payment error:");
                console.log(err);
                payment.update({ status : 'PENDING', gatewaydata : err }, function(err, pres){
                  console.log("Payment Updated:",err,pres);
                });
                return res.json({ error: true, message: 'Unable to process payment.' });
              }
              else{
                payment.update({ status : 'PENDING', gatewaydata : data }, function(err, pres){
                  console.log("Payment Updated:",err,pres);
                });
                data.id = payment._id;
                data.coins = payment.gcused;
                data.token = token;
                return res.json({ error: false, data : data });
              }
            });
        }
        else if (req.body.type == 'gc') {
          if(req.body.paymode2 == 'bitcoinBlockIO'){
              if(payment.gcused && payment.gcused > 0) {
                var deductData = yield deductCIGC(payment, req.user._id.toString(), payment.gcused);
                if(deductData.error) {
                  return res.status(200).json({error: true, message: deductData.message});
                } else if(!deductData.error){
                  payment = deductData.payment;
                  var blockIOService = new BlockIOService();
                  var token = 'BLKBTC-'+uuid.v1();
                  yield payment.update({ paytoken: {"TOKEN" : token, "ACK": "Success"} });
                  blockIOService.createTxPayment(token, payment.paidamount, function(err, data){
                    if(err){
                      console.log("[Err] Blockio Payment error:");
                      console.log(err);
                      payment.update({ status : 'PENDING', gatewaydata : err }, function(err, pres){
                        console.log("Payment Updated:",err,pres);
                      });
                      return res.json({ error: true, message: 'Unable to process payment.' });
                    }
                    else{
                      payment.update({ status : 'PENDING', gatewaydata : data }, function(err, pres){
                        console.log("Payment Updated:",err,pres);
                      });
                      data.id = payment._id;
                      data.coins = payment.gcused;
                      data.token = token;
                      return res.json({ error: false, data : data });
                    }
                  });
                }
              } else {
                return res.status(200).json({error: true, message: 'You must specify CI gold coins and try again'});
              }
            }
            else if (req.body.paymode2 == 'ic' && req.body.id == 'adscash') {
              let currencyRate = yield CurrencyRate.findOne({currency : 'adscash', isactive: true, expireat: null});
              if(!currencyRate) {
                return res.status(200).json({error: true, message: 'Unexpected error occurred'});
              } else {
                let credits = yield CreditModel.findOne({userid: payment.userid});
                if(!credits) {
                  return res.status(200).json({ error : true, message : 'Unable to retrieve credit balance'});
                } else {
                  let maxAdcCanPurchase = parseInt(credits.usd/currencyRate.rate),
                    gcrt = 0.025,
                    pAmount = paymentData.invoiceAmount - (payment.gcused * gcrt),
                    coinfromusd = parseInt(pAmount / currencyRate.rate);
                  if(credits.usd >= pAmount) {
                    if(payment.gcused && payment.gcused > 0) {
                      var deductData = yield deductCIGC(payment, req.user._id.toString(), payment.gcused);
                      if(deductData.error) {
                        return res.status(200).json({error: true, message: deductData.message});
                      } else {
                        payment = deductData.payment;
                        var _Credits = new Credits();
                        //let coinfromusd = parseInt(payment.coins - payment.gcused);
                        if(maxAdcCanPurchase && maxAdcCanPurchase < coinfromusd) {
                          var diff = ((coinfromusd - maxAdcCanPurchase)*currencyRate.rate);
                          return res.status(200).json({error : true, message: 'Your "USD wallet" balance is low, Please buy ' + Math.ceil(diff) + '  "USD"'});
                        }

                        if(maxAdcCanPurchase && maxAdcCanPurchase >= coinfromusd) {
                          var adcpacks = parseInt(payment.coins) / 1000;
                          _Credits.updateCredits(payment.userid, {
                            adscash: parseInt(payment.coins),
                            usd: (pAmount * -1),
                            adcpacks : adcpacks
                          }, function(err, data) {
                            console.log('Credits Info: ', err) //, data);

                            var timeStamp = (new Date()).getTime();
                            payment.status = 'COMPLETED';
                            payment.update({status: 'COMPLETED', active: true, paytoken: {'TOKEN': 'IC-'+timeStamp, 'ACK': 'Success'}}, function(err, _d) {
                              console.log('Payment Info active', err);
                            });

                            if(req.body.id == 'adscash') {
                              _Credits.addCreditTransferLog(payment.userid, {
                                amount: payment.coins,
                                description: 'Purchase '+payment.productname,
                                type: 'adscash',
                                subtype: 'P',
                                cointype: 'usd'
                              }, function(err, info) {
                                console.log('Credit Log Info: ', err, data);
                              });
                            }

                            _Credits.addCreditTransferLog(payment.userid, {
                              //amount: (((payment.coins-payment.gcused)*crt.rate)*-1),
                              amount: (pAmount * -1),
                              description: 'Purchase '+payment.productname,
                              type: 'usd',
                              subtype: 'W',
                              cointype: 'usd'
                            }, function(err, info) {
                              console.log('Credit Log Info Deduct: ', err, data);
                            });

                            var dservice = new DistributionService();
                            if(req.body.id == 'adscash') {
                              dservice.distributeAdscashProductCredits(payment.userid, payment.coins, 1, req.body.id, '', function(res){
                                if(res)
                                  console.log('Distribute commissions');
                                else
                                  console.log('[Error] Unable to distribute commissions');
                                  payment.update({tech_comment: 'COMMISSION_RELEASED'}, console.log);
                              });
                            }

                            var emailService = new EmailService();
                              emailService.sendPurchaseEmail(req.user.email, req.user.name, '', payment);

                            return res.status(200).json({ error : false, data : { id: payment._id, 'token': 'IC-'+timeStamp, 'ack': 'success', mi: false } } );
                          });
                        }
                      }
                    } else {
                      return res.status(200).json({error: true, message: 'You must specify CI gold coins and try again'});
                    }
                  } else {
                    return res.status(200).json({ error : true, message : 'Not enough USD balance to process payment'});
                  }
                }
              }
            }
            else {
              return res.json({ error: true, message : 'Invalid payment gateways.' });
            }
        }
        else if(req.body.type == 'ic' && req.body.id == 'adscash') {
          var _Credits = new Credits();
          _Credits.getCurrencyRate('adscash', function(cerr, crt){
            if(cerr){
              console.log(err);
              return res.status(200).json({error: true, message: 'Unexcepted error occoured'});
            }
            _Credits.getCredits(payment.userid, function(err, data) {
              if(err) {
                console.log(err);
                return res.status(200).json({error: true, message: 'Unexcepted error occoured'});
              }

              let maxAdcCanPurchase = parseInt(data.usd/crt.rate);
              if(maxAdcCanPurchase && maxAdcCanPurchase < payment.coins) {
                var diff = ((payment.coins - maxAdcCanPurchase)*crt.rate);
                return res.status(200).json({error: true, message: 'Your "USD wallet" balance is low, Please buy ' + Math.ceil(diff) + '  "USD"'});
              }

              if(maxAdcCanPurchase && maxAdcCanPurchase >= payment.coins) {
                var adcpacks = parseInt(parseInt(payment.coins) / 1000);
                payment.coins*crt.rate
                _Credits.updateCredits(payment.userid, {
                  adscash: parseInt(payment.coins),
                  usd: (parseInt(payment.coins*crt.rate)*-1),
                  adcpacks : adcpacks
                }, function(err, data) {
                  console.log('Credits Info: ', err) //, data);

                  var timeStamp = (new Date()).getTime();
                  payment.status = 'COMPLETED';
                  payment.update({status: 'COMPLETED', active: true, paytoken: {'TOKEN': 'IC-'+timeStamp, 'ACK': 'Success'}}, function(err, _d) {
                    console.log('Payment Info active', err);
                  });

                  if(req.body.id == 'adscash') {
                    _Credits.addCreditTransferLog(payment.userid, {
                      amount: payment.coins,
                      description: 'Purchase '+payment.productname,
                      type: 'adscash',
                      subtype: 'P',
                      cointype: 'usd'
                    }, function(err, info) {
                      console.log('Credit Log Info: ', err, data);
                    });
                  }

                  _Credits.addCreditTransferLog(payment.userid, {
                    amount: ((payment.coins*crt.rate)*-1),
                    description: 'Purchase '+payment.productname,
                    type: 'usd',
                    subtype: 'W',
                    cointype: 'usd'
                  }, function(err, info) {
                    console.log('Credit Log Info Deduct: ', err, data);
                  });

                  var dservice = new DistributionService();
                  if(req.body.id == 'adscash') {
                    dservice.distributeAdscashProductCredits(payment.userid, payment.coins, 1, req.body.id, '', function(res){
                      if(res)
                        console.log('Distribute commissions');
                      else
                        console.log('[Error] Unable to distribute commissions');
                        payment.update({tech_comment: 'COMMISSION_RELEASED'}, console.log);
                    });
                  }

                  var emailService = new EmailService();
                  // if(payment.productid == 'silver') {
                  //   Products.findById(payment.productid+'', function(e, p) {
                  //     if(!e && p) {
                  //       emailService.sendPurchaseEmail(req.user.email, req.user.name, '', payment, p.name);
                  //     }
                  //   })
                  // }
                  // else {
                    emailService.sendPurchaseEmail(req.user.email, req.user.name, '', payment);
                  //}

                  return res.status(200).json({ error : false, data : { id: payment._id, 'token': 'IC-'+timeStamp, 'ack': 'success', mi: false } } );
                });
              } else {
                return res.status(200).json({ error : true, message: 'You do not have enough USD balance'});
              }
            });
          });
        }
        else{
            return res.json({ error: true, message : 'Invalid payment gateways.' });
        }
    } catch (err) {
        console.log("[Err] Error:" + err);
        return res.json({
            error: true,
            message: err.message
        });
    }
};

var deductCIGC = function* (payment, userid, goldCoinsToDeduct) {
    let payService = new PayService();
    let gcDedResponse = yield payService.deductCIGoldCoins(userid, goldCoinsToDeduct);
    let paymentUpdate = {};
    if (gcDedResponse.error) {
      paymentUpdate = { comment: gcDedResponse.message, status: 'CIREJECTED' };
      return {error: true, message: 'We could not process gold coins from CI'};
    }
    else {
      paymentUpdate = { status: 'CISUCCESS' };
    }
    yield payment.update(paymentUpdate);
    return {error: false, message: 'CI coins deducted successfully', payment: payment};
}

exports.approvePayment = function(req, res) {
  co(function* () {
    if (req.body.data.productId == 'usd')  {
      let payment = yield Payment.findOne({_id : req.body.data.Payment_id}).populate( { path : "userid", select : "commission", model : "User" } ).exec();
      let businessCommission = { amount : 0, type : 'usd', percent : 0 };
      let amount = Math.round(req.body.data.amount * 10)/10;
      if(!payment){
        return res.json({error : true, message : 'Payment not found!!!'});
      }
      else if (payment.is_business_payment) {
        let commissionsAmount = ((amount * payment.userid.commission)/100);
        businessCommission =  { amount : commissionsAmount, type : 'usd', percent : payment.userid.commission };
      }
      let payService = new PayService();
      payService.updatePaymentInfo({
        params : { id : req.body.data.Payment_id },
        body: {
         paidamount : amount,
         status: req.body.data.status,
         gatewaysuccess : req.body.data.successData,
         commission : businessCommission
        }
      }, function(__err, pdata){
        let blockIOService = (pdata.paymode == "litecoinBlockIO") ? new BlockIOLtcService() : new BlockIOService();
        blockIOService.deleteNotification(req.body.data.notification_id, function(err, data){
          console.log("Blockio notification delete:"+req.body.data.notification_id, err, data);
            return res.json({error : false, message : 'Payment received.'});
        });
      });
    }
    else if (req.body.data.productId == 'adscash'){
        let payService = new PayService();
        console.log(req.body.data.productId);
        // let currencyrt = yield CurrencyRate.findOne({currency : 'adscash', isactive: true, expireat: null});
        // if(!currencyrt){
        //   console.log("[Error] CurrencyRate not defind.");
        //   return res.json({error : true, message : 'CurrencyRate not defind.'});
        // }
        // check for status and  ci gold coin balance
        let payment = yield Payment.find({_id : req.body.data.Payment_id});
        if(!payment) {
          return res.status(200).json({error : true, message : 'Payment Info not found'});
        } else {
          if(payment.paymode === 'gc' && payment.status == 'CANCELLED') {
            let gcBalance = yield payService.getCIGoldCoins(payment.userid);
            if(gcBalance > payment.gcused) {
              let coinsToDeduct = gcBalance - payment.gcused,
                  result        = yield payService.deductCIGoldCoins(payment.userid, coinsToDeduct);
              if(result.hasOwnProperty('error')) {
                return res.status(200).json({error : true, message : result.message});
              }
            }
          }
        }

        let gcused = payment.gcused ? parseInt(payment.gcused) : 0;
        payService.updatePaymentInfo({
          params : { id : req.body.data.Payment_id },
          body: {
           status:req.body.data.status,
           coins : (req.body.data.coinbybtc+gcused),
           paidamount : req.body.data.amount,
           gatewaysuccess : req.body.data.successData
          }
        }, function(__err, pdata){
          let blockIOService = new BlockIOService();
          blockIOService.deleteNotification(req.body.data.notification_id, function(err, data){
            console.log("Blockio notification delete:"+req.body.data.notification_id, err, data);
            Payment.findById(req.body.data.Payment_id, function(e, payment) {
              UserModel.findOne({_id : payment.userid}, function(_e, userData) {
                new EmailService().sendPurchaseApproveEmail(userData.email, userData.name, '', payment);
                return res.json({error : false, message : 'Payment received.'});
              });
            });
          });
        });
      }
    }, function(__err, pdata){
      let blockIOService = new BlockIOService();
      blockIOService.deleteNotification(req.body.data.notification_id, function(err, data){
        console.log("Blockio notification delete:"+req.body.data.notification_id, err, data);
          return res.json({error : false, message : 'Payment received.'});
      });
    });
}

var processPaymentOld = function(req, res, otherData) {

  var createData = {
    "userid": req.user._id,
    "productid": req.body.id,
    "productname": req.body.name,
    "quantity": req.body.quantity,
    "unitprice": otherData.unitprice,
    "unitcoins": otherData.unitcoins,
    "paidamount": otherData.paidAmount,
    "coins": otherData.earnedCoins,
    "paymode": req.body.type,
    "active": false,
    "status": 'PENDING PAYMENT',
    "requirecredit": otherData.requirecredit,
    "productsubtype": otherData.productsubtype,
    "purchasemeta": (otherData.purchasemeta || {})
  };

  Payment.create(createData, function(err, payment) {
    if(err) {
      return handleError(res, err);
    }

    if(req.body.id == 'gold' || req.body.id == 'silver') {
      GenealogyPurchase.create({userid: req.user._id}, function(e, d) {
        console.log('[info] Dirty User For Genealgoy: ', e, d._id);
      });
    }

    if(otherData.product && otherData.product._id) {
      otherData.product.update({purchaseid: payment._id}, function(_e, _d) {
        console.log('[info] We have added Purchase Id', _e);
      });
    }

    if(req.body.type == 'payza') {
      var service = new PayzaService();
      var token   = 'PZ-'+uuid.v1();
      var taxAmount = parseFloat(((((payment.paidamount * parseFloat(config.payza.apAdditionalcharges)) / 100) + parseFloat(config.payza.apPayzaFee)) / parseFloat(config.payza.apPayzaFeeDivision)).toFixed(2));
      var newAmount = payment.paidamount + taxAmount;

      var payInfo = service.getPayInfo(newAmount, taxAmount);

      payment.update({
        paytoken: {"TOKEN" : token, "ACK": "Success"},
        paidamount: newAmount,
        paymentHash: payInfo.payHash
      }, function(err, data) {
        console.log('PayToken: ', err, data);
      });

      return res.status(200).json({info: payInfo.payConfig, token: token, uuid: req.body._token});
    }

    if(req.body.type == 'stp') {

      var service = new STPService();
      var token = 'STP-'+uuid.v1();

      var newAmount = payment.paidamount + parseFloat(((((payment.paidamount * parseFloat(config.stp.processingFee)) / 100) + parseFloat(config.stp.addOnProcessingFee)) / parseFloat(config.stp.processingFeeDivision)).toFixed(2));

      payment.update({paytoken: {"TOKEN" : token, "ACK": "Success"}, paidamount: newAmount}, function(err, data) {
        console.log('PayToken: ', err, data);
      });

      return res.status(200).json({info: service.getPayInfo(), token: token, uuid: req.body._token});
    }

    if(req.body.type == 'advcash') {

      var service = new ADVCashService();
      var token = 'ADV-'+uuid.v1();

      payment.update({paytoken: {"TOKEN" : token, "ACK": "Success"}}, function(err, data) {
        console.log('PayToken: ', err, data);
      });

      return res.status(200).json({
        info: service.getPayInfo(payment.paidamount, payment.orderId),
        token: token,
        orderId: payment.orderId,
        uuid: req.body._token
      });
    }

    if(req.body.type == 'bitcoin') {
      var service = new BitcoinService();

      return res.status(200).json({PAYMENTURL: service.getAuthorizeURL('?__uuid='+req.body._token) });
    }

    if(req.body.type == 'bankwire') {

      var timeInfo  = new Date();
      var tokenInfo = 'BW-'+timeInfo.getFullYear()+'-'+payment.orderId+''+timeInfo.getMonth();

      BankWire.create({
        userid: req.user._id,
        username: req.user.username,
        userfullname: req.user.name,
        email: req.user.email,
        paymentid: payment._id,
        transactionid: tokenInfo,
        payamount: payment.paidamount,
        status: 'PENDING',
        quantity: payment.quantity
      }, function(bwerr, bw) {

        if(bwerr) { return handleError(res, err); }

        payment.update({paytoken: {"TOKEN" : tokenInfo, "ACK": "Success"}, active: false, status: 'PENDING'}, function(err, data) {
          console.log('PayToken: ', err, data);
        });

        return res.status(200).json({id: payment._id, 'token': tokenInfo, 'ack': 'success', mi: true});
      });
    }

    if(req.body.type == 'paypalOffline') {
      var timeInfo  = new Date();
      var tokenInfo = 'PP-'+timeInfo.getFullYear()+'-'+payment.orderId+''+timeInfo.getMonth();
      Usergatewaysinfo.create({
        userid: req.user._id,
        username: req.user.username,
        userfullname: req.user.name,
        email: req.user.email,
        paymentid: payment._id,
        transactionid: tokenInfo,
        payamount: payment.paidamount,
        status: 'PENDING',
        quantity: payment.quantity,
        gateway : req.body.type
      }, function(bwerr, bw) {
        if(bwerr) { return handleError(res, err); }
        payment.update({paytoken: {"TOKEN" : tokenInfo, "ACK": "Success"}, active: false, status: 'PENDING'}, function(err, data) {
          console.log('PayToken: ', err, data);
        });
        return res.status(200).json({id: payment._id, 'token': tokenInfo, 'ack': 'success', mi: true});
      });
    }

    if(req.body.type == 'ic') {

      var _Credits = new Credits();
      _Credits.getGoldCredits(payment.userid, function(err, data) {
        if(err) {
          console.log(err);
          return res.status(200).json({error: 'Unexcepted error occoured'});
        }

        if(!data || (data.total && data.total < payment.coins)) {
          var diff = ((!data || !data.total) ? (payment.quantity) : ((payment.coins - data.total) / 1000));

          if(otherData.product) {
            otherData.product.remove(function(__e, __p) {
              console.log('[info] SoloEmail Date Block Clear', __e);
            });
          }

          return res.status(200).json({error: 'Your "Gold Coins" balance is low, Please buy ' + Math.ceil(diff) + '  "Gold Packs"'});
        }

        if(data && data.total && data.total >= payment.coins) {
          _Credits.updateCredits(payment.userid, {
            silvercoins: (req.body.id == 'silver' ? payment.coins : 0),
            goldcoins: (payment.coins * -1),
            silverquantity: (req.body.id == 'silver' ? payment.quantity : 0),
            goldquantity: (req.body.id == 'silver' ? (payment.quantity * -1) : 0),
            dtcredits: 0
          }, function(err, data) {
            console.log('Credits Info: ', err) //, data);

            var timeStamp = (new Date()).getTime();
            payment.status = 'COMPLETED';
            payment.update({status: 'COMPLETED', active: true, paytoken: {'TOKEN': 'IC-'+timeStamp, 'ACK': 'Success'}}, function(err, _d) {
              console.log('Payment Info active', err);
            });

            if(req.body.id == 'silver') {
              _Credits.addCreditTransferLog(payment.userid, {
                amount: payment.coins,
                description: 'Purchase Silver Pack',
                type: 'silver',
                subtype: 'P',
                cointype: 'gold'
              }, function(err, info) {
                console.log('Credit Log Info: ', err, data);
              });
            }

            _Credits.addCreditTransferLog(payment.userid, {
              amount: (payment.coins * -1),
              description: ((req.body.id == 'silver') ? 'Purchase Silver Pack' : 'Product Purchase'),
              type: 'gold',
              subtype: 'W',
              cointype: 'gold'
            }, function(err, info) {
              console.log('Credit Log Info: ', err, data);
            });

            var dservice = new DistributionService();
            if(req.body.id != 'silver' && req.body.id != 'gold' && req.body.purchaseBy == 'gold') {
              dservice.distributeAdscashProductCredits(payment.userid, payment.coins, 1, req.body.id, '', function(res){ console.log(res); });
            }

            if(req.body.id == 'silver' && req.body.purchaseBy == 'gold') {
              doSilverPackPurchaseDistributionAndAddIntoActiveSilvePacks(payment, 1, req.body.id);
            }

            var emailService = new EmailService();
            if(payment.productid != 'silver') {
              Products.findById(payment.productid+'', function(e, p) {
                if(!e && p) {
                  emailService.sendPurchaseEmail(req.user.email, req.user.name, '', payment, p.name);
                }
              })
            }
            else {
              emailService.sendPurchaseEmail(req.user.email, req.user.name, '', payment);
            }

            return res.status(200).json({id: payment._id, 'token': 'IC-'+timeStamp, 'ack': 'success', mi: false});
          });
        }

      });
    }
  });
}

/**
* Gateways
* @function
* @param {number} page
* @access user
* @return {json} payment service options
*/
exports.getGateways = function(req, res) {
  var payService = new PayService();
  var paymentGateways = payService.getPaymentsServices();
  if(req.user._id == '57f3372980687d992292b7fa'){
      paymentGateways.payza =  'Payza (Payza Fee: (3.90 % + 0.59)/0.96 USD)';
  }
  return res.status(200).json(paymentGateways);
}

/**
* Get CreditInfo
* @function
* @access user
* @return {json} { quantity, maxAllow, dtCredits, dtCreditUnit }
*/
exports.creditsInfo = function(req, res) {
  var _Credits = new Credits();
  _Credits.getCredits(req.user._id, function(err, info) {

    if(err) { return handleError(res, err); }
    return res.status(200).json({credits: [{
      id: req.user._id,
      quantity: ((info && info.quantity) ? (info.quantity) : 0),
      maxAllow: config.maxQuantityAllowed,
      dtCredits: ((info && info.dtcredits) ? (info.dtcredits) : 0),
      dtCreditUnit: config.dtCreditUnit
    }]});
  });
}

/**
For Gold Coins:
Gold coin is the base currency of the system. To get Gold Coins there is only one way; purchase (i.e. Through Payment Gateways). Also all information related to Gold Coins is persists under collection "usercreditlogs". We can get complete details of Gold Coins from this collections (Purchase, Expense, Earned (i.e Through Revenue Share, Sales Commission for 'SILVER PACK PURCHASE'))

So, to calculate Gold Coins Info we only need to Aggregate "usercredtlogs", based on " cointype", "userid", "type" (i.e. "product", "gold")


For Silver Coins: Silver Coins are purchased by two ways (i.e. through "Gold Coins" and through "PayPal"). Also it information is distributed in three collections
"usercreditlogs" (User purchase Silver pack either by Gold Coins or PayPal) (Earned)
Say X = usercreditlogs.Aggregate this collection based on "userid" and match with "type" as "silver", "cointype" as "gold", "userid"

"viewcampaignlogs" (User earned Silver coins by viewing Text Ads) (Earned)
Say Y = viewcampaignlogs.Aggregate this collection based on "userid" and match with "userid"

"campaigns" (User created a Text Ads and assign credits) (Expense)
Say Z = campaigns.Aggregate this collection based on "userid" and match with "campaigntype" as "text", "userid"

Silver Coins = X + Y - Z
So to get complete information of Gold Coins we need to use "usercreditlogs" but in order to get Silver Coins info we need to see details from "usercreditlogs", "viewcampaignlogs", and "campaigns" collections.
* @function
* @param {number} page
* @access user
* @return {List<Campaign>} campaigns - 25 per page
*/
exports.packsInfo = function(req, res) {

  var _Credits = new Credits();
  var defResponse = {coins: 0, packs: 0, acoins: 0, apacks: 0}
  _Credits.getCredits(req.user._id, function(err, data) {
    if(err) { return handleError(res, err); }
    if(!data) { return res.status(200).json(defResponse); }

    if(req.body.type == 'adscash') {
      return res.status(200).json({
        coins: data.adscash,
        packs: 0,
        apacks: 0,
        acoins: data.adscash
      });
    }
    else if (req.body.type == 'usd') {
      return res.status(200).json({
        balance: data.usd,
      });
    }
    else{
        return res.status(200).json({
        usd: data.usd,
        adscash: data.adscash
      });
    }
  });
}

exports.totalCommissionEarned = function(req, res) {
  co(function* (){
    let userid = req.user._id.toString(),
        commissionData = yield CreditLogs.aggregate([{$match : {userid : userid, subtype: "C", type: "usd"}}, {$group : {_id: null, totalCommissionEarned : {$sum : '$coins'}}}]).exec();
    console.log(commissionData);
    if(commissionData && commissionData.length > 0) {
      return res.status(200).json({error : false, message : 'Total commission earned fetched', commission : commissionData[0].totalCommissionEarned });
    } else {
      return res.status(200).json({error : true, message : 'Could not get commission earned'});
    }
  }).then(function() {
    console.log("promise fulfilled");
  }).catch(function(err) {
    return res.status(200).json({error: true, message : err});
  })
}

/**
* Fetch Order History
* @function
* @param {number} page
* @access user
* @return {json} [ <payment> ]
*/
exports.getOrderHistory = function(req, res) {
  Payment.find({
    userid: req.user._id+'',
    // paymode: "ic",
    productid: {$nin: ['silver', 'gold']},
    active: true
  }, '-paytoken -__v -userid -seqPrefix').sort({createdAt: -1}).exec(function(err, data) {
    if(err) { return handleError(res, err); }
    return res.status(200).json({data: data});
  });
}

/**
* Bank Wire Info @todo : fill in
* @function
* @param {json} body : bank wire details
* @access user
* @return {json} { error, message, data }
*/
exports.bankWireInfo = function(req, res) {
  BankWire.findOne({userid: req.user._id, transactionid: req.body.utid}, function(err, bw) {

    if(err || !bw) {

      return res.status(200).json({error: 1, message: 'Invalid Request'});
    }

    bw.update({
      bankname: req.body.bankname,
      bankaddress: req.body.bankaddress,
      bankbranch: req.body.bankid,
      accountnumber: req.body.accountno,
      sortcode: req.body.bankid,
      comments: req.body.comments,
      depositorname: req.body.depositorname
    }, function(_err, _bw) {

      if(_err) {
        return res.status(200).json({error: 1, message: 'Unable to save information'});
      }

      Payment.findById(bw.paymentid+'', function(err, payment) {

        payment.update({active: true}, function(err, _d) {

          console.log('Enable Bank Wire Payment: ', err, _d);
          var emailService = new EmailService();
          emailService.sendPurchaseEmail(req.user.email, req.user.name, '', payment);
        })
      })

      return res.status(200).json({error: 0, message: 'Bank Wire Info Saved', data: bw});
    });
  });
}

/**
* Fetch Paypal Info
* @function
* @param {string} query.token
* @param {ObjectId} query.paymentid
* @access user
* @return {json} Paypal
*/

exports.paypalInfo = function(req, res) {
  Usergatewaysinfo.findOne({gatewaytxnId : req.body.gatewaytxnId }, function(_err, gwte){
    if (_err) {
      return res.status(200).json({error: 1, message: 'Invalid Request'});
    }
    else if (gwte) {
      return res.status(200).json({error: 1, message: 'Transaction ID already exist.'});
    }
    else {
      Usergatewaysinfo.findOne({userid: req.user._id, transactionid: req.body.utid, gateway : 'paypalOffline' }, function(err, pp) {

        if(err || !pp) {
          return res.status(200).json({error: 1, message: 'Invalid Request'});
        }
        var txdate = new Date(req.body.txdate);
        pp.update({
          receiptpath : req.body.receiptpath,
          gatewaytxnId : req.body.gatewaytxnId,
          comments: req.body.comments,
          txdate : moment(txdate).format('YYYY-MM-DD')
        }, function(_err, _pp) {
          if(_err) {
            return res.status(200).json({error: 1, message: 'Unable to save information'});
          }
          Payment.findById(pp.paymentid+'', function(err, payment) {
            payment.update({active: true}, function(err, _d) {
              console.log('Enable Paypal Offline  Payment: ', err, _d);
              var emailService = new EmailService();
              emailService.sendPurchaseEmail(req.user.email, req.user.name, '', payment);
            })
          })
          return res.status(200).json({error: 0, message: 'Paypal Info Saved', data: pp});
        });
      });
    }
  });
}

exports.getBankWireInfo = function(req, res) {
  var query = {
    transactionid: req.query.token,
    paymentid: req.query.paymentid
  };

  if(req.user.role != 'admin' && req.user.role != 'finance') {
    query['userid'] = req.user._id;
  }

  BankWire.findOne(query, function(err, data) {

    if(err) {
      return handleError(res, err);
    }

    return res.status(200).json({data: data});
  })
}

/**
* Get My BankWire docs
* @function
* @param {number} query.page
* @param {number} query.status : new/completed/cancelled
* @access user
* @return {json} [ <BankWire> ] : 25 per page
*/
exports.getBankWireFInfo = function(req, res) {
  var query = {depositorname: {$ne: null}, bankname: {$ne: null}};
  var viewLimit   = 25;
  var currentPage = (req.query.page ? req.query.page : 1);
  var skipRows    = (viewLimit * (currentPage - 1));

  if(req.query.fdata) {
    var fdata = req.query.fdata + '';
    query['$or'] = [
      {username: fdata},
      {userfullname: {$regex: fdata, $options: 'i'}},
      {email: fdata}, {transactionid: fdata}
    ];
  }

  if(req.query.status == 'new') {
    query['status'] = 'PENDING';
  }

  if(req.query.status == 'completed') {
    query['status'] = 'COMPLETED';
  }

  if(req.query.status == 'cancelled') {
    query['status'] = 'CANCELLED';
  }
  BankWire.find(query).sort({"_id": -1}).limit(viewLimit).skip(skipRows).exec(function(err, data) {
    if(err) {
      return handleError(res, err);
    }
    BankWire.count(query, function(err, rows) {
      return res.status(200).json({data: data, limit: viewLimit, rows: rows });
    });
  });
}

/**
* update bankwire
* @function
* @param {json} body : updation details
* @access user
* @return {string} updated successfully.
*/
exports.updateBankWire = function(req, res) {
  BankWire.findById(req.body.id+'', function(err, bankwire) {
    if(err) {
      return handleError(res, err);
    }

    Payment.findById(bankwire.paymentid+'', function(err, payment) {

      bankwire.update({
        swiftid: req.body.swiftid,
        goldpacks: req.body.goldpacks,
        adminbankaccount: req.body.adminbankaccount,
        admincomments: req.body.admincomments,
        status: 'COMPLETED'
      }, function(err, data) {
        console.log('Bank Wire Update: ', err, data);
      });

      var data = req.body;
      data['ACK'] = 'SUCCESS';

      payment.update({
        status: 'COMPLETED', gatewaysuccess: data, gatewayfailure: {}, active: true,
        quantity: req.body.goldpacks,
        coins: (req.body.goldpacks * 1000)
      }, function(err, data) {

        if(payment.requirecredit === true) {
          var _Credits = new Credits();
          _Credits.updateCredits(payment.userid, {
            silvercoins: 0,
            goldcoins: (req.body.goldpacks * 1000),
            silverquantity: 0,
            goldquantity: req.body.goldpacks,
            dtcredits: 0
          }, function(err, data) {
            console.log('Credits Info: ', err, data);
          });

          _Credits.addCreditTransferLog(payment.userid, {
            amount: (req.body.goldpacks * 1000),
            description: 'Purchase Gold Pack',
            type: 'gold',
            subtype: 'P',
            cointype: 'gold'
          }, function(err, data) {
            console.log('Credit Log Info: ', err, data._id);
          });
        }

        var emailService = new EmailService();
        //emailService.sendBankWireAdminEmails(bankwire, payment, req.body);
        payment.status = 'COMPLETED';
        emailService.sendPurchaseEmail(bankwire.email, bankwire.userfullname, '', payment);

        return res.status(200).send('Update Successfully');
      });

    });

  });
}

/**
* Cancel bankwire or paypal
* @function
* @param {ObjectId} body.id
* @access user
* @return {string} cancel txn successfull
*/
exports.cancelTransaction = function(req, res) {
  co(function* () {
    var blockIOService;
    if (req.body.type == 'litecoinBlockIO') {
        blockIOService = new BlockIOLtcService();
    } else {
        blockIOService = new BlockIOService();
    }
    var payService = new PayService();
    var emailService = new EmailService();
    var payment = yield Payment.findById(req.body.id);
    if(!payment) {
      return res.status(200).json({error : false, message : 'Payment Info not found'});
    }
    else {
      if (payment.paymode == 'bitcoinBlockIO' || payment.paymode == 'litecoinBlockIO') {
        let udata = yield UserModel.findOne({_id : payment.userid });
        let _data = yield payment.update({status: 'CANCELLED'});
        if(undefined != udata && null != udata) {
          if(undefined != _data && null != _data) {
            blockIOService.deleteNotification(payment.gatewaydata.notification_id, function(err, data){
              console.log("Blockio notification delete:"+payment.gatewaydata.notification_id, err, data);
              blockIOService.archriveAddress(payment.gatewaydata.address, function(archerr, archdata){
                console.log("Blockio address archrived:"+payment.gatewaydata.address, archerr, archdata);
                payment.status = 'CANCELLED';
                emailService.sendTransactionCancelEmail(udata.email, udata.name, '', payment);
                return res.status(200).json({error : false, message : 'Transaction Cancelled Successfully'});
              });
            });
          } else {
            return res.status(200).json({error : true, message : 'Could not update payment status'});
          }
        } else {
          return res.status(200).json({error : true, message : 'User details does not exists'});
        }
      }
      else if( payment.paymode == 'gc') {
          let result = yield payService.refundCIGoldGoins(payment);
          if(result.hasOwnProperty('error')) {
            console.log("[Error] Refund gold coin error:",result.error);
            return res.status(200).json({error : true, message : result.message});
          } else {
            if(payment.paymode2 == 'bitcoinBlockIO'){
              let udata = yield UserModel.findById(payment.userid);
              let _data = yield payment.update({status : 'CANCELLED'});
              if(undefined != udata && null != udata) {
                if(undefined != _data && null != _data) {
                  blockIOService.deleteNotification(payment.gatewaydata.notification_id, function(err, data){
                    console.log("Blockio notification delete:"+payment.gatewaydata.notification_id, err, data);
                    blockIOService.archriveAddress(payment.gatewaydata.address, function(archerr, archdata){
                      console.log("Blockio address archrived:"+payment.gatewaydata.address, archerr, archdata);
                      payment.status = 'CANCELLED';
                      emailService.sendTransactionCancelEmail(udata.email, udata.name, '', payment);
                      return res.status(200).json({error : false, message : 'Transaction Cancelled Successfully'});
                    });
                  });
                } else {
                  return res.status(200).json({error : true, message : 'Could not update payment status'});
                }
              } else {
                return res.status(200).json({error : true, message : 'User details does not exists'});
              }
            }
            else if(payment.paymode2 == 'ic'){
              return res.status(200).json({error : false, message : 'Transaction Cancelled Successfully'});
            }
            else{
              return res.status(200).json({error : true, message : 'Invalid Gateway'});
            }
          }
      }
    }
   }).catch(function (err) {
       console.log("Error from ci:"+err);
       return res.status(200).json({ error : true, message : 'Something went wrong' });
   });
}

exports.viewTransaction = function(req, res) {
  Payment.findById(req.params.txnid, function(err, data) {
    if(err) {
      return handleError(res, err);
    }
    return res.status(200).json({data: data});
  })
}

exports.viewTransactionStatus = function (req, res) {
  co(function *(){
    var paymode = req.query.paymode;
    var network = (paymode == 'litecoinBlockIO') ? config.ltcBlockIO.network : config.blockIO.network;
    var options = {
        url: 'https://chain.so/api/v2/get_tx_outputs/'+network+'/' + req.params.txnid
    };
    let result = yield request.get(options);
    if(result.body) {
        return res.status(200).json({data: JSON.parse(result.body), error: false});
    } else {
      return res.status(200).json({data: JSON.parse(result.error), error: true});
    }
  })
}

/**
* Update BankWire receipt path
* @function
* @param {ObjectId} body.id
* @param {string} body.receiptpath
* @access user
* @return {List<Campaign>} campaigns - 25 per page
*/
exports.updateReceiptPath = function(req, res) {
  if (req.body.type && req.body.type == 'bankwire') {
    BankWire.findOne({paymentid: req.body.id+''}, function(err, bankwire) {
      if(err) {
        return handleError(res, err);
      }

      bankwire.update({receiptpath: req.body.receiptpath}, function(err, data) {
        return res.status(200).send('Receipt Path Updated');
      });

    })
  }
  else if(req.body.type && req.body.type == 'paypalOffline') {
    Usergatewaysinfo.findOne({paymentid: req.body.id+'', gateway : 'paypalOffline' }, function(err, ugi) {
      if(err) {
        return handleError(res, err);
      }
      ugi.update({receiptpath: req.body.receiptpath}, function(err, data) {
        return res.status(200).send('Receipt Path Updated');
      });
    })
  }
}

exports.generateAndSendOtp = function(req, res) {
  var otp = getOtp();
  var type = req.body.type;
  if(!otp){
      return res.status(200).json({error: true, message: 'Something went wrong!'});
  } else {
      var query = {
        userid: req.user._id,
        otp: otp,
        type: type,
        isactive: true
      };
      OtpGeneration.create(query, function(err, data) {
        if(err) {
          return res.status(200).json({error: true, message: 'Something went wrong!'});
        } else {
          var otpType = (type == 'transfer') ? 'USD Transfer' : 'USD Withdrawal';
          var emailService = new EmailService();
          emailService.sendOtpEmail(req.user.email, req.user.name, otp, otpType);
          return res.status(200).json({error: false, message: 'OTP Sent to mail'});
        }
      });
  }
}

/**
* Transfer Gold coins from one user to another
* @function
* @param {json} body : transfer details
* @access user
* @return {json} { error, success }
*/

exports.transferUSDAmount = function(req, res) {
  console.log("Transfer usd details:",req.user, req.body);
  var dd = new Date();
  console.log(dd);
  // transferring usd amount from U1 to U2
  if(!req.body.otp || req.body.otp.trim() == '') {
    return res.status(200).json({error: true, message: 'Invalid request. Please provide OTP', otpError : true, _t: req.body.reqToken});
  }

  if(!req.body.reqToken || req.body.reqToken.trim() == '') {
    return res.status(200).json({error: true, message: 'Invalid request, Required information is missing.', otpError : false});
  }

  if(isNaN(parseInt(req.body.coins))) {
    console.log("condition 1")
    return res.status(200).json({error: true, message: 'Invalid request.', otpError : false});
  }
  if(parseInt(req.body.coins) > 500) {
    if (config.noLimitFundTransferUsers.indexOf(req.user._id) < -1) {
        return res.status(200).json({error: true, message: 'Maximum transfer limit is 500 USD', otpError : false});
    }
  }

  if(req.body.email === req.user.email) {
    return res.status(200).json({error: true, message: 'You cannot transfer USD to self account', otpError : false});
  }

  var cdt = new Credits();
  var ts = new ValidateService(UserWithdrawal);
  ts.isValidTransaction(req.user._id+'', 'transfer', req.body.reqToken, function(error, _message) {

      if ( !error ) {

        if(req.body.otp) {
          // let dt = new Date();
          //     dt.setMinutes(dt.getMinutes() - 15);
          OtpGeneration.findOne({'userid': req.user._id, 'type' :'transfer', 'isactive' : true }).sort({createdat: -1}).exec(function(err, otpData) {
            if(err || !otpData) {
              console.log('[Error] Otp verify fail:', err, otpData);
              return res.status(200).json({error: true, message: 'Unable to verify OTP', otpError : true, _t: _message});
            } else {
              console.log(req.body.otp, otpData.otp);
              if(req.body.otp != otpData.otp) {
                return res.status(200).json({error: true, message: 'Please enter the correct OTP.', otpError : true, _t: _message});
              } else {
                otpData.update({isactive : false}, function(err){
                    console.log("Otp isactive updated to false", otpData);
                });
                console.log("Otp verified:", otpData);
                cdt.getCredits(req.user._id+'', function(gcerr, gc) {
                  if(gcerr || !gc) { return res.status(200).json({error: true, message: 'Unable to verify your USD balance', otpError : false}); }

                  // User don't have enough Gold Coin balance to transfer
                  // if(gc && gc.total && parseFloat(gc.total) < parseFloat(req.body.coins)) {
                  //   return res.status(200).json({error: 'Not enough balance'});
                  // }
                  if(gc && gc.usd.valueOf() && parseFloat(gc.usd.valueOf()) < parseFloat(req.body.coins)) {
                    return res.status(200).json({error: true, message: 'You do not have enough USD Wallet balance to transfer '+req.body.coins+' USD', otpError : false});
                  }

                  if(gc && gc.usd.valueOf() && (parseFloat(gc.usd.valueOf()) - parseFloat(req.body.coins) < 10)) {
                    return res.status(200).json({error: true, message: 'You cannot transfer your signup Bonus to other users.', otpError : false});
                  }

                  // if((gc && gc.length == 0) || (gc && gc.total && isNaN(gc.total))) {
                  //   return res.status(200).json({error: 'Invalid Request'});
                  // }
                  if(gc && gc.usd.valueOf() && isNaN(gc.usd.valueOf())) {
                    console.log("condition 2")
                    return res.status(200).json({error: true, message: 'Invalid Request', otpError : false});
                  }
                  // All ok now transfer
                  if(gc && gc.usd.valueOf() && parseFloat(gc.usd.valueOf()) >= parseFloat(req.body.coins)) {
                    UserModel.findOne({email: req.body.email, isBlocked : false, verified : true }, function(err, user) {
                      if(err) {
                        return res.status(200).json({error: true, message : 'Unable to transfer USD to '+req.body.email, otpError : false});
                      }

                      if(!user) {
                        return res.status(200).json({
                          error: true, message: 'Unable to transfer because no user found with specified email address', otpError : false
                        });
                      }


                      var adminFee = (config.businessRoles.indexOf(req.user.role) >= 0) ? 0 : ((req.body.coins * config.apiConstants.USD_TRANSFER_FEE) / 100);
                      var addCoins = (req.body.coins - adminFee);
                      var adminFeeData = {
                        fuserid: req.user._id,
                        fusername: req.user.username,
                        fuserfullname: req.user.name,
                        femail: req.user.email,
                        coins: adminFee,
                        tuserid: user._id,
                        tusername: user.username,
                        tuserfullname: user.name,
                        tuseremail: user.email
                      };

                      // Adding usd to U2 credits
                      var _Credits = new Credits();
                      _Credits.updateCredits(user._id, {
                        adscash : 0,
                        usd : addCoins,
                        adcpacks : 0
                      }, function(err, data) {
                        console.log('Tranfer Credits Info (Receiver): ', err, data);
                        if(err) {
                          return res.status(200).json({error: true, message : 'Unbale to transfer USD', otpError : false});
                        }
                      });

                      // Adding in credit transfer logs of U2
                      _Credits.addCreditTransferLog(user._id, {
                        amount: req.body.coins,
                        description: 'Received USD (Transfer By: ' + req.user.email + ')',
                        type: 'usd',
                        subtype: 'P',
                        cointype: 'usd'
                      }, function(err, data) {
                        console.log('Credit Log Info: ', err, data._id);
                        if(err) {
                          return res.status(200).json({error: true, message : 'Unbale to transfer USD', otpError : false});
                        }
                      });

                      // Adding credit log negative for admin fee (Remove USD as Admin Fee)
                      if(adminFee > 0){
                        _Credits.addCreditTransferLog(user._id, {
                          amount: (adminFee * -1),
                          description: 'Transfer USD amount (Admin Fee: '+config.apiConstants.USD_TRANSFER_FEE+'%)',
                          type: 'usd',
                          subtype: 'P',
                          cointype: 'usd'
                        }, function(err, data) {
                          console.log('Credit Log Info: ', err, data._id);
                          if(err) {
                            return res.status(200).json({error: true, message : 'Unbale to transfer USD', otpError : false});
                          }
                        });
                      }

                      // Removing USD amount from U1 credits
                      _Credits.updateCredits(req.user._id, {
                        usd: (req.body.coins * -1),
                        adscash: 0,
                        adcpacks : 0
                      }, function(err, data) {
                        console.log('Transfer Credits Info (Sender): ', err, data);
                        if(err) {
                          return res.status(200).json({error: true, message : 'Unbale to transfer USD', otpError : false});
                        }
                      });

                      // Transfer logs in U1 creditlog
                      _Credits.addCreditTransferLog(req.user._id, {
                        amount: (req.body.coins * -1),
                        description: 'Transfer USD amount (To user: ' + user.email + ')',
                        type: 'usd',
                        subtype: 'W',
                        cointype: 'usd'
                      }, function(err, data) {
                        console.log('Credit Log Info: ', err, data._id);
                        if(err) {
                          return res.status(200).json({error: true, message : 'Unbale to transfer USD', otpError : false});
                        }
                      });

                      if(adminFee > 0){
                        // Adding USD Transfer Admin Fee Info
                        TransferModel.create(adminFeeData, function(err, t) {
                          if(err) {
                            console.log('[err] Add Transfer Admin Fee Raised Error: ', err, JSON.stringify(adminFeeData));
                          }
                        });
                      }

                      var emailService = new EmailService();
                      emailService.sendUSDTransferEmail(req.user.email, req.user.name, {transferredTo : req.body.email, usdAmount : req.body.coins});
                      return res.status(200).json({error : false , message : req.body.coins+' USD successfully transferred to '+req.body.email, otpError : false});

                    });
                  }
                  else {
                    return res.status(200).json({error: true, message :'Invalid Request', otpError : false});
                  }
                });
              }
            }
          });
        }
        else{
          return res.status(200).json({error: true, message :'Missing params', otpError : false});
        }
      } else {
        console.log("condition 4");
        return res.status(200).json({error: true, message : 'Invalid Request', otpError : false});
      }
    });
}

/**
Resend OTP to user for USD transfer and withdrawal transactions
**/

exports.resendOtp = function(req, res) {
  if(!req.user._id || !req.body.type) {
    return res.status(200).json({error: true, message: 'Cannot send otp', otpError: true});
  } else {
    var userid = req.user._id,
        type = req.body.type;

    var otp = getOtp();
    var query = {
      userid: userid,
      otp: otp,
      type: type,
      isactive: true
    };

    OtpGeneration.findOne({userid: userid, type: type, isactive: true}).sort({createdat: -1}).exec(function(err, otpData){
      if(err) {
        return res.status(200).json({error: true, message: 'Cannot send otp'});
      }
      if(otpData) {
        otpData.remove(function(_e, d) {});
      }
    });

    OtpGeneration.create(query, function(err, data) {
      if(err) {
        return res.status(200).json({error: true, message: 'Something went wrong!'});
      } else {
        var otpType = (type == 'transfer') ? 'USD Transfer' : 'USD Withdrawal';
        var emailService = new EmailService();
        emailService.sendOtpEmail(req.user.email, req.user.name, otp, otpType);
        return res.status(200).json({error: false, message: 'OTP Sent to mail'});
      }
    });
  }
}

/**
* Get paginated list of transfers
* @function
* @param {number} query.page
* @access user
* @return {json} [ <TransferModel> ] - 25 per page
*/
exports.getTransferRegister = function(req, res) {

  var query = {};

  var viewLimit   = 25;
  var currentPage = (req.query.page ? req.query.page : 1);
  var skipRows    = (viewLimit * (currentPage - 1));

  if(req.query.fdata) {
    var fdata = req.query.fdata + '';
    query['$or'] = [{fusername: fdata}, {fuserfullname: fdata}, {femail: fdata}, {tusername: fdata}, {tuserfullname: fdata}, {tuseremail: fdata}];
  }

  TransferModel.find(query).sort({"_id": -1}).limit(viewLimit).skip(skipRows).exec(function(err, data) {

    if(err) {
      return handleError(res, err);
    }

    TransferModel.count(query, function(err, rows) {

      TransferModel.aggregate({
        $group: {
          "_id": null,
          totalTransfer: {$sum: "$coins"}
        }
      }, function(_err, _row) {

        return res.status(200).json({
          data: data,
          limit: viewLimit,
          rows: rows,
          totalTransfer: (((_row && _row.length > 0) ? _row[0].totalTransfer : 0))
        });

      });

    });
  })
};

/**
* Paypal usage validation : $150 per day limit
* @function
* @param {number} page
* @access user
* @return {json} { isAllow, lastPayAmount, allowAmount }
*/
exports.canUsePaypal = function(req, res) {

  var paypalLimit = parseInt(config.paypalLimit);
  var currentTime = new Date();
      currentTime.setDate(currentTime.getDate() - 1);

  Payment.find({
    userid: req.user._id+'',
    paymode: 'paypal',
    status: 'COMPLETED',
    active: true,
    createdAt: {"$gt": currentTime}
  }, function(err, pay) {

    if(err || !pay || (pay && pay.length == 0)) {
      return res.status(200).json({isAllow: true, lastPayAmount: 0, allowAmount: paypalLimit });
    }

    if(pay && pay.length > 0) {
      var totalPaid = 0;
      pay.forEach(function(_pay) {
        totalPaid = totalPaid + _pay.paidamount;
      });

      return res.status(200).json({
        isAllow: (totalPaid < paypalLimit),
        lastPayAmount: totalPaid,
        allowAmount: ((totalPaid <= paypalLimit) ? (paypalLimit - totalPaid) : 0)
      });
    }
  });
}

/**
* Get user payment
* @function
* @param {number} body.userid,body.orderid
* @access user
* @return {json} { error, payinfo}
*/
exports.userPaymentsInfo = function(req, res) {

  Payment.findOne({userid: req.body.userid+'', orderId: parseInt(req.body.orderid)}, function(err, pay) {

    if(err || !pay) {
      return res.status(200).json({error: true, message: 'Data not found'});
    }

    return res.status(200).json(pay);
  });
}

/**
* Mark payment completed manually
* @function
* @param {json} body.userid,body.orderid
* @access user
* @return {string} success/error
*/
exports.markPaymentCompleteBlocked = function(req, res) {

  Payment.findOne({userid: req.body.userid+'', orderId: parseInt(req.body.orderid)}, function(err, pay) {

    if(err || !pay) {
      return res.status(200).json({error: true, message: 'Data not found'});
    }

    pay.update({
      status: 'COMPLETED',
      gatewaysuccess: {'ACK': 'Manual Completed', TOKEN: req.body.advkey},
    }, function(e, d) {

      if(e) {
        return res.status(200).json({error: true, message: 'Unable to block payment'});
      }

      return res.status(200).send('Marked Payment Transferred');
    });

  });
}

/**
* After payment is completed, Notify post processing work
* @function
* @param {number} body.userid,body.orderid
* @access user
* @return {string} success/error
*/
exports.markPaymentCompleted = function(req, res) {

  Payment.findOne({userid: req.body.userid+'', orderId: parseInt(req.body.orderid)}, function(err, pay) {

    if(err || !pay) {
      return res.status(200).json({error: true, message: 'Data not found'});
    }

    if(!err && pay) {
      return doNotifyWork(req, {token: pay.paytoken.TOKEN, paymode: pay.paymode, type: pay.paymode}, {
        ac_transaction_status: 'COMPLETED',
        ac_transfer: req.body.advkey,
        ac_buyer_email: req.body.buyeremail,
        ac_buyer_amount_without_commission: pay.paidamount,
        ac_buyer_amount_with_commission: 0,
        ac_ps: '',
        ac_buyer_verified: '',
        ac_fee: 0,
        ac_amount: pay.paidamount,
        ac_src_wallet: '',
        __uuid: 'manual-complete',
        token: 'manual-complete',
        PayerID: '?ac_src_wallet=manual-complete'
      }, res);
    }

  });
}


/**
* Get paginated list of all purchases
* @function
* @param {number} query.page
* @param {number} query.filters - user/email filters
* @access user
* @return {json} [ payment ] - 25 per page
*/
exports.listAllPurchase = function(req, res) {

  var query       = {};
  var viewLimit   = 25;
  var currentPage = (req.query.page ? req.query.page : 1);
  var skipRows    = (viewLimit * (currentPage - 1));
  var filters     = req.query.filters;
  var conditions  = {};

  if(undefined != req.query.view && null != req.query.view && '' != req.query.view) {
    query.status = req.query.view;
  }

  if(undefined != req.query.paymentthrough && null != req.query.paymentthrough && '' != req.query.paymentthrough) {
    query.paymode = req.query.paymentthrough;
  }
    var tillDate = req.query.tillDate;
    var fromDate = req.query.fromDate;
  if(tillDate && fromDate){
        /*fromDate = new Date(new Date(new Date(new Date(fromDate).setHours(0)).setMinutes(0)).setSeconds(0));
        tillDate = new Date(new Date(new Date(new Date(tillDate).setHours(23)).setMinutes(59)).setSeconds(59)); */
        query.createdAt = {"$gte":fromDate, "$lte":tillDate};
  }

  if(filters && filters != '') {
    filters = filters.toLowerCase();
    conditions['$or'] = [
      {username: filters},
      {email: filters},
      {name: {'$regex': filters, '$options': 'i'}}
    ];

    // query['$or'] = [
    //   {'status': {'$regex': filters, '$options': 'i'}},
    //   {'paymode': {'$regex': filters, '$options': 'i'}},
    //   {'coins': (isNaN(filters) ? 0 : parseInt(filters))},
    //   {'paidamount': (isNaN(filters) ? 0 : parseFloat(filters))}
    // ]

    // if(filters.length === 24) {
    //   query['$or'].push({"_id": filters});
    // }

    UserModel.find(conditions, '-salt -hashedPassword', function(err, users) {
      if(err || !users || (users && users.length == 0)) {
        // return loadPaymentsInfo(query, viewLimit, skipRows, res);
        var message = (req.query.view != '') ? ('No records found for "'+filters+'" with '+req.query.view+' status') : ('No records found for '+filters);
        return res.status(200).json({data: null, limit: viewLimit, rows: 0, error : true, message : message });
      }
      else {
        var _users = [];
        users.forEach(function(ud) {
          _users.push(ud._id+'');
        });

        query['$or'] = [{'userid': {"$in": _users}}];
        return loadPaymentsInfo(query, viewLimit, skipRows, res);
      }
    })
  }
  else {
    return loadPaymentsInfo(query, viewLimit, skipRows, res);
  }
}

/**
* revenuecutof update : expire existing one, create new one
* @function
* @param {json} body
* @access user
* @return {json} { error, data }
*/
exports.reveuecutofupdate = function(req, res) {

  var cutofObj   = req.body;
  var updateDate = new Date();

  ReveueCutof.update({isactive:true}, {isactive: false, expireat: updateDate}).exec(function(err, resp) {
    if(!err) {
      ReveueCutof.create({cutofvalue: cutofObj.cutofvalue, isactive: true}, function(_err, _resp) {
        res.status(200).json({error: _err, data: _resp});
      });
    }
    else {
      res.status(200).json({error: err, data: null});
    }
  });
}

/**
* Get Revenue Cutof
* @function
* @param {number} page
* @access user
* @return {json} { error, data }
*/
exports.getreveuecutof = function(req, res) {
  ReveueCutof.find({isactive: true, expireat: null}, function(err, data) {
    return res.status(200).json({error: err, data: data});
  });
}


/**
* currency rate update : expire existing one, create new one
* @function
* @param {json} body
* @access user
* @return {json} { error, data }
*/
exports.currencyRateUpdate = function(req, res) {
  var rate   = req.body.rate;
  var currency = req.body.currency ? req.body.currency : 'adscash';
  var updateDate = new Date();
  if(rate && currency){
    CurrencyRate.update({currency : currency, isactive:true}, {isactive: false, expireat: updateDate}).exec(function(err, resp) {
      if(!err) {
        CurrencyRate.create({rate: rate, currency : currency, isactive: true}, function(_err, _resp) {
          updateCirculation(_resp, function(cerr){
            res.status(200).json({error: _err, data: _resp});
          });
        });
      }
      else {
        res.status(200).json({error: err, data: null});
      }
    });
  }
  else{
    res.status(500).json({error: 'Missing parameters'});
  }
}

/**
* Get Currency Rate
* @function
* @param {number} page
* @access user
* @return {json} { error, data }
*/
exports.getCurrencyRate = function(req, res) {
  var currency = req.query.currency ? req.query.currency : 'adscash';
  CurrencyRate.findOne({currency : currency, isactive: true, expireat: null}, function(err, data) {

    if(err)
      return res.status(200).json({error: err, data: null});
    else if(!err && data)
      return res.status(200).json({error: err, data: { currency : data.currency, rate : data.rate }});
    else
      return res.status(200).json({error: err, data: data});
  });
}


exports.getAdsCashCurrentRate = function (req, res) {
    var adscashService = new AdscashService();
          adscashService.adsCashLiveRate(function(err, data){
           if(JSON.parse(data.body).error){
             console.log("[Error] Distribution service unable to get currency rate",err);
             callback(false);
           }
           else{
            var adsCashRate = JSON.parse(data.body).data.rate;
            return res.status(200).json({error: false, data: adsCashRate});
         }
     });
}

/**
* Packs Info
* @function
* @param {string} viewas - 7D/1M/24H
* @access user
* @return {json} { coins, packs, acoins, apacks }
*/
exports.totalgetPackInfo = function(req, res) {
  var _query = {id: req.user._id};

  var _Credits = new Credits();
  var defResponse = {coins: 0, packs: 0, acoins: 0, apacks: 0}

  if(req.params.viewas && req.params.viewas != '') {
    var timeFrame = {
      fromDate: new Date(),
      toDate: (new Date()).toISOString()
    };

    switch (req.params.viewas) {
      case '7D':
        timeFrame.fromDate.setTime(timeFrame.fromDate.getTime() - (7*24*60*60*1000));
        timeFrame.fromDate = timeFrame.fromDate.toISOString();
        _query['createdat'] = timeFrame
        break;
      case '1M':
        timeFrame.fromDate.setTime(timeFrame.fromDate.getTime() - (30*24*60*60*1000));
        timeFrame.fromDate = timeFrame.fromDate.toISOString();
        _query['createdat'] = timeFrame;
        break;
      case '24H':
        timeFrame.fromDate.setTime(timeFrame.fromDate.getTime() - (1*24*60*60*1000));
        timeFrame.fromDate = timeFrame.fromDate.toISOString();
        _query['createdat'] = timeFrame;
        break;
      // case 'all':
      //   timeFrame.fromDate.setTime(timeFrame.fromDate.getTime() - (1*24*60*60*1000));
      //   timeFrame.fromDate = timeFrame.fromDate.toISOString();
      //   _query['createdat'] = timeFrame;
      //   break;
    }
  }
  _Credits.getGoldCredits(req.user._id, function(err, data) {
    if(err) { return handleError(res, err); }
    if(!data) { return res.status(200).json(defResponse); }
    _Credits.getGoldPacksTime(req.user._id,_query, function(_err, _data) {
      if(_err) { return handleError(res, err); }
      if(!_data || _data.length == 0) { return res.status(200).json(defResponse); }
      return res.status(200).json({
        coins: (parseInt((_data[0] ? _data[0].qty : 0) * 1000) + data.total),
        packs: (_data[0] ? _data[0].qty : 0),
        apacks: (_data[0] ? _data[0].qty : 0),
        acoins: data.total
      });
    });
  });
}

/**
* Get Silver Pack Info
* @function
* @param {string} viewas - 7D/1M/24H
* @access user
* @return {json} { coins, packs, acoins, apacks }
*/
exports.totalgetsilverPackInfo = function(req, res) {
  var _query = {id: req.user._id};

  var _Credits = new Credits();
  var defResponse = {coins: 0, packs: 0, acoins: 0, apacks: 0}

  if(req.params.viewas && req.params.viewas != '') {
    var timeFrame = {
      fromDate: new Date(),
      toDate: (new Date()).toISOString()
    };

    switch (req.params.viewas) {
      case '7D':
        timeFrame.fromDate.setTime(timeFrame.fromDate.getTime() - (7*24*60*60*1000));
        timeFrame.fromDate = timeFrame.fromDate.toISOString();
        _query['createdat'] = timeFrame
        break;
      case '1M':
        timeFrame.fromDate.setTime(timeFrame.fromDate.getTime() - (30*24*60*60*1000));
        timeFrame.fromDate = timeFrame.fromDate.toISOString();
        _query['createdat'] = timeFrame;
        break;
      case '24H':
        timeFrame.fromDate.setTime(timeFrame.fromDate.getTime() - (1*24*60*60*1000));
        timeFrame.fromDate = timeFrame.fromDate.toISOString();
        _query['createdat'] = timeFrame;
        break;
      // case 'all':
      //   timeFrame.fromDate.setTime(timeFrame.fromDate.getTime() - (1*24*60*60*1000));
      //   timeFrame.fromDate = timeFrame.fromDate.toISOString();
      //   _query['createdat'] = timeFrame;
      //   break;
    }
  }

  _Credits.getSilverCredits(req.user._id, function(err, data) {
    if(err) { return handleError(res, err); }

    // _Credits.getSilverPacksTime(req.user._id, _query, function(_err, _data) {
    //
    //   if(err) { return handleError(res, err); }
    //   if(!data) { return res.status(200).json(defResponse); }

      var creditlogs   = data.creditlogs,
          viewcampaign = data.viewcampaign,
          campaign     = data.campaign;

      var clTotal = (creditlogs[0] ? creditlogs[0].total : 0),
          vcTotal = (viewcampaign[0] ? viewcampaign[0].count : 0),
          cTotal  = (campaign[0] ? campaign[0].credits : 0);

      _Credits.getActiveSilverPacksTime(req.user.id, _query, function(__err, __data) {
        return res.status(200).json({
          coins: clTotal,
          packs: (__data[0] ? __data[0].totalpacks : 0),
          apacks: (__data[0] ? __data[0].activepacks : 0),
          acoins: (clTotal + vcTotal - cTotal)
        });
      });

    // });
  });
}

/**
* Get Paginated list of payments based upon query
* @function
* @param {json} query
* @access user
* @return {json} [ payment ] - 25 per page
*/
exports.purchaseToken = function(req, res) {

  var vs = new ValidateService(UserWithdrawal);
  // var uniqueToken = uuid.v1();
  if(!req.body.reqType || (req.body.reqType != 'payment' && req.body.reqType != 'transfer' && req.body.reqType != 'withdrawal')) {
    return res.status(200).json({error: true, message: 'Invalid Request'});
  }

  vs.getToken(req.user._id+'', req.body.reqType, function(error, _message) {

    if(error) { return res.status(200).json({ error: true, message: _message }); }

    return res.status(200).json({
      reqtoken: _message
    });

  });
}

exports.getPayPalFInfo = function(req, res){
  var query = {gatewaytxnId: {$ne: null}, gateway : 'paypalOffline'};
  var viewLimit   = 25;
  var currentPage = (req.query.page ? req.query.page : 1);
  var skipRows    = (viewLimit * (currentPage - 1));

  if(req.query.fdata) {
    var fdata = req.query.fdata + '';
    query['$or'] = [
      {username: {$regex: fdata, $options: 'i'}},
      {userfullname: {$regex: fdata, $options: 'i'}},
      {email: {$regex: fdata, $options: 'i'}},
      {transactionid: fdata },
      {gatewaytxnId : fdata }
    ];
  }

  if(req.query.status == 'new') {
    query['status'] = 'PENDING';
  }

  if(req.query.status == 'completed') {
    query['status'] = 'COMPLETED';
  }

  if(req.query.status == 'cancelled') {
    query['status'] = 'CANCELLED';
  }
  Usergatewaysinfo.find(query).sort({"_id": -1}).limit(viewLimit).skip(skipRows).exec(function(err, data) {

    if(err) {
      return handleError(res, err);
    }
    Usergatewaysinfo.count(query, function(err, rows) {
      return res.status(200).json({data: data, limit: viewLimit, rows: rows });
    });
  });
}

exports.updatePayPal = function(req, res){

  Usergatewaysinfo.findById(req.body.id+'', function(err, paypal) {
    if(err) {
      return handleError(res, err);
    }

    Payment.findById(paypal.paymentid+'', function(err, payment) {

      paypal.update({
        // swiftid: req.body.swiftid,
        goldpacks: req.body.goldpacks,
        adminbankaccount: req.body.adminbankaccount,
        admincomments: req.body.admincomments,
        status: 'COMPLETED'
      }, function(err, data) {
        console.log('PayPal Update: ', err, data);
      });

      var data = req.body;
      data['ACK'] = 'SUCCESS';

      payment.update({
        status: 'COMPLETED', gatewaysuccess: data, gatewayfailure: {}, active: true,
        quantity: req.body.goldpacks,
        coins: (req.body.goldpacks * 1000)
      }, function(err, data) {

        if(payment.requirecredit === true) {
          var _Credits = new Credits();
          _Credits.updateCredits(payment.userid, {
            silvercoins: 0,
            goldcoins: (req.body.goldpacks * 1000),
            silverquantity: 0,
            goldquantity: req.body.goldpacks,
            dtcredits: 0
          }, function(err, data) {
            console.log('Credits Info: ', err, data);
          });

          _Credits.addCreditTransferLog(payment.userid, {
            amount: (req.body.goldpacks * 1000),
            description: 'Purchase Gold Pack',
            type: 'gold',
            subtype: 'P',
            cointype: 'gold'
          }, function(err, data) {
            console.log('Credit Log Info: ', err, data._id);
          });
        }

        var emailService = new EmailService();
        //emailService.sendBankWireAdminEmails(bankwire, payment, req.body);
        payment.status = 'COMPLETED';
        emailService.sendPurchaseEmail(paypal.email, paypal.userfullname, '', payment);

        return res.status(200).send('Update Successfully');
      });

    });

  });
}

exports.getPayPalInfo = function(req, res){

  var query = {
    transactionid: req.query.token,
    paymentid: req.query.paymentid
  };

  if(req.user.role != 'admin' && req.user.role != 'finance') {
    query['userid'] = req.user._id;
  }

  Usergatewaysinfo.findOne(query, function(err, data) {

    if(err) {
      return handleError(res, err);
    }
    return res.status(200).json({data: data});
  })
}

function loadPaymentsInfo(query, viewLimit, skipRows, res) {
  //query['coins'] = {"$gt": 0};
  query['paidamount'] = {"$gt": 0};
  Payment.find(query).sort({"createdAt": -1}).limit(viewLimit).skip(skipRows).exec(function(err, payment) {
    if(err) {
      return handleError(err, res);
    }

    Payment.count(query, function(err, rows) {

      var users = [];
      payment.forEach(function(usr) {
        users.push(usr.userid+'');
      });

      UserModel.find({"_id": {"$in": users}}, 'name email username', function(_err, data) {

        if(_err) {
          return handleError(_err, res);
        }

        var _data = []
        payment.forEach(function(d) {
          var userInfo = _.find(data, function(o) {
            return (d.userid == o._id+'');
          });

          var uInfo = {
            'username': userInfo && userInfo.name ? userInfo.name : '',
            'useremail': userInfo && userInfo.email ? userInfo.email : '',
            'ciuserid': userInfo && userInfo.username ? userInfo.username : ''
          };

          _data.push(_.extend({}, d.toJSON(), uInfo));
        });
        var message = "";
        if(_data.length <= 0) {
          message = "No records found";
        }
        return res.status(200).json({data: _data, limit: viewLimit, rows: rows , error : false, message : message});

      });

    });
  });
}


/**
* Distribute Silver pack commissions and update active silver packs
* @function
* @param {json} payment
* @param {number} level
* @param {String} productId
* @access user
* @return {none}
*/
function doSilverPackPurchaseDistributionAndAddIntoActiveSilvePacks(payment, level, productId) {
  var dservice = new DistributionService();
  dservice.distributeSilverPackCredits(payment.userid, payment.coins, level, productId);

  var _d = new Date(payment.createdAt);
      _d.setDate(_d.getDate() + 60);

  ActiveSilverPack.create({
    userid: payment.userid,
    packs: payment.quantity,
    isactive: true,
    totalpacks: payment.quantity,
    totalearning: 0,
    calculatedshare: 0,
    cutofshare: 0,
    revenueamount: 0,
    revenuecloseamount: 30,
    expirydate: null
  }, function(__aerr, _asp) {

    console.log('New record is added in ASP: ', __aerr, _asp);
  });
}

/**
* Once a payment is completed, email, update credits, payments etc.
* @function
* @param {number} page
* @access user
* @return {string} error/success
*/
function doNotifyWork(req, params, body, res) {

  var payMode = params.type.split('-');
  var extraPaymentData = { quantity : 0, amount : 0, coins : 0 };
  console.log(params);

  Payment.findOne({'paytoken.TOKEN': params.token+'', paymode: payMode[0]+''}, function(err, payment) {

    if(payMode[0] == 'stp') {
      var status = (body.stp_transact_status || body.status);
      var gatewayData = {
        ACK: status,
        TOKEN: body.tr_id,
        AMOUNT: body.amount,
        MEMBER: body.member,
        ITEMID: body.item_id,
        EMAIL: body.email,
        MEMO: body.memo,
        TIMESTAMP: body.date
      }

      var service = new STPService();
      var isValidInfo = service.isValidReturnedInfo(payment, gatewayData);
    }

    if(payMode[0] == 'advcash') {
      var status = body.ac_transaction_status;

      var gatewayData = {
        ACK: status,
        TOKEN: body.ac_transfer,
        AMOUNT: body.ac_buyer_amount_without_commission,
        EMAIL: body.ac_buyer_email,
        TIMESTAMP: body.ac_start_date,
        ac_buyer_amount_without_commission: body.ac_buyer_amount_without_commission,
        ac_buyer_amount_with_commission: body.ac_buyer_amount_with_commission,
        ac_transfer: body.ac_transfer,
        ac_ps: body.ac_ps,
        ac_buyer_email: body.ac_buyer_email,
        ac_buyer_verified: body.ac_buyer_verified,
        ac_fee: body.ac_fee,
        ac_amount: body.ac_amount,
        ac_src_wallet: body.ac_src_wallet
      }

      if(payment.paidamount < body.ac_amount){
        extraPaymentData.amount = parseFloat(body.ac_amount - payment.paidamount);
        var unitCoins = parseInt(payment.unitcoins/payment.unitprice);
        extraPaymentData.coins = parseInt(extraPaymentData.amount*unitCoins);
        extraPaymentData.quantity = parseFloat(extraPaymentData.coins/1000);
      }
      var service = new ADVCashService();
      var isValidInfo = service.isValidReturnedInfo(body);
    }

    if(payMode[0] == 'payza') {
      var status = ((body.ap_transactionstate == 'Completed' && body.ap_status == 'Success') ? 'COMPLETED' : 'PENDING');
      var gatewayData = {
        ACK: status,
        TOKEN: body.ap_referencenumber,
        AMOUNT: body.ap_netamount,
        EMAIL: body.ap_custemailaddress,
        TIMESTAMP: body.ap_transactiondate,
        ac_buyer_amount_without_commission: body.ap_amount,
        ac_buyer_amount_with_commission: body.ap_totalamount,
        ac_netpayamount: body.ap_netamount
      }

      var isValidInfo = true;
    }

    if(!isValidInfo) {
      status = 'CANCELED';
      gatewayData['CANCEL_REASON'] = 'Received data form gateway founded tempered';
      console.log('Validating Returned Info Failed: ' + payment._id);
    }

    if(status == 'CANCELLED' || status == 'CANCELED') {
      payment.update({status: 'CANCELLED', gatewaysuccess: {}, gatewayfailure: gatewayData, active: false}, function(err, data) {
        console.log('Pay Notify CANCELLED, '+ payment._id);
        // Send Paypal Purachase Silver Coin Email to the customer
        UserModel.findById(payment.userid+'', function(e, u) {
          if(!e && u) {
            var emailService = new EmailService();
            payment.status = 'CANCELLED';
            emailService.sendPurchaseEmail(u.email, u.name, '', payment);
          }
        });
        if(res) {
          return res.status(200).send('Pay Notify CANCELLED, '+ payment._id);
        }
      });
    }
    else if(status == 'PENDING' || status == 'PROCESS') {
      payment.update({status: 'PENDING', gatewaysuccess: gatewayData, gatewayfailure: {}, active: true}, function(err, data) {

        console.log('Pay Notify PENDING, '+ payment._id);
        // Send Paypal Purachase Silver Coin Email to the customer
        UserModel.findById(payment.userid+'', function(e, u) {
          if(!e && u) {
            var emailService = new EmailService();
            payment.status = 'PENDING';
            emailService.sendPurchaseEmail(u.email, u.name, '', payment);
          }
        });
        if(res) {
          return res.status(200).send('Pay Notify PENDING, '+ payment._id);
        }
      });
    }
    else if((status == 'COMPLETE' || status == 'COMPLETED' || status == 'CONFIRMED') && payment.status != 'COMPLETED') {
      payment.update({status: 'COMPLETED', quantity : (payment.quantity+extraPaymentData.quantity), paidamount : (payment.paidamount+extraPaymentData.amount), coins : (payment.coins+extraPaymentData.coins), extrapayment:extraPaymentData, gatewaysuccess: gatewayData, gatewayfailure: {}, active: true}, function(err, data) {

        var productService = new ProductService();
        productService.getPurchaseProductType(payment.productid, function(productTypeInfo) {

          if(payment.requirecredit === true) {
            var _Credits = new Credits();
            _Credits.updateCredits(payment.userid, {
              silvercoins: (productTypeInfo.silverCoins ? (payment.coins) : 0),
              goldcoins: (productTypeInfo.goldCoins ? (payment.coins+extraPaymentData.coins) : 0),
              silverquantity: (productTypeInfo.silverCoins ? (payment.quantity) : 0),
              goldquantity: (productTypeInfo.goldCoins ? (payment.quantity+extraPaymentData.quantity) : 0),
              dtcredits: (productTypeInfo.dtCredits ? (payment.coins+extraPaymentData.coins) : 0)
            }, function(err, _data) {
              console.log('Credits Info: ', err, _data);
            });

            _Credits.addCreditTransferLog(payment.userid, {
              amount: (payment.coins+extraPaymentData.coins),
              description: 'Purchase Gold Pack',
              type: 'gold',
              subtype: 'P',
              cointype: 'gold'
            }, function(err, _data) {
              console.log('Credit Log Info: ', err, _data._id);
            });
          }

          console.log('Pay Notify COMPLETE');
          // Send Paypal Purachase Silver Coin Email to the customer
          UserModel.findById(payment.userid+'', function(e, u) {
            if(!e && u) {
              var emailService = new EmailService();
              payment.status = 'COMPLETED';
              emailService.sendPurchaseEmail(u.email, u.name, '', payment);
            }
          });
          if(res) {
            return res.status(200).send('Pay Notify COMPLETE');
          }
        });
      });
    }
    else {
      console.log('Pay Notify: Status All Ready ' + status);
      if(res) {
        return res.status(200).send('Pay Notify: Status All Ready ' + status);
      }
    }
  });
}


exports.getCIGoldCoins = function(req, res) {
  console.log("CI gold coins working");
     co(function* () {
      var payService = new PayService();
      let body = yield payService.getCIGoldCoins(req.user._id);
      return res.status(200).json(body);
    }).catch(function (err) {
        console.log("Error from ci:"+err);
        return res.status(200).json({ error : true, message : 'Something went wrong' });
    });
};

exports.payNotifyBlockio = function(req, res){
  console.log('Blockio payment response :');
  console.log(req.body, req.body.data);
  if(req.body && req.body.notification_id && req.body.data.amount_received > 0){
    co(function*(){
      let payment = yield Payment.findOne({'gatewaydata.notification_id' : req.body.notification_id, status : {"$in": ['PENDING', 'PROCESSING'] }}).populate( { path : "userid", select : "commission", model : "User" } ).exec();
      if(!payment){
          return res.json({error : true, message : 'Payment details not found.'});
      }
      else{
        let currencyrt = '';
        if(payment.productid == 'adscash'){
          currencyrt = yield CurrencyRate.findOne({currency : 'adscash', isactive: true, expireat: null});
        }
        let blockIOService;
        if (payment.paymode == 'litecoinBlockIO') {
            blockIOService = new BlockIOLtcService();
        } else {
            blockIOService = new BlockIOService();
        }
        if(req.body.data && req.body.data.address){
          blockIOService.verifyPayment(req.body.data.address, function(err, data){
            if(err || !data){
              return res.json({error : true, message : 'Something went wrong please contact support team.'})
            }
            // else if(data.available_balance < payment.gatewaydata.amount){
            //   return res.json({error : true, message : 'Payment details are tempered, please do full payment and try again.'})
            // }
            else if(data.available_balance > 0) {
              let blockchainFee = (payment.paymode == 'litecoinBlockIO') ? config.ltcBlockIO.blockchainFee: config.blockIO.blockchainFee;
              let fee = ((data.available_balance/(100+blockchainFee))*blockchainFee);
              let usdamtpaid = parseFloat(payment.gatewaydata.btnrt*parseFloat(data.available_balance -fee));
              // if(payment.productid == 'adscash'){
              //   if(!currencyrt){
              //     console.log("[Error] CurrencyRate not defind.");
              //     return res.json({error : true, message : 'CurrencyRate not defind.'});
              //   }

              //   if(data.available_balance < payment.gatewaydata.amount){
              //     console.log("Partial payment done for ",data, payment);
              //     return res.json({error : true, message : 'Partial payment done.'});
              //   }
              //   else{
              //     let adcrt = (payment.unitprice/payment.unitcoins);
              //     let coinbybtc = Math.round((usdamtpaid/adcrt) * 10)/10;
              //     let coinbygc = Math.round(((payment.gcused*0.025)/adcrt)*10)/10;
              //     let coins = (coinbybtc+coinbygc);
              //     let payService = new PayService();
              //     payService.updatePaymentInfo({
              //       params : { id : payment._id },
              //       body: {
              //        status:'COMPLETED',
              //        coins : coins,
              //        paidamount : usdamtpaid,
              //        gatewaysuccess : req.body
              //       }
              //     }, function(__err, pdata){
              //       blockIOService.deleteNotification(req.body.notification_id, function(err, data){
              //         console.log("Blockio notification delete:"+req.body.notification_id, err, data);
              //         return res.json({error : false, message : 'Payment received.'});
              //       });
              //     });
              //   }
              // }
              // else if (payment.productid == 'usd') {
                let businessCommission = { amount : 0, type : 'usd', percent : 0 };
                let amount = Math.round(usdamtpaid * 10)/10;
                if (payment.is_business_payment) {
                  let commissionsAmount = ((amount * payment.userid.commission)/100);
                  businessCommission =  { amount : commissionsAmount, type : 'usd', percent : payment.userid.commission };
                }

                let payService = new PayService();
                payService.updatePaymentInfo({
                  params : { id : payment._id },
                  body: {
                   paidamount : Math.round(usdamtpaid * 10)/10,
                   status:'COMPLETED',
                   gatewaysuccess : req.body,
                   commission : businessCommission
                  }
                }, function(__err, pdata){
                  blockIOService.deleteNotification(req.body.notification_id, function(err, data){
                    console.log("Blockio notification delete:"+req.body.notification_id, err, data);
                      return res.json({error : false, message : 'Payment received.'});
                  });
                });
              // }
            } else if (data.pending_received_balance > 0) {
              payment.update({status : 'PROCESSING'}, function(puerr){
                console.log("Payment status update to processing",puerr);
                return res.json({error : true, message : "Payment is still under process."})
              });
            } else{
              return res.json({error : true, message : "Payment is not transferred yet."})
            }
          });
        }
        else{
          return res.json({error : true, message : "Wallet address not found."})
        }
      }
    }).catch(function(err){
        console.log("[Erorr] Blockio payment notify error:"+err);
        return res.json({error : true, message : 'Something went wrong, please contact support team.'});
    });
  }
  else{
    return res.json({error : true, message : 'Invalid infromation.'});
  }
};

exports.testBlockIO = function(req, res){
  var blockIOService = new BlockIOService();
  var token = 'TST-'+uuid.v1();
      // blockIOService.createTxPayment(token, 100, function(err, data){
      //   console.log(err, data);
      // });

      blockIOService.verifyPayment('2NFFV1yC6sLV5fPQhyH61zQSvGVGsE1W2nt', function(err, data){
        console.log(err, data);
        return res.json({message : 'True'});
      });



};

// Export Purchase List As Excel
exports.exportPurchase = function(req, res) {
  var filters = req.query.filters,
      conditions = {},
      purchaseData = {},
      query = {},
      viewLimit = 0,
      skipRows = 0;

  if(undefined != req.query.view && null != req.query.view && '' != req.query.view) {
    query = {'status' : req.query.view};
  }

  var tillDate = req.query.tillDate;
  var fromDate = req.query.fromDate;
  if(tillDate && fromDate){
        fromDate = new Date(new Date(new Date(new Date(fromDate).setHours(0)).setMinutes(0)).setSeconds(0));
        tillDate = new Date(new Date(new Date(new Date(tillDate).setHours(23)).setMinutes(59)).setSeconds(59));
        query.createdAt = {"$gte":fromDate, "$lte":tillDate};
  }

  if(filters && filters != '') {
    filters = filters.toLowerCase();
    conditions['$or'] = [
      {username: filters},
      {email: filters},
      {name: {'$regex': filters, '$options': 'i'}}
    ];

    UserModel.find(conditions, '-salt -hashedPassword', function(err, users) {
      if(err || !users || (users && users.length == 0)) {
        var message = (req.query.view != '') ? ('No records found for "'+filters+'" with '+req.query.view+' status') : ('No records found for '+filters);
        return res.status(200).json({error : true, message : message });
      }
      else {
        var _users = [];
        users.forEach(function(ud) {
          _users.push(ud._id+'');
        });

        query['$or'] = [{'userid': {"$in": _users}}];
        loadPaymentsInfoForExport(query, viewLimit, skipRows, function(err, data){
          if(err) {
            return res.status(200).json({error : true, message : err});
          }
          if(null != data && undefined != data && !data.error) {
            sendXlsFileAsOutput(data.data, function(err,filename){
              if(err){
                return res.status(200).json({success : false, file: null});
              }
              if(undefined != filename && '' != filename){
                return res.status(200).json({success : true, file : filename});
              }
            });
          }
        });
      }
    })
  }
  else {
    loadPaymentsInfoForExport(query, viewLimit, skipRows, function(err, data){
      if(err) {
        return res.status(200).json({error : true, message : err});
      }
      if(null != data && undefined != data && !data.error) {
        sendXlsFileAsOutput(data.data, function(err,filename){
          if(err){
            return res.status(200).json({success : false, file: null});
          }
          if(undefined != filename && '' != filename){
            return res.status(200).json({success : true, file : filename});
          }
        });
      }
    });
  }
}

exports.totalCirculation = function(req, res) {
  co(function *() {
    let role = req.user.role,
        // totalAdsCashCoins = 0,
        totalUSD = 0,
        // totalCIGoldCoins = 0,
        // pendingAdsCashCoins = 0,
        pendingUSDDollars = 0,
        // pendingCIGoldCoins = 0,
        // cancelledAdsCashCoins = 0,
        cancelledUSDDollars = 0,
        // cancelledCIGoldCoins = 0;
        totalCommitment = 0,
        totalWithdrawls = 0;

    // let calculatedAdsCash = [],
    //     pendingAdsCash = [],
    //     cancelledAdsCash = [],
    //     calculatedCIGoldCoins = [],
    //     pendingCI = [],
    //     cancelledCI = [],
    let calculatedUSD = [],
        pendingUSD = [],
        cancelledUSD = [],
        calculatedCommitments = [],
        calculatedWithdrawls = [];

    // if(req.body.startDate && req.body.endDate) {
    //   calculatedAdsCash = yield Payment.aggregate([{'$match' : { "createdAt": {"$gte": (new Date(req.body.startDate)), "$lt": (new Date(req.body.endDate))}, productid : 'adscash', status : 'COMPLETED'}}, {'$group' : {_id: null, totalAdsCashCoins: {'$sum' : "$coins"}}}]).exec();

    //   var signUpBonusAdsCash = yield CreditLogs.aggregate([{'$match' : { cointype : "PROMOTION-SIGNUP", createdat: {"$gte": (new Date(req.body.startDate)), "$lt": (new Date(req.body.endDate))} }}, {'$group' : {_id : "$cointype", totalAdsCashCoinsBonus : {$sum : "$coins" }}}]).exec();

    //   pendingAdsCash = yield Payment.aggregate([{'$match' : { "createdAt": {"$gte": (new Date(req.body.startDate)), "$lt": (new Date(req.body.endDate))}, productid : 'adscash', status : 'PENDING'}}, {'$group' : {_id: null, pendingAdsCashCoins: {'$sum' : "$coins"}}}]).exec();

    //   cancelledAdsCash = yield Payment.aggregate([{'$match' : { "createdAt": {"$gte": (new Date(req.body.startDate)), "$lt": (new Date(req.body.endDate))}, productid : 'adscash', status : 'CANCELLED'}}, {'$group' : {_id: null, cancelledAdsCashCoins: {'$sum' : "$coins"}}}]).exec();
    // } else {
    //   calculatedAdsCash = yield Payment.aggregate([{'$match' : { productid : 'adscash', status : 'COMPLETED'}}, {'$group' : {_id: null, totalAdsCashCoins: {'$sum' : "$coins"}}}]).exec();

    //   var signUpBonusAdsCash = yield CreditLogs.aggregate([{'$match' : { cointype : "PROMOTION-SIGNUP" }}, {'$group' : {_id : "$cointype", totalAdsCashCoinsBonus : {$sum : "$coins" }}}]).exec();

    //   pendingAdsCash = yield Payment.aggregate([{'$match' : { productid : 'adscash', status : 'PENDING'}}, {'$group' : {_id: null, pendingAdsCashCoins: {'$sum' : "$coins"}}}]).exec();

    //   cancelledAdsCash = yield Payment.aggregate([{'$match' : { productid : 'adscash', status : 'CANCELLED'}}, {'$group' : {_id: null, cancelledAdsCashCoins: {'$sum' : "$coins"}}}]).exec();
    // }

    // if(calculatedAdsCash.length && signUpBonusAdsCash.length) {
    //   totalAdsCashCoins = calculatedAdsCash[0].totalAdsCashCoins+(signUpBonusAdsCash.length ? signUpBonusAdsCash[0].totalAdsCashCoinsBonus : 0);
    // }
    // if(pendingAdsCash.length) {
    //   pendingAdsCashCoins = pendingAdsCash[0].pendingAdsCashCoins;
    // }
    // if(cancelledAdsCash.length) {
    //   cancelledAdsCashCoins = cancelledAdsCash[0].cancelledAdsCashCoins;
    // }
    if(role === 'admin'){
      if(req.body.startDate && req.body.endDate) {
        // calculatedCIGoldCoins = yield Payment.aggregate([{'$match' : { "createdAt": {"$gte": (new Date(req.body.startDate)), "$lt": (new Date(req.body.endDate))}, productid : 'adscash', status : 'COMPLETED'}}, {'$group' : {_id: null, totalCIGoldCoins: {'$sum' : "$gcused"}}}]).exec();

        // pendingCI = yield Payment.aggregate([{'$match' : { "createdAt": {"$gte": (new Date(req.body.startDate)), "$lt": (new Date(req.body.endDate))}, productid : 'adscash', status : 'PENDING'}}, {'$group' : {_id: null, pendingCIGoldCoins: {'$sum' : "$gcused"}}}]).exec();

        // cancelledCI = yield Payment.aggregate([{'$match' : { "createdAt": {"$gte": (new Date(req.body.startDate)), "$lt": (new Date(req.body.endDate))}, productid : 'adscash', status : 'CANCELLED'}}, {'$group' : {_id: null, cancelledCIGoldCoins: {'$sum' : "$gcused"}}}]).exec();

        calculatedUSD = yield Payment.aggregate([{'$match' : { "createdAt": {"$gte": (new Date(req.body.startDate)), "$lt": (new Date(req.body.endDate))}, productid : 'usd', status : 'COMPLETED'}}, {'$group' : {_id : null, totalUSD : {'$sum': "$paidamount"}}}]).exec();

        var signUpBonusUSD = yield CreditLogs.aggregate([{'$match' : { coins : config.signupBonus.usd, description: config.signupBonus.description, createdat: {"$gte": (new Date(req.body.startDate)), "$lt": (new Date(req.body.endDate))} }}, {'$group' : {_id : "$cointype", totalUSDCoinsBonus : {$sum : "$coins" }}}]).exec();

        pendingUSD = yield Payment.aggregate([{'$match' : { "createdAt": {"$gte": (new Date(req.body.startDate)), "$lt": (new Date(req.body.endDate))}, productid : 'usd', status : 'PENDING'}}, {'$group' : {_id : null, pendingUSDDollars : {'$sum': "$paidamount"}}}]).exec();

        cancelledUSD = yield Payment.aggregate([{'$match' : { "createdAt": {"$gte": (new Date(req.body.startDate)), "$lt": (new Date(req.body.endDate))}, productid : 'usd', status : 'CANCELLED'}}, {'$group' : {_id : null, cancelledUSDDollars : {'$sum': "$paidamount"}}}]).exec();

        calculatedCommitments = yield Commitments.aggregate([{'$match' : { "createdat": {"$gte": (new Date(req.body.startDate)), "$lt": (new Date(req.body.endDate))}, status : 'COMMITTED'}}, {'$group' : {_id : null, totalCommitment : {'$sum': "$amount"}}}]).exec();

        calculatedWithdrawls = yield Commitments.aggregate([{'$match' : { "createdat": {"$gte": (new Date(req.body.startDate)), "$lt": (new Date(req.body.endDate))}, status : 'WITHDRAWN'}}, {'$group' : {_id : null, totalWithdrawls : {'$sum': "$amount"}}}]).exec();
      } else {
        // calculatedCIGoldCoins = yield Payment.aggregate([{'$match' : { productid : 'adscash', status : 'COMPLETED'}}, {'$group' : {_id: null, totalCIGoldCoins: {'$sum' : "$gcused"}}}]).exec();

        // pendingCI = yield Payment.aggregate([{'$match' : { productid : 'adscash', status : 'PENDING'}}, {'$group' : {_id: null, pendingCIGoldCoins: {'$sum' : "$gcused"}}}]).exec();

        // cancelledCI = yield Payment.aggregate([{'$match' : { productid : 'adscash', status : 'CANCELLED'}}, {'$group' : {_id: null, cancelledCIGoldCoins: {'$sum' : "$gcused"}}}]).exec();

        calculatedUSD = yield Payment.aggregate([{'$match' : { productid : 'usd', status : 'COMPLETED'}}, {'$group' : {_id : null, totalUSD : {'$sum': "$paidamount"}}}]).exec();

        var signUpBonusUSD = yield CreditLogs.aggregate([{'$match' : { coins : config.signupBonus.usd, description: config.signupBonus.description }}, {'$group' : {_id : "$cointype", totalUSDCoinsBonus : {$sum : "$coins" }}}]).exec();

        pendingUSD = yield Payment.aggregate([{'$match' : { productid : 'usd', status : 'PENDING'}}, {'$group' : {_id : null, pendingUSDDollars : {'$sum': "$paidamount"}}}]).exec();

        cancelledUSD = yield Payment.aggregate([{'$match' : { productid : 'usd', status : 'CANCELLED'}}, {'$group' : {_id : null, cancelledUSDDollars : {'$sum': "$paidamount"}}}]).exec();

        calculatedCommitments = yield Commitments.aggregate([{'$match' : { status : 'COMMITTED'}}, {'$group' : {_id : null, totalCommitment : {'$sum': "$amount"}}}]).exec();

        calculatedWithdrawls = yield Commitments.aggregate([{'$match' : { status : 'WITHDRAWN'}}, {'$group' : {_id : null, totalWithdrawls : {'$sum': "$amount"}}}]).exec();
      }

      // if(calculatedCIGoldCoins.length) {
      //   totalCIGoldCoins = calculatedCIGoldCoins[0].totalCIGoldCoins;
      // }
      // if(pendingCI.length) {
      //   pendingCIGoldCoins = pendingCI[0].pendingCIGoldCoins;
      // }
      // if(cancelledCI.length) {
      //   cancelledCIGoldCoins = cancelledCI[0].cancelledCIGoldCoins;
      // }

      if(calculatedUSD.length && signUpBonusUSD.length) {
        totalUSD = calculatedUSD[0].totalUSD+(signUpBonusUSD.length ? signUpBonusUSD[0].totalUSDCoinsBonus : 0);
      }
      if(pendingUSD.length) {
        pendingUSDDollars = pendingUSD[0].pendingUSDDollars;
      }
      if(cancelledUSD.length) {
        cancelledUSDDollars = cancelledUSD[0].cancelledUSDDollars;
      }
      if(calculatedCommitments.length){
        totalCommitment = calculatedCommitments[0].totalCommitment;
      }
      if(calculatedWithdrawls.length){
        totalWithdrawls = calculatedWithdrawls[0].totalWithdrawls
      }

      // return res.status(200).json({error : false, Tadscash : totalAdsCashCoins, Tcigoldcoin : totalCIGoldCoins, Tusd : totalUSD, Padscash : pendingAdsCashCoins, Pcigoldcoin : pendingCIGoldCoins, Pusd : pendingUSDDollars, Cadscash : cancelledAdsCashCoins, Ccigoldcoin : cancelledCIGoldCoins, Cusd : cancelledUSDDollars});
      return res.status(200).json({error : false, Tusd : totalUSD, Pusd : pendingUSDDollars, Cusd : cancelledUSDDollars, commitments:totalCommitment, withdrawls:totalWithdrawls });

    // } else if(role === 'user') {
    //   return res.status(200).json({error : false, adscash : totalAdsCashCoins, Padscash : pendingAdsCashCoins, Cadscash : cancelledAdsCashCoins});
    } else {
      return res.status(200).json({error : true, adscash : totalAdsCashCoins, Padscash : pendingAdsCashCoins, Cadscash : cancelledAdsCashCoins, message : 'Unable to update status'});
    }
  }).catch(function(err){
    console.log("Error:",err);
    return res.json({error : true, message : 'Something went wrong, please contact support team.'});
  });
}

exports.nextAppreciation = function(req, res) {
  co(function*() {
    let currencyrt = yield CurrencyRate.findOne({currency : 'adscash', isactive: true, expireat: null});
    if(!currencyrt) {
      return res.status(200).json({error : true, message: 'Unable to get adscash rates'});
    }

  }).catch(function(err) {
    console.log("Error:",err);
    return res.json({error : true, message : 'Something went wrong, please contact support team.'});
  })
}

function sendXlsFileAsOutput(data, cb) {
  // format data according to requirements
  var exportData = [];
  data.forEach(function(d) {
    var date = new Date(d.createdAt),
        paymode = '',
        token = '',
        gatewayStatus = '';
    if(d.paymode === "ic") {
      paymode = "Gold Coins";
    } else if(d.paymode === "bitcoinBlockIO") {
      paymode = "Bitcoin";
    } else {
      paymode = d.paymode;
    }
    if(d.paytoken && d.status !== "PENDING") {
      token = (undefined != d.paytoken.TOKEN) ? d.paytoken.TOKEN : '';
      gatewayStatus = (undefined != d.paytoken.ACK) ? d.paytoken.ACK : '';
    }
    exportData.push({
      "Date (Server date)" : date,
      "Transaction ID" : d._id,
      "Username": d.username,
      "User Email": d.useremail,
      "Status": d.status,
      "Coins/Amount": d.paidamount,
      "Through": paymode,
      "Amount (USD)": d.paidamount,
      "Token" : token,
      "Gateway Status" : gatewayStatus
    });
  });
  var xls = json2xls(exportData);
  var filename = uuid.v1() + '.xlsx';
  var fd = fs.openSync( filename, 'w');
  fs.writeFile( filename, xls, 'binary');
  return cb(null, filename);
}

function loadPaymentsInfoForExport(query, viewLimit, skipRows, callback) {
  var responseData = {};
  query['paidamount'] = {"$gt": 0};
  Payment.find(query).sort({"createdAt": -1}).limit(viewLimit).skip(skipRows).exec(function(err, payment) {
    if(err) {
      //return {error : true, message : err};
      callback(err, null)
    }
    Payment.count(query, function(err, rows) {

      var users = [];
      payment.forEach(function(usr) {
        users.push(usr.userid+'');
      });

      UserModel.find({"_id": {"$in": users}}, 'name email username', function(_err, data) {

        if(_err) {
          //return {error : true, message : _err};
          callback(_err, null);
        }

        var _data = []
        payment.forEach(function(d) {
          var userInfo = _.find(data, function(o) {
            return (d.userid == o._id+'');
          });

          var uInfo = {
            'username': userInfo && userInfo.name ? userInfo.name : '',
            'useremail': userInfo && userInfo.email ? userInfo.email : '',
            'ciuserid': userInfo && userInfo.username ? userInfo.username : ''
          };

          _data.push(_.extend({}, d.toJSON(), uInfo));
        });
        var message = "";
        if(_data.length <= 0) {
          message = "No records found";
        }
        callback(null, {
          data : _data,
          error : false,
          message : message
        });
      });
    });
  });
}

exports.currentCirculation = function(req, res){
  Circulation.findOne({active : true}, function(err, circulation){
    if(err || !circulation){
      return res.json({error : true, data : null});
    }
    else{
      return res.json({error : false, data : {circulation : circulation.totaladscashcirculation, current_price : circulation.cp, next_price : circulation.np }});
    }
  });
};

/**
* Handle error, send 500
* @function
* @access user
*/
function handleError(res, err) {
  console.log("Payment ReturnSuccess Erorr: " + err.message);
  return res.status(500).send(err);
}

function getOtp() {
  var min = 100000, max = 999999;
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function isBusinessUser(user){
  return (config.businessRoles.indexOf(user.role) >= 0) ? true : false;
}

function updateCirculation(currencyrt, callback){
  Payment.aggregate([{'$match': { productid: 'adscash', status: 'COMPLETED' } }, {'$group': { _id: null, coins: { '$sum': "$coins" }}}]).exec(function(perr, pdata){
    CreditLogs.aggregate([{'$match': {type: 'adscash',cointype: 'PROMOTION-SIGNUP'}}, {       '$group': {_id: null, coins: { '$sum': "$coins" } }}]).exec(function(clerr, cldata){
      var purchasedAdscash = ((pdata && pdata[0] && pdata[0].coins) ? parseInt(pdata[0].coins) : 0);
      var bonusAdscash = ((cldata && cldata[0] && cldata[0].coins) ? parseInt(cldata[0].coins) : 0);
      var currentCirculation = parseInt(purchasedAdscash+bonusAdscash);
      let nextappreciation = parseInt(currentCirculation + ((config.apiConstants.TOTAL_SUPPLY*config.apiConstants.APPRECIATION_PERCENTAGE)/100));

      Circulation.findOneAndUpdate({active: true }, { active: false, updatedat: new Date() }, function(err, circulation) {
        console.log("Update current circulation:",err, circulation);
        Circulation.create({
            lastappreciation: currentCirculation,
            totaladscashcirculation: currentCirculation,
            nextappreciation: nextappreciation,
            active: true,
            cp: parseFloat(currencyrt.rate).toFixed(3),
            np: parseFloat(currencyrt.rate + config.apiConstants.APPRECIATION_RATE_INCREMENT).toFixed(3)
        }, function(ncerr, nc) {
          console.log("Added new current circulation",ncerr, nc);
          callback(ncerr);
        });
      });
    });
  });
};
