'use strict';

var _ = require('lodash');
var request = require('request');
var Withdrawal        = require('./withdrawal.model');
var UserModel         = require('./../user/user.model');
var CreditService     = require('./../../components/credits/credits.service');
var CreditLogs        = require('./../credits/credit-logs.model');
var config            = require('./../../config/environment');
var EmailService      = require('../../components/emails/email.service');
var WithdrawalService = require('./../../components/withdrawals/withdrawal.service');
var uuid              = require('uuid');
var moment            = require('moment');
var UserWithdrawal    = require('./../payment/transfer-user.model');
var ValidateService   = require('./../../components/transactions/validate.service');
var KycComponents     = require('./../usermeta/utils.component.js');
var BlockIOService    = require('./../../components/payments/block.io.service');
var WithdrawalLogs    = require('./withdrawallogs.model');
var OtpGeneration = require('./../payment/otp-generation.model');

// Get list of withdrawals
exports.index = function(req, res) {

  var query = {};

  var viewLimit   = 25;
  var currentPage = (req.query.page ? req.query.page : 1);
  var skipRows    = (viewLimit * (currentPage - 1));

  if(req.query.fdata) {
    var fdata = req.query.fdata + '';
    query['$or'] = [
      {username: fdata},
      {userid: fdata},
      {userfullname: {$regex: fdata, $options: 'i'}},
      {useremail: fdata}, {creditlogid: fdata},
      {transferthrough : {$regex: fdata, $options: 'i'}}
    ];
  }

  if(!req.query.status) {
    query['status'] = 'PENDING';
  }

  if(req.query.status == 'pending') {
    query['status']  = 'PENDING';
  }

  if(req.query.status == 'returned') {
    query['status']  = 'RETURNED';
  }

  if(req.query.status == 'completed') {
    query['status'] = 'COMPLETED';
  }

  if(req.query.status == 'cancelled') {
    query['status'] = 'CANCELLED';
  }
  query['withdrawaltype'] = req.query.wtype == 'adscash' ? 'adscash' : 'usd';
  var tillDate = req.query.tillDate;
  var fromDate = req.query.fromDate;
  if(tillDate && fromDate){
        /*fromDate = new Date(new Date(new Date(new Date(fromDate).setHours(0)).setMinutes(0)).setSeconds(0));
        tillDate = new Date(new Date(new Date(new Date(tillDate).setHours(23)).setMinutes(59)).setSeconds(59));*/
        query.createdat = {"$gte":fromDate, "$lte":tillDate};
  }

  Withdrawal.find(query).sort({"_id": -1}).limit(viewLimit).skip(skipRows).exec(function(err, data) {

    if(err) {
      return res.status(200).json({error : true, message : err});
    }

    Withdrawal.count(query, function(err, rows) {

      return res.status(200).json({data: data, limit: viewLimit, rows: rows , error: false, message : rows+' results fetched'});
    });
  });
};

// Get a single withdrawal
exports.show = function(req, res) {
  Withdrawal.findOne({
    "_id": req.params.id+'',
    userid: req.user._id+''
  }, function (err, withdrawal) {
    if(err) { return res.status(200).json({error: true, message: err}); }
    if(!withdrawal) { return res.status(200).json({error: true, message : 'Record not found'}); }
    return res.json(withdrawal);
  });
};

// Get a single withdrawal by creditlogid
exports.showByTransactionId = function(req, res) {
  Withdrawal.findOne({
    creditlogid: req.body.wdid+'',
    userid: req.user._id+''
  }, '-_id -admincommentaccept -__v -active -creditlogid -feedetails -useremail -userfullname -userid', function (err, withdrawal) {
    if(err) { return handleError(res, err); }
    if(!withdrawal) { return res.status(404).send('Not Found'); }
    return res.json(withdrawal);
  });
};

// Creates a new withdrawal in the DB.
exports.create = function(req, res) {
  var _Credits = new CreditService(),
      blockIOService = new BlockIOService(),
      ts = new ValidateService(UserWithdrawal),
      adminFee = 0,
      withdrawInfo = {
        feedetails : "0 % on Requested Amount",
        feeamount : 0,
        transferthrough : req.body.withdrawaltype == 'usd' ? 'bitcoin' : 'ethtoken',
        status : 'PENDING',
        creditaccount : req.body.address,
        requestedusd :  req.body.withdrawaltype == 'usd' ? parseFloat(req.body.amount) : 0,
        requestedadscash : req.body.withdrawaltype == 'adscash' ? parseFloat(req.body.amount) : 0,
        creditlogid : '',
        expireAt : null
      },
      usdAmount = parseFloat(req.body.amount),
      token = req.body.reqToken,
      userid = req.user._id,
      withdrawalid = req.body.withdrawalid,
      otp = req.body.otp;


  if(!req.body.otp || req.body.otp.trim() == '') {
    return res.status(200).json({error: true, message: 'Invalid request. Please provide OTP', otpError : true});
  }

  if(!req.body.reqToken || req.body.reqToken.trim() == '') {
    return res.status(200).json({error: true, message: 'Invalid request, Required information is missing.', otpError : false});
  }

  if(!withdrawalid) {
    return res.status(200).json({error : true, message : 'Could not create withdrawal request', otpError : false});
  }

  if(usdAmount <= 0 || isNaN(usdAmount)) {
    return res.status(200).json({error : true, message : 'Unable to process withdrawal request', otpError : false});
  }

  if(req.body.withdrawaltype === 'usd' && usdAmount < config.apiConstants.MIN_WITHDRAWAL_LIMIT && usdAmount > config.apiConstants.MAX_WITHDRAWAL_LIMIT) {
    return res.status(200).json({error : true, message : 'Withdrawal amount must be within the range '+config.apiConstants.MIN_WITHDRAWAL_LIMIT+' USD and '+config.apiConstants.MAX_WITHDRAWAL_LIMIT+' USD', otpError : false});
  }

  if(req.body.withdrawaltype =='adscash' &&  usdAmount < config.apiConstants.MIN_ADC_WITHDRAWAL_LIMIT && usdAmount > config.apiConstants.MAX_ADC_WITHDRAWAL_LIMIT) {
    return res.status(200).json({error : true, message : 'Withdrawal amount must be within the range '+config.apiConstants.MIN_ADC_WITHDRAWAL_LIMIT+' Adscash and '+config.apiConstants.MAX_ADC_WITHDRAWAL_LIMIT+' Adscash', otpError : false});
  }

  if(req.body.otp) {
    OtpGeneration.findOne({'userid': userid, 'type' :'withdraw', 'isactive' : true }).sort({createdat: -1}).exec(function(err, otpData) {
      if(err || !otpData) {
        console.log('[Error] Otp verify fail:', err, otpData);
        return res.status(200).json({error: true, message: 'Unable to verify otp!', otpError : true});
      } else {
        console.log(req.body.otp, otpData.otp);
        if(otp != otpData.otp) {
          return res.status(200).json({error: true, message: 'Please enter the correct OTP.', otpError : true});
        } else {
          otpData.update({isactive : false}, function(err){
              console.log("Otp isactive updated to false", otpData);
          });
          _Credits.getCredits(userid, function(err, data) {
            if(err || !data || undefined == data || null == data){
              console.log("[Err] Error in getting user credits ", err);
              return res.status(200).json({error : true, message : 'Unable to process as user balance could not be validated', otpError : false});
            }
            ts.isValidTransaction(userid+'', 'withdrawal', token, function(error, _message) {
              if(error) {
                console.log(error, _message);
                return res.status(200).json({error: true, message : 'Invalid Request', otpError : false});
              }

              Withdrawal.findOne({
                _id : withdrawalid,
                userid: userid + '',
                withdrawaltype : req.body.withdrawaltype,
                status: 'INITIATED'
              }, function(_e, _winfo) {
                if(_e) {
                  console.log("[Err] Error in getting withdrawal data");
                  return res.status(200).json({error : true, message : _e, otpError : false});
                }
                if(!_winfo) {
                  return res.status(200).json({error : true, message : 'Could not create withdrawal request.', otpError : false});
                }
                if(_winfo && _winfo.withdrawaltype == 'usd') {
                  if(data.usd < usdAmount) {
                    return res.status(200).json({error: true, message : 'You do not have enough USD wallet balance to process this request', otpError : false});
                  }
                    withdrawInfo.feedetails = config.apiConstants.WITHDRAWAL_ADMIN_FEE + "% On Requested Amount";
                    var eightyPercent = (((100 - config.apiConstants.REPURCHASE_PERCENT) * usdAmount) / 100);
                    withdrawInfo.feeamount = (config.apiConstants.WITHDRAWAL_ADMIN_FEE * eightyPercent) / 100;
                    _Credits.updateCredits(userid, {
                      adscash: 0,
                      usd: (parseFloat(_winfo.requestedusd) * -1),
                      adcpacks : 0
                    }, function(cerr, credits) {
                      if(cerr) {
                        return res.status(200).json({error : true, message: cerr, otpError : false});
                      }
                      if(credits) {
                        _Credits.addCreditTransferLog(userid, {
                          amount: (parseFloat(_winfo.requestedusd) * -1),
                          description: 'USD Withdrawal Request ('+withdrawInfo.status+')',
                          type: 'usd',
                          subtype: 'W',
                          cointype: 'usd'
                        }, function(clerr, creditLog) {
                          if(clerr) {
                            console.log("[Err] Error in updating credit logs", clerr);
                            return res.status(200).json({error: true, message: clerr, otpError : false});
                          }
                          withdrawInfo.creditlogid = creditLog._id;
                          _winfo.update(withdrawInfo, function(_err, _withdraw) {
                            if(_err) {
                              console.log("[Err] Error in creating withdrawal logs", _err);
                              return res.status(200).json({error: true, message : _err});
                            }
                            else{
                              WithdrawalLogs.create({
                                userid : userid,
                                withdrawalid : withdrawalid,
                                feedetails : withdrawInfo.feedetails,
                                feeamount : withdrawInfo.feeamount
                              }, function(wlerr, _withdrawLog) {
                                if(wlerr) {
                                  console.log("[Err] Error in updating admin withdrawal logs", wlerr);
                                  return res.status(200).json({error : false, message : 'Withdrawal Request Processed Successfully', otpError : false});
                                }
                                return res.status(200).json({error : false, message : 'Withdrawal Request Processed Successfully', otpError : false});
                              });
                            }
                          });
                        })
                      }
                    })
                  }
                else if (_winfo && _winfo.withdrawaltype == 'adscash') {
                    if(data.adscash < usdAmount) {
                      return res.status(200).json({error: true, message : 'You do not have enough ADSCASH wallet balance to process this request', otpError : false});
                    }
                    else{
                      withdrawInfo.feedetails = config.apiConstants.WITHDRAWAL_ADMIN_FEE + "% On Requested Amount";
                      withdrawInfo.feeamount = (config.apiConstants.WITHDRAWAL_ADMIN_FEE * usdAmount) / 100;
                      _Credits.updateCredits(userid, {
                        adscash: (parseFloat(_winfo.requestedadscash) * -1),
                        usd: 0,
                        adcpacks : 0
                      }, function(cerr, credits) {
                        if(cerr) {
                          return res.status(200).json({error : true, message: cerr, otpError : false});
                        }
                        if(credits) {
                          _Credits.addCreditTransferLog(userid, {
                            amount: (parseFloat(_winfo.requestedadscash) * -1),
                            description: 'Adscash Withdrawal Request ('+withdrawInfo.status+')',
                            type: 'adscash',
                            subtype: 'W',
                            cointype: 'adscash'
                          }, function(clerr, creditLog) {
                            if(clerr) {
                              console.log("[Err] Error in creating credit logs", clerr);
                              return res.status(200).json({error: true, message: clerr, otpError : false});
                            }
                            withdrawInfo.creditlogid = creditLog._id;
                            _winfo.update(withdrawInfo, function(_err, _withdraw) {
                              if(_err) {
                                console.log("[Err] Error in creating withdrawal logs", _err);
                                return res.status(200).json({error: true, message : _err});
                              }
                              else{
                                WithdrawalLogs.create({
                                  userid : userid,
                                  withdrawalid : withdrawalid,
                                  feedetails : withdrawInfo.feedetails,
                                  feeamount : withdrawInfo.feeamount
                                }, function(wlerr, _withdrawLog) {
                                  if(wlerr) {
                                    console.log("[Err] Error in updating admin withdrawal logs", wlerr);
                                    //return res.status(200).json({error : false, message : 'Withdrawal Request Processed Successfully', otpError : false});
                                  }
                                  var withdrawals = new WithdrawalService();
                                  withdrawals.autoProcessADSWithdrawal(req, _winfo, function(err, data){
                                    if(err)
                                      return res.status(200).json({error : true, message : 'Unable to process your request, kindly contact support.', otpError : false});
                                    else
                                      return res.status(200).json({error : false, message : 'Your TX has been broadcast to network. It is waiting to be mined and confirmed. During ICOs, It may take 4+ hours to confirm. Your TX hash is '+data.txhash, otpError : false});
                                  });
                                });
                              }
                            });
                          })
                        }
                      });
                    }
                }
              });
            });
          });
        }
      }
    })
  } else {
    return res.status(200).json({error: true, message: 'Invalid request. Please provide OTP', otpError : true});
  }
}

// cancels a withdrawal request
exports.cancelWithdrawal = function(req, res) {
  if(!req.params.id || !req.query.admincommentcancel) {
    return res.status(200).json({error: true, message : 'Please provide appropriate inputs'});
  }
  var withdrawalId = req.params.id,
      adminComment = req.query.admincommentcancel;

  Withdrawal.findById(withdrawalId, function(err, withdrawal){
    if(err) {
      return res.status(200).json({error: true, message : "Withdrawal details not found"});
    }
    withdrawal.update({admincommentcancel : adminComment, status : 'CANCELLED'}, function(_e, wcancel) {
      if(_e){
        return res.status(200).json({error: true, message : _e});
      }
      else{
        CreditLogs.findOneAndUpdate({_id : withdrawal.creditlogid }, {$set : { description: 'Withdrawal Request (CANCELLED)', comment: adminComment, updatedat: (new Date()) }}, function(clerr, cl){
          console.log("Cancel withdrawal log updated :",clerr, cl);
          return res.status(200).json({error: false, message: 'Withdrawal request cancelled successfully'});
        });
      }
    })
  })
}

exports.cancelUSDWithdrawal = function(req, res) {
  if(!req.body.wdid) {
    return res.status(200).json({error: true, message : 'Cannot cancel the withdrawal request'});
  }
  var withdrawalId = req.body.wdid;
  Withdrawal.findOne({_id: withdrawalId, status: 'INITIATED', userid: req.user._id + ''}, function(err, wd) {
    if(err) {
      return res.status(200).json({error: true, message : 'Cannot cancel the withdrawal request'});
    }
    if(wd) {
      wd.remove(function(_e, result) {
        if(_e) {
          return res.status(200).json({error: true, message : 'Cannot cancel the withdrawal request'});
        }
        return res.status(200).json({error: false, message : 'Withdrawal request cancelled'});
      })
    } else {
      return res.status(200).json({error: true, message : 'Withdrawal request not found.'});
    }
  })
}

exports.returnWithdrawal = function(req, res) {
  if(!req.body.id || !req.body.admincommentreturn) {
    return res.status(200).json({error: true, message : 'Please provide appropriate inputs'});
  }
  var withdrawalId = req.body.id,
      adminComment = req.body.admincommentreturn;

  Withdrawal.findById(withdrawalId, function(err, withdrawal){
    if(err) {
      return res.status(200).json({error: true, message : "Withdrawal details not found"});
    }
    withdrawal.update({admincommentreturn : adminComment, status : 'RETURNED'}, function(_e, wreturn) {
      if(_e){
        return res.status(200).json({error: true, message : _e});
      }
      CreditLogs.findById(withdrawal.creditlogid, function(clerr, cl) {
        if(clerr || !cl) {
          return res.status(200).json({error: true, message : clerr});
        }
        if(cl) {
          /* update cl status */
          cl.update({description: 'Withdrawal Request (RETURNED)', comment: adminComment, updatedat: (new Date())}, function(e) {
            console.log('Return Withdrawal status update: ', e);
          });
          var _Credits = new CreditService();
          if(withdrawal.withdrawaltype == 'usd'){
          _Credits.updateCredits(withdrawal.userid, {
            adscash : withdrawal.adscashcoins,    // returning adscash coins
            usd : withdrawal.withdrawamount,      // returning 78 % usd amount
            adcpacks : 0
          }, function(cerr, credits) {
            if(cerr) {
              return res.status(200).json({error: true, message : cerr});
            }
            // adding log for returned  USD amount
            _Credits.addCreditTransferLog(withdrawal.userid, {
              amount: withdrawal.withdrawamount,
              description: 'USD Withdrawal Request (Revert Amount)',
              type: 'usd',
              subtype: 'W',
              cointype: 'usd'
            }, function(clerr, creditlog) {
              if(clerr) {
                return res.status(200).json({error: true, message : clerr});
              }
              // adding log for returned adscash coins
              // _Credits.addCreditTransferLog(withdrawal.userid, {
              //   amount: (withdrawal.adscashcoins * 1),
              //   description: config.apiConstants.REPURCHASE_PERCENT+'% repurchase against withdrawal.(#'+withdrawal._id+')',
              //   type: 'adscash',
              //   subtype: 'W',
              //   cointype: 'usd'
              // }, function(cl_err, credit_log) {
              //   if(cl_err) {
              //     return res.status(200).json({error: true, message : cl_err});
              //   }
                return res.status(200).json({error: false, message: 'Withdrawal request returned successfully'});
              // });
            });
          })
        }
        else if (withdrawal.withdrawaltype == 'adscash') {
          _Credits.updateCredits(withdrawal.userid, {
              adscash : withdrawal.requestedadscash,    // returning adscash coins
              usd : 0,
              adcpacks : 0
            }, function(cerr, credits) {
              if(cerr) {
                return res.status(200).json({error: true, message : cerr});
              }
              // adding log for returned  USD amount
              _Credits.addCreditTransferLog(withdrawal.userid, {
                amount: withdrawal.requestedadscash,
                description: 'Adscash Withdrawal Request (Revert Amount)',
                type: 'adscash',
                subtype: 'P',
                cointype: 'adscash'
              }, function(clerr, creditlog) {
                if(clerr) {
                  return res.status(200).json({error: true, message : clerr});
                }
                return res.status(200).json({error: false, message: 'Withdrawal request returned successfully'});
              });
            });
        }
        }
      })
    })
  })
}



// Updates an existing withdrawal in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  if(req.body.status == "COMPLETED"){
    var comment = req.body.admincommentcomplete;
  }else{
    var comment = req.body.admincommentaccept;
  }

  var withdrawals = new WithdrawalService();
  return withdrawals.updateWithdrawalInfo(req, comment, res);
};

// Deletes a withdrawal from the DB.
exports.destroy = function(req, res) {
  var cancelComment = req.query.admincommentcancel;
  Withdrawal.findById(req.params.id, function (err, withdrawal) {
    if(err) { return handleError(res, err); }
    if(!withdrawal) { return res.status(404).send('Not Found'); }
    withdrawal.update({status: 'CANCELLED', active: false, admincommentcancel: cancelComment, admincommentaccept: null, admincommentcomplete: null, updatedat: (new Date())}, function(err) {
      if(err) { return handleError(res, err); }

      CreditLogs.findById(withdrawal.creditlogid+'', function(_err, cl) {

        if(!_err && cl) {
          cl.update({description: 'Withdrawal Request (CANCELLED)', comment: cancelComment, updatedat: (new Date())}, function(e) {
            console.log('Update Withdrawal as Processing status: ', e);
          });

          var _cl = new CreditService();
          _cl.updateCredits(withdrawal.userid+'', {
            silvercoins: 0,
            goldcoins: (withdrawal.requestcoins * 1),
            silverquantity: 0,
            goldquantity: 0,
            dtcredits: 0
          }, function(err, data) {
            console.log('Withdrawal request cancelled credit Info: ', err, data);
          });

          _cl.addCreditTransferLog(withdrawal.userid+'', {
            amount: (withdrawal.requestcoins * 1),
            description: 'Withdrawal Request (Revert Coins)',
            type: 'gold',
            subtype: 'P',
            cointype: 'gold'
          }, function(clerr, cl) {

            console.log('New Entry created to Revert Withdrawal', clerr, cl);
            var emailService = new EmailService();
            emailService.sendWithdrawalCancelEmail(withdrawal.useremail, withdrawal.userfullname, withdrawal.requestcoins, withdrawal.transferthrough, {internal: withdrawal.creditlogid}, withdrawal.userid, withdrawal.requestamount);
            return res.status(204).send('No Content');
          });
        }
        else {

          return res.status(404).json({message: 'Error Raised: Withdrawal Cancel', error: _err});
        }
      });
    });
  });
};

exports.adminFee = function(req, res) {

  var vs = new ValidateService(UserWithdrawal);
  var fee = Config.advcashWSDLInfo.adminFee;
  if(req.body.type == 'payza') {
    fee = Config.payzaAPIInfo.adminFee;
  }

  vs.getToken(req.user._id+'', 'withdrawal', function(error, _message) {

    if(error) { return res.status(200).json({ error: true, message: _message }); }

    return res.status(200).json({
      fee: (fee / 100),
      reqtoken: _message
    });

  });
};


exports.doInstantTransfer = function(req, res) {
  var time24Hour = new Date();
      time24Hour.setDate(time24Hour.getDate() - 1);
      Withdrawal.findById(req.body.wd+'', function(err, wd) {
      if(err || !wd) {
        return handleError(res, err);
      }
      if(wd.withdrawaltype == 'usd' &&  (parseFloat(wd.requestedusd) > parseFloat(config.apiConstants.MAX_WITHDRAWAL_LIMIT) || parseFloat(wd.requestamount) < parseFloat(config.apiConstants.MIN_WITHDRAWAL_LIMIT  ))) {
        return res.status(200).json({error: true, message: 'Request limit out of range. Must be within '+MIN_WITHDRAWAL_LIMIT+' USD and '+MAX_WITHDRAWAL_LIMIT+' USD'});
      }
      if(wd.withdrawaltype == 'adscash' && (parseFloat(wd.requestamount) > parseFloat(config.apiConstants.MAX_ADC_WITHDRAWAL_LIMIT) || parseFloat(wd.requestamount) < parseFloat(config.apiConstants.MIN_ADC_WITHDRAWAL_LIMIT))) {
       return res.status(200).json({error: true, message: 'Request limit out of range. Must be within '+MIN_ADC_WITHDRAWAL_LIMIT+' Adscash and '+MAX_ADC_WITHDRAWAL_LIMIT+' Adscash'});
      }

      UserModel.findById(wd.userid+'', function(uerr, user) {
            if(uerr || !user) {
              return handleError(res, uerr);
            }
            Withdrawal.findOne({
              "$or": [{createdat: {$gte: time24Hour}}, {updatedat: {$gte: time24Hour}}],
              userid: wd.userid+'',
              status: {"$in": ['COMPLETED']}
            }, function(werr, winfo) {

              if(!werr && !winfo) {
                if(config.payouts.indexOf(wd.transferthrough) >= 0 && wd.transferthrough == 'bitcoin') {
                  var apiSecret  = req.body.apiSecret;
                  if(!apiSecret){
                    return res.status(200).json({error: true, message : 'API Secret must be provided'});
                  }
                  var blockIOService   = new BlockIOService();
                    blockIOService.transferAmount(wd.btcamount, wd.creditaccount, apiSecret, function(err, data){
                      if(err){
                          console.log("[Error] Unable to transfer amount in user address.", err, data);
                        var updated = _.merge(wd, {
                          gatewayfailure : data
                        });
                        updated.save(function (err) {
                          console.log("[Error]Updated gatewayfailure", err, data);
                          return res.json({error : true, message : 'Something went wrong, please contact tech team.'});
                        });
                      }
                      else{
                          console.log('Success....', err, data);
                          var updated = _.merge(wd, {
                            status: 'COMPLETED',
                            admincommentcomplete: req.body.admincommentcomplete,
                            transactionid : data.txid,
                            gatewaysuccess : data,
                            updatedat: (new Date())
                          });
                          updated.save(function (err) {
                            if (err) { return handleError(res, err); }

                                /*update credit log status */
                                CreditLogs.findById(updated.creditlogid+'', function(_err, cl) {
                                  if(!_err && cl) {
                                    cl.update({description: 'Withdrawal Request (COMPLETED)', updatedat: (new Date())}, function(e) {
                                      console.log('Update Withdrawal as Processing status: ', e);
                                    })
                                    var _Credits = new CreditService();
                                    _Credits.updateCredits(wd.userid, {
                                      adscash: wd.adscashcoins,
                                      usd: 0,
                                      adcpacks : 0
                                    }, function(cerr, credits) {
                                      if(cerr) {
                                        return res.status(200).json({error : true, message: cerr});
                                      }
                                      if(credits) {
                                        _Credits.addCreditTransferLog(wd.userid, {
                                          amount: (wd.adscashcoins * 1),
                                          description: config.apiConstants.REPURCHASE_PERCENT+'% repurchase against withdrawal.(#'+wd._id+')',
                                          type: 'adscash',
                                          subtype: 'P',
                                          cointype: 'usd'
                                        }, function(clerr, creditLog) {
                                          if(clerr) {
                                            console.log("[Err] Error in updating credit logs", clerr);
                                            return res.status(200).json({error: true, message: clerr});
                                          }
                                        });
                                      }
                                    })
                                  }
                                  return res.status(200).json(updated);
                                });
                          });
                      }
                    });
                }
                else if(config.payouts.indexOf(wd.transferthrough) >= 0 && wd.transferthrough == 'ethtoken') {
                  var options = {
                      url: config.adscashWithdrawal.transactionURL,
                      form: {
                        senderAddress : config.adscashWithdrawal.account,
                        passphrase : config.adscashWithdrawal.secret,
                        recipientAddress : wd.creditaccount,
                        transferAmount : wd.withdrawamount,
                        token : config.adscashWithdrawal.token
                      }
                  };
                  request.post(options, function(err, httpResp, resp){
                    let body = JSON.parse(resp);
                    console.log("Withdrawal request process :", body);
                    if(body && body.success && body.data && body.data.length > 0) {
                      var updated = _.merge(wd, {
                        status: 'COMPLETED',
                        admincommentcomplete: req.body.admincommentcomplete,
                        transactionid : body.data[0].transactionHash,
                        gatewaysuccess : body,
                        updatedat: (new Date())
                      });
                      updated.save(function (err) {
                        if (err) { return handleError(res, err); }
                            /*update credit log status */
                            CreditLogs.findById(updated.creditlogid+'', function(_err, cl) {
                              if(!_err && cl) {
                                cl.update({description: 'Withdrawal Request (COMPLETED)', updatedat: (new Date())}, function(e) {
                                  console.log('Update Withdrawal as Processing status: ', e);
                                });
                              }
                              var emailService = new EmailService();
                              emailService.sendADSWithdrawalSuccess(wd.useremail, wd.username, wd.requestedadscash, wd, wd.userid );
                              return res.status(200).json(updated);
                            });
                      });
                    }
                    else
                    {
                        console.log("[Error] Unable to transfer amount in user address.", body);
                        var updated = _.merge(wd, {
                          gatewayfailure : body
                        });
                        updated.save(function (err) {
                          console.log("[Error]Updated gatewayfailure", body);
                          return res.json({error : true, message : 'Error: '+body.data[0].message });
                        });
                    }
                  });
                }
                else {
                  return res.status(200).json({error: true, message: 'Withdrawals through '+JSON.stringify(config.payouts).toUpperCase()+' are Allowed.'});
                }
              }
              else {
                return res.status(200).json({error: true, message: 'Second request in 24 hours time frame.'});
              }
            });
          });
    });
};

exports.withdrawalStpNotify = function(req, res) {

  var notifyInfo = req.body || req.params || req.query;

  if(notifyInfo) {

    Withdrawal.findById(notifyInfo.udf2+'', function(err, wd) {

      if(err) { return handleError(res, err); }
      if(!wd) {
        console.log('[err] Invalid Notify Request', notifyInfo);
        return res.status(200).send('[err] Invalid Withdrawal Notify Request');
      }

      CreditLogs.findById(wd.creditlogid+'', function(_err, _cl) {

        if(_err) { return handleError(res, _err); }
        if(!_cl) {
          console.log('[err] Invalid Notify Request (Creditlog Entry Not Found)', notifyInfo);
          return res.status(200).send('[err] Invalid Withdrawal Notify Request (Creditlog Entry Not Found)');
        }

        var emailService  = new EmailService();
        var status        = notifyInfo.status.toUpperCase();
        if(notifyInfo.status == 'ACCEPTED' || notifyInfo.status == 'COMPLETED') {
          status = 'COMPLETED';
        }

        _cl.update({description: 'Withdrawal Request ('+status+')', updatedat: (new Date())}, function(ucle, ucl) {
          console.log('[info] Update: Withdrawal Request', ucle, ucl);
        });

        wd.update({
          status: status+'',
          admincommentcomplete: 'STP_TRANSACTION_ID:' + (notifyInfo.tr_id || ' No Info Found'),
          updatedat: (new Date())
        }, function(wde, wdp) {
          console.log('[info] Withdrawal '+status+' with STP');
          if(notifyInfo.status == 'ACCEPTED' || notifyInfo.status == 'COMPLETED') {
            emailService.sendWithdrawalSuccess(wd.useremail, wd.userfullname, wd.requestamount, wd.transferthrough, {internal: wd.creditlogid}, wd.userid, wd.requestcoins)
          }
          else {
            emailService.sendWithdrawalProcessing(wd.useremail, wd.userfullname, wd.requestcoins, wd.transferthrough, {internal: wd.creditlogid}, wd.userid, wd.requestamount);
          }
          res.status(200).send('[info] Withdrawal '+status+' with STP');
        });

      });
    });
  }
  else {
    return res.status(200).send('[err] Notihing found to update withdrawal request >>> ');
  }
};

exports.withdrawalStpNotify = function(req, res) {

  var notifyInfo = req.body || req.params || req.query;

  if(notifyInfo) {

    Withdrawal.findById(notifyInfo.udf2+'', function(err, wd) {

      if(err) { return handleError(err, res); }
      if(!wd) {
        console.log('[err] Invalid Notify Request', notifyInfo);
        return res.status(200).send('[err] Invalid Withdrawal Notify Request');
      }

      CreditLogs.findById(wd.creditlogid+'', function(_err, _cl) {

        if(_err) { return handleError(_err, res); }
        if(!_cl) {
          console.log('[err] Invalid Notify Request (Creditlog Entry Not Found)', notifyInfo);
          return res.status(200).send('[err] Invalid Withdrawal Notify Request (Creditlog Entry Not Found)');
        }

        var emailService  = new EmailService();
        var status        = notifyInfo.status.toUpperCase();
        if(notifyInfo.status == 'ACCEPTED' || notifyInfo.status == 'COMPLETED') {
          status = 'COMPLETED';
        }

        _cl.update({description: 'Withdrawal Request ('+status+')', updatedat: (new Date())}, function(ucle, ucl) {
          console.log('[info] Update: Withdrawal Request', ucel, ucl);
        });

        wd.update({
          status: status+'',
          admincommentcomplete: 'STP_TRANSACTION_ID:' + (notifyInfo.tr_id || ' No Info Found')
        }, function(wde, wdp) {
          console.log('[info] Withdrawal '+status+' with STP');
          if(notifyInfo.status == 'ACCEPTED' || notifyInfo.status == 'COMPLETED') {
            emailService.sendWithdrawalSuccess(wd.useremail, wd.userfullname, wd.requestamount, wd.transferthrough, {internal: wd.creditlogid}, wd.userid, wd.requestcoins)
          }
          else {
            emailService.sendWithdrawalProcessing(wd.useremail, wd.userfullname, wd.requestcoins, wd.transferthrough, {internal: wd.creditlogid}, wd.userid, wd.requestamount);
          }
          res.status(200).send('[info] Withdrawal '+status+' with STP');
        });

      });
    });
  }
  else {
    return res.status(200).send('[err] Notihing found to update withdrawal request >>> ');
  }
};

function savePayoutInfo(req, info, status, res) {
  var emailService  = new EmailService();
  var creditService = new CreditService();

  /* remove coins from credits */
  creditService.updateCredits(req.user._id, {
    silvercoins: 0,
    goldcoins: (req.body.amount * -1),
    silverquantity: 0,
    goldquantity: 0,
    dtcredits: 0
  }, function(err, data) {
    console.log('Withdrawal request Debit Info: ', err, data);
  });

  creditService.addCreditTransferLog(req.user._id, {
    amount: (req.body.amount * -1),
    description: 'Withdrawal Request ('+status+')',
    type: 'gold',
    subtype: 'E',
    cointype: 'gold'
  }, function(err, cl) {

    if(err) {return handleError(res, err);}
    if(cl) {

      info.creditlogid = cl._id;
      Withdrawal.create(info, function(_err, withdrawal) {
        if(_err) {
          cl.remove(function(e, d) {
            console.log('Withdrawal error: Remove Credit Log: ', _err, info, withdrawal, e, d);
          });
          return handleError(res, err);
        }

        UserModel.findById(req.user._id+'', function(_e, _u) {

          if(_e) { console.log('Unable to update user profile for Withdrawal Info'); }

          if(_u) {
            if(req.body.method == 'bitcoin' && req.body.bitcoininfo && req.body.bitcoininfo.trim() != '' && (!_u.bitcoin || (_u.bitcoin && _u.bitcoin.trim() == ''))) {
              _u.update({bitcoinedit: false, bitcoin: req.body.bitcoininfo}, function(eu, uu) {
                console.log('[info] User profile updated by Withdrawal BitCoin Info: ', eu, uu);
              });
            }

            if(req.body.method == 'advcash' && req.body.advcashinfo && req.body.advcashinfo.trim() != '' && (!_u.advcash || (_u.advcash && _u.advcash.trim() == ''))) {
              _u.update({advcashedit: false, advcash: req.body.advcashinfo}, function(eu, uu) {
                console.log('[info] User profile updated by Withdrawal AdvCash Info: ', eu, uu);
              });
            }

            if(req.body.method == 'payza' && req.body.payzainfo && req.body.payzainfo.trim() != '' && (!_u.payza || (_u.payza && _u.payza.trim() == ''))) {
              _u.update({payzaedit: false, payza: req.body.payzainfo}, function(eu, uu) {
                console.log('[info] User profile updated by Withdrawal Payza Info: ', eu, uu);
              });
            }

            if(req.body.method == 'stp' && req.body.stpinfo && req.body.stpinfo && req.body.stpinfo.trim() != '' && (!_u.stp || (_u.stp && _u.stp.trim() == ''))) {
              _u.update({stpedit: false, stp: req.body.stpinfo}, function(eu, uu) {
                console.log('[info] User profile updated by Withdrawal STP Info: ', eu, uu);
              });
            }
          }

          if(status == 'COMPLETED' || status == 'ACCEPTED') {
            var ginfo = info.admincommentcomplete.split(':');
                ginfo = (ginfo.length > 1 ? ginfo[1] : '');

            // emailService.sendWithdrawalSuccess(Config.email.withdrawalEmailTo1, req.user.username + ' (' + req.user.name + ')', info.requestamount, req.body.method, {
            //   service: ginfo,
            //   internal: info.creditlogid
            // });
            emailService.sendWithdrawalSuccess(req.user.email, req.user.name, info.requestamount, req.body.method, {
              service: ginfo,
              internal: info.creditlogid,
              reqAddress: ((req.body.method == 'advcash') ? req.body.advcashinfo : ((req.body.method == 'stp') ? req.body.stpinfo : (req.body.method == 'payza') ? req.body.payzainfo : req.body.bitcoininfo))
            }, req.user._id,info.requestcoins);
          }
          else if(status == 'PENDING') {
            // emailService.sendWithdrawalPending(Config.email.withdrawalEmailTo1, req.user.username + ' (' + req.user.name + ')', info.requestamount, req.body.method, {
            //   service: '',
            //   internal: info.creditlogid
            // });
            emailService.sendWithdrawalPending(req.user.email, req.user.name, info.requestamount, req.body.method, {
              service: '',
              internal: info.creditlogid,
              reqAddress: ((req.body.method == 'advcash') ? req.body.advcashinfo : ((req.body.method == 'stp') ? req.body.stpinfo : (req.body.method == 'payza') ? req.body.payzainfo : req.body.bitcoininfo))
            }, req.user._id,info.requestcoins);
          }

          return res.status(201).json(withdrawal);
        });
      });
    }
  });
}

function isGatewayInfoPresent (method, user, data) {

  var response = false;
  switch (method) {
    case 'stp':
      response = !(!user.stp && (!data.stpinfo || (data.stpinfo && data.stpinfo.trim() == '')));
      break;
    case 'advcash':
      response = !(!user.advcash && (!data.advcashinfo || (data.advcashinfo && data.advcashinfo.trim() == '')));
      break;
    case 'payza':
      response = !(!user.payza && (!data.payzainfo || (data.payzainfo && data.payzainfo.trim() == '')));
      break;
    case 'bitcoin':
      response = !(!user.bitcoin && (!data.bitcoininfo || (data.bitcoininfo && data.bitcoininfo.trim() == '')));
      break;
  }

  return response;
}

function handleError(res, err) {
  return res.status(500).send(err);
}
