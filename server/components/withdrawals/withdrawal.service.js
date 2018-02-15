'use strict';

var _            = require('lodash');
var request = require('request');
var Withdrawal   = require('./../../api/withdrawal/withdrawal.model');
var UserModel    = require('./../../api/user/user.model');
var CreditLogs   = require('./../../api/credits/credit-logs.model');
var EmailService = require('./../../components/emails/email.service');
var config   = require('./../../config/environment');


module.exports = function() {

  var handleError = function(res, err) {
    if(res && res.status) {
      return res.status(500).send(err);
    }
    else if(res && !res.status) {
      return res(err, null);
    }
    else {
      console.log('Error Found: ', err);
      return false;
    }
  }

  var handle404 = function(res) {
    if(res && res.status) {
      return res.status(404).send('Not Found');
    }
    else if(res && !res.status) {
      return res(true, 'Not Found');
    }
    else {
      console.log('Data Not Found');
      return false;
    }
  }

  var sendData = function(res, withdrawal) {
    if(res && res.status) {
      return res.status(200).json(withdrawal)
    }
    else if(res && !res.status) {
      return res(null, withdrawal);
    }
    else {
      console.log('Response As Info');
      return withdrawal;
    }
  }

  return {

    updateWithdrawalInfo: function (req, comment, res) {

      // Query to get Withdrawal's information
      Withdrawal.findById(req.params.id, function (err, withdrawal) {

        if (err) { return handleError(res, err); }

        if(!withdrawal) { return handle404(res); }

        var _data   = req.body;
            _data['updatedat'] = new Date();

        var updated = _.merge(withdrawal, _data);

        // Update Withdrawal's information
        updated.save(function (err) {

          if (err) { return handleError(res, err); }

          // Query to get user's Creditlogs information
          CreditLogs.findById(updated.creditlogid+'', function(_err, cl) {

            if(!_err && cl) {

              // Update creditlog's information
              cl.update({
                description: 'Withdrawal Request ('+req.body.status+')',
                comment: comment,
                updatedat: (new Date())
              }, function(e) {

                UserModel.findById(withdrawal.userid, function(_e, ur) {

                  // var paidAccountInfo = '';
                  // if(!_e && ur) {
                  //   //paidAccountInfo = ((withdrawal.transferthrough.toLowerCase() == 'advcash') ? ur.advcash : ur.bitcoin);
                  //   var paymode = withdrawal.transferthrough.toLowerCase();
                  //   switch (paymode) {
                  //     case 'advcash':
                  //       paidAccountInfo = ur.advcash;
                  //       break;
                  //     case 'bitcoin':
                  //       paidAccountInfo = ur.bitcoin;
                  //       break;
                  //     case 'payza':
                  //       paidAccountInfo = ur.payza;
                  //       break;
                  //   }
                  // }

                  // var emailService = new EmailService();
                  // if(req.body.status == 'COMPLETED') {
                  //   emailService.sendWithdrawalSuccess(withdrawal.useremail, withdrawal.userfullname, withdrawal.requestcoins, withdrawal.transferthrough, {internal: withdrawal.creditlogid, reqAddress: paidAccountInfo}, withdrawal.userid,withdrawal.requestamount);
                  // }
                  // else if(req.body.status == 'PROCESSING') {
                  //   emailService.sendWithdrawalProcessing(withdrawal.useremail, withdrawal.userfullname, withdrawal.requestcoins, withdrawal.transferthrough, {internal: withdrawal.creditlogid, reqAddress: paidAccountInfo}, withdrawal.userid,withdrawal.requestamount);
                  // }
                  console.log('Update Withdrawal as Processing status: ', e);
                });

                return sendData(res, withdrawal);
              });
            }
          })
        });
      });
    },

    autoProcessADSWithdrawal : function(req, _winfo, callback){
      Withdrawal.findOne({_id : _winfo._id}, function(err, winfo){
        var options = {
            url: config.adscashWithdrawal.transactionURL,
            form: {
              senderAddress : config.adscashWithdrawal.account,
              passphrase : config.adscashWithdrawal.secret,
              recipientAddress : winfo.creditaccount,
              transferAmount : winfo.withdrawamount,
              token: 'ADS'
            }
        };
        request.post(options, function(err, httpResp, resp){
          let body = JSON.parse(resp);
          console.log("Withdrawal request process :", body);
          if(body && body.success && body.data && body.data.length > 0) {
            var updated = _.merge(winfo, {
              status: 'COMPLETED',
              admincommentcomplete: "ADS withdrawal completed",
              transactionid : body.data[0].transactionHash,
              gatewaysuccess : body,
              updatedat: (new Date())
            });
            updated.save(function (err) {
              if (err) {
                console.log("Unable to update withdrawal info:",err);
                 return callback(true, null);
               }
                  /*update credit log status */
                  CreditLogs.findById(updated.creditlogid+'', function(_err, cl) {
                    if(!_err && cl) {
                      cl.update({description: 'Withdrawal Request (COMPLETED)', updatedat: (new Date())}, function(e) {
                        console.log('Update Withdrawal as Processing status: ', e);
                      });
                      /* Send email to user */
                      var emailService = new EmailService();
                      emailService.sendADSWithdrawalSuccess(winfo.useremail, winfo.username, winfo.requestedadscash, winfo, winfo.userid );
                    }
                    return callback(false, {txhash : body.data[0].transactionHash });
                  });
            });
          }
          else
          {
              console.log("[Error] Unable to transfer amount in user address.", body);
              var updated = _.merge(winfo, {
                gatewayfailure : body
              });
              updated.save(function (err) {
                console.log("[Error]Updated gatewayfailure", body);
                /* Send email to admin about error */
                var emailService = new EmailService();
                  emailService.adsWithdrawalAutoProcessAlertToAdmin(config.adscashWithdrawal.alertemail, body.data[0].message);
                return callback(true, null);
              });
          }
        });
      });
    }

  };

};
