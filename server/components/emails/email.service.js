'use strict';

var config            = require('../../config/environment');
var mandrill          = require('mandrill-api/mandrill');
var Users             = require('../../api/user/user.model');
var TeamCommunication = require('../../api/team-communication/team-communication.model');
var Messages          = require('../../api/team-communication/message.model');

var transporter = new mandrill.Mandrill(config.email.apiKey);

module.exports = function() {
  var defaultOriginUrl = config.email.defaultOriginUrl;

    return {

    sendEmail: function(sendTo, sendBy, subject, message, fileObj, _callback) {
      var mailOptions = {
        from_email: config.email.mailFrom, // sender address
        from_name: config.email.fromName,
        to: [{
          email: sendTo,
          name: '',
          type: 'to'
        }], // list of receivers
        "headers": {
          "Reply-To": 'no-reply@icoin.com'
        },
        "tags": [
          "email-verify"
        ],
        subject: subject, // Subject line
        text: message,
        html: message,
        "attachments" : [],
        "bcc_address": ""
      };

      if(null != fileObj && undefined != fileObj) {
        if(fileObj.filename && fileObj.filecontent) {
          mailOptions.attachments.push({
            "type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "name": fileObj.filename,
            "content": fileObj.filecontent
          });
          mailOptions.bcc_address = 'chandra.prakash@geminisolutions.in';
        }
      }

      transporter.messages.send({
        "message": mailOptions,
        "async": false,
        "ip_pool": 'Main Pool'
      }, function(result) {
        _callback(null, result);
      }, function(mandrillError) {
        _callback(mandrillError, null);
      });
    },

    sendAccountVerifyEmail: function(originUrl, uverify, _user, res) {
      var _self       = this;
      var subject     = 'Confirm Your ICoinMarket Account';
      var _verifyLink = (originUrl || defaultOriginUrl) + '/verify/email/' + uverify._id;
          _verifyLink = _verifyLink.replace('undefined', defaultOriginUrl);
      var message = '<div style="max-width: 600px; color: #f90; border-radius:10px; text-align: center; min-height: 300; font-family: arial; text-align: center; margin: auto; padding: 20px; overflow: hidden; box-shadow: 2px 2px 2px 2px #f2f2f2; border:1px solid #ccc;"> <img src="' + config.emailDomain + '/assets/images/91063c67.icmlogo.png" width=200> <br/> <br/> <br/> <div style="text-align:left;color:black"> <h4>Hi! ' + _user.name + ',</h4> <p>Please verify your email address by clicking on below link.</p><p> <a href="' + _verifyLink + '">Click here</a> to verify your email address with iCoinMarket </p><p>If above link is not working, please copy and paste "' + _verifyLink + '" at your browser\'s address bar.</p><p>Thank you, for registration with us.</p>Thanks And Regards, <br/> <strong>Team iCoinMarket</strong> </p></div><p style="color: #f90;"> In case you are seeing this email by mistake, <br/>Please get the support informed! <br/> <hr/>Drop an email at <b>support@icoinmarket.com </b> for instant replies. <br/> </p><hr/> <table align="center" style="margin: 0 auto;padding-top:10px"> <tr> <td style="text-align: center; color:#000;font-size: 12px;" colspan="2"> <p style="padding-bottom:5px"> Do not have an account at <span style="color: #f90;"> iCoinMarket</span>? </p></td></tr><tr> <td style="padding-left: 18px;text-align:center;" colspan="2"> <a href="#"> <img src="' + config.emailDomain + '/assets/images/learn-button.png" alt="learn"> </a> </td></tr><tr> <td style="text-align: center;padding-top: 6px;padding-right: 21px;" colspan="2"> <a href="#"> <img src="' + config.emailDomain + '/assets/images/twitter.png" alt="twitter"> </a> <a href="https://www.youtube.com/channel/UCjG1qbP7T8oqxPK7brWdbVw"> <img src="' + config.emailDomain + '/assets/images/youtube.png" alt="youtube"> </a> <a href="https://www.facebook.com/groups/icoinmarket/"> <img src="' + config.emailDomain + '/assets/images/facebook.png" alt="facebook"> </a> <a href="http://support.icoinmarket.com/"> <img src="' + config.emailDomain + '/assets/images/live-chat-button.png" alt="live chat"> </a> </td></tr><tr> <td style="text-align: center;color:#4A99BC;padding-bottom:13px;font-size:12px" colspan="2"> Manage your subscriptions | <a href="' + config.emailDomain + '/terms-of-service" style="color: #4A99BC; text-decoration: blink;">Privacy Policy</a> </td></tr><tr> <td style="text-align: center; color:#FFFFFF;font-size:12px" colspan="2">&nbsp;</td></tr></table></div>';
      _self.sendEmail(_user.email, config.email.mailFrom, subject, message, null, function(error, info) {
        if (error) {
          console.log(error, message);

          if(res) {
            return res.status(200).json({
              error: 'Sorry! unable to send verification email, please contact support system'
            });
          }
        } else {
          console.log('Message sent: ' + info.response, message);
          if(res) {
            return res.status(200).json({
              send: true
            });
          }
        };
      });
    },

    /**
     * Send email to sponsor
     */
    sendMailToSponsor: function(user, sponsorId) {
      var _self = this;
      var subject = 'iCoinMarket :: Congrats SPONSOR_NAME !!! – You Have A New personal sign up';
      Users.findById(sponsorId+'', function(err, sponsor) {
        if(!err && sponsor) {
          subject = subject.replace('SPONSOR_NAME', sponsor.name);
          var message = '<div style="max-width: 600px; color: #f90; border-radius:10px; text-align: center; min-height: 300; font-family: arial; text-align: center; margin: auto; padding: 20px; overflow: hidden; box-shadow: 2px 2px 2px 2px #f2f2f2; border:1px solid #ccc;"> <img src="' + config.emailDomain + '/assets/images/91063c67.icmlogo.png" width=200> <br/> <br/> <br/> <div style="text-align:left;color:black"> <p style="text-transform:capitalize; padding-top:20px"> <strong>Dear &nbsp;</strong>'+ sponsor.name +', </p><p style="padding-top:10px">You have just sponsored a new member, personally!!!</p><p>Please find more details of your referral-</p><p> <strong>Email : </strong>'+user.email+' </p><p> <strong>Phone Number : </strong> '+(user.mobile ? user.mobile : "Not Mentioned")+' </p><p> <strong>Name :</strong> '+ user.name +' </p><p>Kindly contact them and make sure they are able to verify their email address to assure authenticity. </p><p>Once verified you can give them a walkthrough with the process of Buying iCoinMarket >Utilizing them in the system> Clicking Their Ads With Overall Understanding Of The System! Also Share your iCoinMarket story and offer your support. </p><p>Some people need more specific directions than others, so the only way to know what they need is to ask and assist them on every step! </p><p>The more support you offer, the more successful you will be as a leader.</p><p>Keep up the great work and whatever you do, keep driving traffic to your iCoinMarket referral links so you can grow your referral commissions!</p><p>With each person you introduce to iCoinMarket, you are also indirectly introducing their circle of influence, which means more eyes on your advertisements, and potentially more money in your pocket!</p><p>You are doing great!</p><br><p> <strong>Regards</strong> <p>Team iCoinMarket </p><br></div><p style="color: #f90;"> In case you are seeing this email by mistake, <br/>Please get the support informed! <br/> <hr/>Drop an email at <b>support@icoinmarket.com </b> for instant replies. </p><hr/> <table align="center" style="margin: 0 auto;padding-top:10px"> <tr> <td style="text-align: center; color:#000;font-size: 12px;" colspan="2"> <p style="padding-bottom:5px"> Do not have an account at <span style="color: #f90;"> iCoinMarket</span>? </p></td></tr><tr> <td style="padding-left: 18px;text-align:center;" colspan="2"> <a href="#"> <img src="' + config.emailDomain + '/assets/images/learn-button.png" alt="learn"> </a> </td></tr><tr> <td style="text-align: center;padding-top: 6px;padding-right: 21px;" colspan="2"> <a href="#"> <img src="' + config.emailDomain + '/assets/images/twitter.png" alt="twitter"> </a> <a href="https://www.youtube.com/channel/UCjG1qbP7T8oqxPK7brWdbVw"> <img src="' + config.emailDomain + '/assets/images/youtube.png" alt="youtube"> </a> <a href="https://www.facebook.com/groups/icoinmarket/"> <img src="' + config.emailDomain + '/assets/images/facebook.png" alt="facebook"> </a> <a href="http://support.icoinmarket.com/"> <img src="' + config.emailDomain + '/assets/images/live-chat-button.png" alt="live chat"> </a> </td></tr><tr> <td style="text-align: center;color:#4A99BC;padding-bottom:13px;font-size:12px" colspan="2"> Manage your subscriptions | <a href="' + config.emailDomain + '/terms-of-service" style="color: #4A99BC; text-decoration: blink;">Privacy Policy</a> </td></tr><tr> <td style="text-align: center; color:#FFFFFF;font-size:12px" colspan="2">&nbsp;</td></tr></table></div>';
          _self.sendEmail(sponsor.email, config.email.mailFrom, subject, message, null, function(error, info){
            if(error){
              console.log(error, message);
            }else{
              console.log('Message sent: ' + info.response, message);
              _self._createInternalMessage(subject, message, sponsorId, {
                id: config.sponsorId,
                name: config.sponsorUn,
                email: config.email.mailFrom
              });
            };
          });
        }
        else {
          console.log(' >>>> Unable to sent Sponsoer email ', sponsorId);
        }
      });
    },

    sendWelcomeEmail: function(mailTo, userName, originUrl) {
      var _self = this;
      var subject = 'iCoinMarket :: Welcome';
        var message= '<div style="max-width: 600px; color: #f90; border-radius:10px; text-align: center; min-height: 300; font-family: arial; text-align: center; margin: auto; padding: 20px; overflow: hidden; box-shadow: 2px 2px 2px 2px #f2f2f2; border:1px solid #ccc;"> <img src="' + config.emailDomain + '/assets/images/91063c67.icmlogo.png" width=200><br/><br/><br/> <h1 style="font-size:45px;">Here You Go!!!</h1> <div style="text-align:left;color:black"> <h2 style="background: #083983; color: #fff; padding: 10px; border-radius: 50px;"> Thanks for a successful signup with iCoinMarket</h2> <p style="color: #666; border:1px solid #f2f2f2; border-bottom:2px solid #e2e2e2;border-radius: 5px; padding: 20px; background: #fbfbfb; text-align: justify;">A lifetime opportunity unleashed! We would recommend you to confirm your account from the registered email by clicking on the shared link! If no email found in the primary inbox, check spam. (Pull the email from spam to primary for further updates and communications!) Get your account confirmed and explore your dashboard! </p><p>Thanks And Regards,</p><strong>Team iCoinMarket</strong></p></div><p style="color: #f90;"> In case you are seeing this email by mistake,<br/>Please get the support informed! <br/> <hr/> Drop an email at <b>support@icoinmarket.com </b> for instant replies.<br/> </p><hr/> <table align="center" style="margin: 0 auto;padding-top:10px"> <tr> <td style="text-align: center; color:#000;font-size: 12px;" colspan="2"> <p style="padding-bottom:5px">Do not have an account at <span style="color: #f90;"> iCoinMarket</span>?</p></td></tr><tr> <td style="padding-left: 18px;text-align:center;" colspan="2"><a href="#"><img src="' + config.emailDomain + '/assets/images/learn-button.png" alt="learn"></a></td></tr><tr> <td style="text-align: center;padding-top: 6px;padding-right: 21px;" colspan="2"> <a href="#"> <img src="' + config.emailDomain + '/assets/images/twitter.png" alt="twitter"></a> <a href="https://www.youtube.com/channel/UCjG1qbP7T8oqxPK7brWdbVw"><img src="' + config.emailDomain + '/assets/images/youtube.png" alt="youtube"></a> <a href="https://www.facebook.com/groups/icoinmarket/"> <img src="' + config.emailDomain + '/assets/images/facebook.png" alt="facebook"></a><a href="http://support.icoinmarket.com/"><img src="' + config.emailDomain + '/assets/images/live-chat-button.png" alt="live chat"></a></td></tr><tr> <td style="text-align: center;color:#4A99BC;padding-bottom:13px;font-size:12px" colspan="2">Manage your subscriptions | <a href="' + config.emailDomain + '/terms-of-service" style="color: #4A99BC; text-decoration: blink;">Privacy Policy</a></td></tr><tr><td style="text-align: center; color:#FFFFFF;font-size:12px" colspan="2">&nbsp;</td></tr></table></div>'
      _self.sendEmail(mailTo, config.email.mailFrom, subject, message, null, function(error, info){
        if(error){
          console.log(error, message);
        }else{
          console.log('Message sent: ' + info.response, message);
        };
      });
    },

    sendPurchaseRevertEmail: function(mailTo, userName) {
      var _self = this;
      var subject = 'Update On Your Order for \'Business Opportunity Clicks\' from iCoinMarket';
      var message = '<div style="max-width: 600px; color: #f90; border-radius:10px; text-align: center; min-height: 300; font-family: arial; text-align: center; margin: auto; padding: 20px; overflow: hidden; box-shadow: 2px 2px 2px 2px #f2f2f2; border:1px solid #ccc;"> <img src="' + config.emailDomain + '/assets/images/91063c67.icmlogo.png" width=200> <br/> <br/> <br/> <div style="text-align:left;color:black"> <p>Hi! '+userName+',</p><p>This email is to notify you that we have refunded (in full) your order for "Business Opportunity Clicks". We encountered a minor Clerical/tech glitch in the product pricing because of which commissions were being mis-calculated !</p><p>The Gold coins debited against the product purchase are as of now credited back in your account.</p><p>We request you to please place a fresh order as everything is fine with the system now.</p><p>Apologies for the inconvenience caused</p><p>&nbsp;</p><p>Thanks And Regards,</p><p> Finance Team <br><strong>iCoinMarket</strong> </p></div><p style="color: #f90;"> In case you are seeing this email by mistake, <br/>Please get the support informed! <br/> <hr/>Drop an email at <b>support@icoinmarket.com </b> for instant replies. </p><hr/> <table align="center" style="margin: 0 auto;padding-top:10px"> <tr> <td style="text-align: center; color:#000;font-size: 12px;" colspan="2"> <p style="padding-bottom:5px"> Do not have an account at <span style="color: #f90;"> iCoinMarket</span>? </p></td></tr><tr> <td style="padding-left: 18px;text-align:center;" colspan="2"> <a href="#"> <img src="' + config.emailDomain + '/assets/images/learn-button.png" alt="learn"> </a> </td></tr><tr> <td style="text-align: center;padding-top: 6px;padding-right: 21px;" colspan="2"> <a href="#"> <img src="' + config.emailDomain + '/assets/images/twitter.png" alt="twitter"> </a> <a href="https://www.youtube.com/channel/UCjG1qbP7T8oqxPK7brWdbVw"> <img src="' + config.emailDomain + '/assets/images/youtube.png" alt="youtube"> </a> <a href="https://www.facebook.com/groups/icoinmarket/"> <img src="' + config.emailDomain + '/assets/images/facebook.png" alt="facebook"> </a> <a href="http://support.icoinmarket.com/"> <img src="' + config.emailDomain + '/assets/images/live-chat-button.png" alt="live chat"> </a> </td></tr><tr> <td style="text-align: center;color:#4A99BC;padding-bottom:13px;font-size:12px" colspan="2"> Manage your subscriptions | <a href="' + config.emailDomain + '/terms-of-service" style="color: #4A99BC; text-decoration: blink;">Privacy Policy</a> </td></tr><tr> <td style="text-align: center; color:#FFFFFF;font-size:12px" colspan="2">&nbsp;</td></tr></table></div>';
      _self.sendEmail(mailTo, config.email.mailFrom, subject, message, null, function(error, info){
        if(error){
          console.log(error, message);
        }else{
          console.log('Message sent: ' + info.response, message);
        };
      });
    },

    sendRevenueRevertEmail: function(mailTo, userName, subSubject) {
      var _self = this;
      var subject = 'Oops !! Commissions revert due to Order cancellation by your Downline';
      var message = '<div style="max-width: 600px; color: #f90; border-radius:10px; text-align: center; min-height: 300; font-family: arial; text-align: center; margin: auto; padding: 20px; overflow: hidden; box-shadow: 2px 2px 2px 2px #f2f2f2; border:1px solid #ccc;"> <img src="' + config.emailDomain + '/assets/images/91063c67.icmlogo.png" width=200> <br/> <br/> <br/> <div style="text-align:left;color:black"> <p>Hi! '+userName+',</p><p> This email is to notify you that one of your downline has decided to restructure his/her order of \'Business Opportunity Clicks\'. On their special request, iCoinMarket has processed a full refund for them. This processes also involves the <strong>deduction of Commissions</strong> that was credited to your wallet as \'Team Sales Commissions\'; against this purchase order from your downline </p><p>Moreover, this won\'t be happening most often</p><p>Hadn\'t it been for iCoinMarket to be in Prelaunch phase, this was never possible.</p><p>Customer satisfaction is our outmost priority and we are always willing to walk an extra mile for our amazing affiliates. Therefore, we have considered this for once.</p><p>Please bear with us on this minor loss but be assured that this affiliate will soon return with a bigger order that will attract better commissions for you.</p><p>Apologies for the inconvenience caused</p><p>Thanks And Regards,</p><p> Finance Team <br><strong>iCoinMarket</strong> </p></div><p style="color: #f90;"> In case you are seeing this email by mistake, <br/>Please get the support informed! <br/> <hr/>Drop an email at <b>support@icoinmarket.com </b> for instant replies. </p><hr/> <table align="center" style="margin: 0 auto;padding-top:10px"> <tr> <td style="text-align: center; color:#000;font-size: 12px;" colspan="2"> <p style="padding-bottom:5px"> Do not have an account at <span style="color: #f90;"> iCoinMarket </span>? </p></td></tr><tr> <td style="padding-left: 18px;text-align:center;" colspan="2"> <a href="#"> <img src="' + config.emailDomain + '/assets/images/learn-button.png" alt="learn"> </a> </td></tr><tr> <td style="text-align: center;padding-top: 6px;padding-right: 21px;" colspan="2"> <a href="#"> <img src="' + config.emailDomain + '/assets/images/twitter.png" alt="twitter"> </a> <a href="https://www.youtube.com/channel/UCjG1qbP7T8oqxPK7brWdbVw"> <img src="' + config.emailDomain + '/assets/images/youtube.png" alt="youtube"> </a> <a href="https://www.facebook.com/groups/icoinmarket/"> <img src="' + config.emailDomain + '/assets/images/facebook.png" alt="facebook"> </a> <a href="http://support.icoinmarket.com/"> <img src="' + config.emailDomain + '/assets/images/live-chat-button.png" alt="live chat"> </a> </td></tr><tr> <td style="text-align: center;color:#4A99BC;padding-bottom:13px;font-size:12px" colspan="2"> Manage your subscriptions | <a href="' + config.emailDomain + '/terms-of-service" style="color: #4A99BC; text-decoration: blink;">Privacy Policy</a> </td></tr><tr> <td style="text-align: center; color:#FFFFFF;font-size:12px" colspan="2">&nbsp;</td></tr></table></div>';
      _self.sendEmail(mailTo, config.email.mailFrom, subject, message, null, function(error, info){
        if(error){
          console.log(error, message);
        }else{
          console.log('Message sent: ' + info.response, message);
        };
      });
    },

    sendWithdrawalSuccess: function(mailTo, userName, amount, drawType, idInfo, userId,coin) {
      var _self = this;
      var subject = 'iCoinMarket :: Your withdrawal request is completed (Through: ' + drawType.toUpperCase() + ')';
      var message ='<div style="max-width: 600px; color: #f90; border-radius:10px; text-align: center; min-height: 300; font-family: arial; text-align: center; margin: auto; padding: 20px; overflow: hidden; box-shadow: 2px 2px 2px 2px #f2f2f2; border:1px solid #ccc;"> <img src="' + config.emailDomain + '/assets/images/91063c67.icmlogo.png" width=200> <br/> <br/> <br/> <div style="text-align:left;color:black"> <p style="text-align:center">'+subject+'</p><p style="text-transform:capitalize; padding-top:20px"> <strong>Hello &nbsp;</strong>'+ userName+', </p><p style="padding-top:10px">Your withdrawal request was successfully completed.</p><p> <strong> '+ coin +' of Gold Coins=$'+ amount +'</strong> was paid to your '+ drawType.toUpperCase() +' </p><p> <strong>Wallet info</strong>='+ idInfo.reqAddress +' </p><br><br><p> <strong>Regards</strong> <p>Team iCoinMarket </p><br></div><p style="color: #f90;"> In case you are seeing this email by mistake, <br/>Please get the support informed! <br/> <hr/>Drop an email at <b>support@icoinmarket.com </b> for instant replies. </p><hr/> <table align="center" style="margin: 0 auto;padding-top:10px"> <tr> <td style="text-align: center; color:#000;font-size: 12px;" colspan="2"> <p style="padding-bottom:5px"> Do not have an account at <span style="color: #f90;"> iCoinMarket</span>? </p></td></tr><tr> <td style="padding-left: 18px;text-align:center;" colspan="2"> <a href="#"> <img src="' + config.emailDomain + '/assets/images/learn-button.png" alt="learn"> </a> </td></tr><tr> <td style="text-align: center;padding-top: 6px;padding-right: 21px;" colspan="2"> <a href="#"> <img src="' + config.emailDomain + '/assets/images/twitter.png" alt="twitter"> </a> <a haref="https://www.youtube.com/channel/UCjG1qbP7T8oqxPK7brWdbVw"> <img src="' + config.emailDomain + '/assets/images/youtube.png" alt="youtube"> </a> <a href="https://www.facebook.com/groups/icoinmarket/"> <img src="' + config.emailDomain + '/assets/images/facebook.png" alt="facebook"> </a> <a href="http://support.icoinmarket.com/"> <img src="' + config.emailDomain + '/assets/images/live-chat-button.png" alt="live chat"> </a> </td></tr><tr> <td style="text-align: center;color:#4A99BC;padding-bottom:13px;font-size:12px" colspan="2"> Manage your subscriptions | <a href="' + config.emailDomain + '/terms-of-service" style="color: #4A99BC; text-decoration: blink;">Privacy Policy</a> </td></tr><tr> <td style="text-align: center; color:#FFFFFF;font-size:12px" colspan="2">&nbsp;</td></tr></table></div>';
      _self.sendEmail(mailTo, config.email.mailFrom, subject, message, null, function(error, info){
        if(error){
          console.log(error, message);
        }else{
          console.log('Message sent: ' + info.response, message);
          _self._createInternalMessage(subject, message, userId, {
            id: config.sponsorId,
            email: '',
            name: config.sponsorUn,
          });
        };
      });
    },

    sendWithdrawalPending: function(mailTo, userName, amount, drawType, idInfo, userId,coin) {
      var _self = this;
      var subject = 'iCoinMarket :: Your withdrawal request is Pending (Through: ' + drawType.toUpperCase() + ')';
      var message = '<div style="max-width: 600px; color: #f90; border-radius:10px; text-align: center; min-height: 300; font-family: arial; text-align: center; margin: auto; padding: 20px; overflow: hidden; box-shadow: 2px 2px 2px 2px #f2f2f2; border:1px solid #ccc;"> <img src="' + config.emailDomain + '/assets/images/91063c67.icmlogo.png" width=200> <br/> <br/> <br/> <div style="text-align:left;color:black"> <p style="text-align:center">'+subject+'</p><p style="text-transform:capitalize; padding-top:20px"> <strong>Hello &nbsp;</strong>'+ userName+', </p><p style="padding-top:10px">Your withdrawal request was received by us (Status Pending).</p><p> <strong> '+ coin +' of Gold Coins=$'+ amount +' </strong> was paid to your '+drawType.toUpperCase()+' </p><p> <strong>Wallet info</strong>=' + idInfo.reqAddress + ' </p><br><p> <strong>Regards</strong> <p>Team iCoinMarket </p><br></div><p style="color: #f90;"> In case you are seeing this email by mistake, <br/>Please get the support informed! <br/> <hr/>Drop an email at <b>support@icoinmarket.com </b> for instant replies. </p><hr/> <table align="center" style="margin: 0 auto;padding-top:10px"> <tr> <td style="text-align: center; color:#000;font-size: 12px;" colspan="2"> <p style="padding-bottom:5px"> Do not have an account at <span style="color: #f90;"> iCoinMarket </span>? </p></td></tr><tr> <td style="padding-left: 18px;text-align:center;" colspan="2"> <a href="#"> <img src="' + config.emailDomain + '/assets/images/learn-button.png" alt="learn"> </a> </td></tr><tr> <td style="text-align: center;padding-top: 6px;padding-right: 21px;" colspan="2"> <a href="#"> <img src="' + config.emailDomain + '/assets/images/twitter.png" alt="twitter"> </a> <a href="https://www.youtube.com/channel/UCjG1qbP7T8oqxPK7brWdbVw"> <img src="' + config.emailDomain + '/assets/images/youtube.png" alt="youtube"> </a> <a href="https://www.facebook.com/groups/icoinmarket/"> <img src="' + config.emailDomain + '/assets/images/facebook.png" alt="facebook"> </a> <a href="http://support.icoinmarket.com/"> <img src="' + config.emailDomain + '/assets/images/live-chat-button.png" alt="live chat"> </a> </td></tr><tr> <td style="text-align: center;color:#4A99BC;padding-bottom:13px;font-size:12px" colspan="2"> Manage your subscriptions | <a href="' + config.emailDomain + '/terms-of-service" style="color: #4A99BC; text-decoration: blink;">Privacy Policy</a> </td></tr><tr> <td style="text-align: center; color:#FFFFFF;font-size:12px" colspan="2">&nbsp;</td></tr></table></div>';
      _self.sendEmail(mailTo, config.email.mailFrom, subject, message, null, function(error, info){
        if(error){
          console.log(error, message);
        }else{
          console.log('Message sent: ' + info.response, message);
          _self._createInternalMessage(subject, message, userId, {
            id: config.sponsorId,
            email: '',
            name: config.sponsorUn,
          });
        };
      });
    },

    sendWithdrawalProcessing: function(mailTo, userName, coin, drawType, idInfo, userId,amount) {
      var _self = this;
      var subject = 'iCoinMarket :: WithDrawal Request Accepted (Through: ' + drawType.toUpperCase() + ')';
      var message = '<div style="max-width: 600px; color: #f90; border-radius:10px; text-align: center; min-height: 300; font-family: arial; text-align: center; margin: auto; padding: 20px; overflow: hidden; box-shadow: 2px 2px 2px 2px #f2f2f2; border:1px solid #ccc;"> <img src="' + config.emailDomain + '/assets/images/91063c67.icmlogo.png" width=200> <br/> <br/> <br/> <div style="text-align:left;color:black"> <p>Hi! '+userName+', </p><p>This email is to notify you that, you have requested to withdrawal an amount USD ' + amount + ' through ' + drawType.toUpperCase() + '.</p><p> The withdrawal request, unique <strong>iCoinMarket Transaction ID is:</strong> ' + idInfo.internal + '. </p><p> <strong> Your Request Current Status Is: <em>PROCESSING</em> </strong> </p><p>Thanks And Regards,</p><p> Finance Team <br><strong>iCoinMarket</strong> </p></div><p style="color: #f90;"> In case you are seeing this email by mistake, <br/>Please get the support informed! <br/> <hr/>Drop an email at <b>support@icoinmarket.com </b> for instant replies. </p><hr/> <table align="center" style="margin: 0 auto;padding-top:10px"> <tr> <td style="text-align: center; color:#000;font-size: 12px;" colspan="2"> <p style="padding-bottom:5px"> Do not have an account at <span style="color: #f90;"> iCoinMarket </span>? </p></td></tr><tr> <td style="padding-left: 18px;text-align:center;" colspan="2"> <a href="#"> <img src="' + config.emailDomain + '/assets/images/learn-button.png" alt="learn"> </a> </td></tr><tr> <td style="text-align: center;padding-top: 6px;padding-right: 21px;" colspan="2"> <a href="#"> <img src="' + config.emailDomain + '/assets/images/twitter.png" alt="twitter"> </a> <a href="https://www.youtube.com/channel/UCjG1qbP7T8oqxPK7brWdbVw"> <img src="' + config.emailDomain + '/assets/images/youtube.png" alt="youtube"> </a> <a href="https://www.facebook.com/groups/icoinmarket/"> <img src="' + config.emailDomain + '/assets/images/facebook.png" alt="facebook"> </a> <a href="http://support.icoinmarket.com/"> <img src="' + config.emailDomain + '/assets/images/live-chat-button.png" alt="live chat"> </a> </td></tr><tr> <td style="text-align: center;color:#4A99BC;padding-bottom:13px;font-size:12px" colspan="2"> Manage your subscriptions | <a href="' + config.emailDomain + '/terms-of-service" style="color: #4A99BC; text-decoration: blink;">Privacy Policy</a> </td></tr><tr> <td style="text-align: center; color:#FFFFFF;font-size:12px" colspan="2">&nbsp;</td></tr></table></div>';
      _self.sendEmail(mailTo, config.email.mailFrom, subject, message, null, function(error, info){
        if(error){
          console.log(error, message);
        }else{
          console.log('Message sent: ' + info.response, message);
          _self._createInternalMessage(subject, message, userId, {
            id: config.sponsorId,
            email: '',
            name: config.sponsorUn,
          });
        };
      });
    },

    sendWithdrawalCancelEmail: function(mailTo, userName, coin, drawType, idInfo, userId,amount) {
      var _self = this;
      var subject = 'iCoinMarket :: WithDrawal Request Cancelled (Through: ' + drawType.toUpperCase() + ')';
      var message = '<div style="max-width: 600px; color: #f90; border-radius:10px; text-align: center; min-height: 300; font-family: arial; text-align: center; margin: auto; padding: 20px; overflow: hidden; box-shadow: 2px 2px 2px 2px #f2f2f2; border:1px solid #ccc;"> <img src="' + config.emailDomain + '/assets/images/91063c67.icmlogo.png" width=200> <br/> <br/> <br/> <div style="text-align:left;color:black"> <p>Hi! '+userName+', </p><p>This email is to notify you that, your withdrawal request for an amount USD ' + amount + ' through ' + drawType.toUpperCase() + ' has been CANCELLED.</p><p> The withdrawal request, unique <strong>iCoinMarket Transaction ID is:</strong> ' + idInfo.internal + '. </p><p> <strong> Your Request Current Status Is: <em>CANCELLED</em> </strong> </p><p>Thanks And Regards,</p><p> Finance Team <br><strong>iCoinMarket</strong> </p></div><p style="color: #f90;"> In case you are seeing this email by mistake, <br/>Please get the support informed! <br/> <hr/>Drop an email at <b>support@icoinmarket.com </b> for instant replies. </p><hr/> <table align="center" style="margin: 0 auto;padding-top:10px"> <tr> <td style="text-align: center; color:#000;font-size: 12px;" colspan="2"> <p style="padding-bottom:5px"> Do not have an account at <span style="color: #f90;"> iCoinMarket </span>? </p></td></tr><tr> <td style="padding-left: 18px;text-align:center;" colspan="2"> <a href="#"> <img src="' + config.emailDomain + '/assets/images/learn-button.png" alt="learn"> </a> </td></tr><tr> <td style="text-align: center;padding-top: 6px;padding-right: 21px;" colspan="2"> <a href="#"> <img src="' + config.emailDomain + '/assets/images/twitter.png" alt="twitter"> </a> <a href="https://www.youtube.com/channel/UCjG1qbP7T8oqxPK7brWdbVw"> <img src="' + config.emailDomain + '/assets/images/youtube.png" alt="youtube"> </a> <a href="https://www.facebook.com/groups/icoinmarket/"> <img src="' + config.emailDomain + '/assets/images/facebook.png" alt="facebook"> </a> <a href="http://support.icoinmarket.com/"> <img src="' + config.emailDomain + '/assets/images/live-chat-button.png" alt="live chat"> </a> </td></tr><tr> <td style="text-align: center;color:#4A99BC;padding-bottom:13px;font-size:12px" colspan="2"> Manage your subscriptions | <a href="' + config.emailDomain + '/terms-of-service" style="color: #4A99BC; text-decoration: blink;">Privacy Policy</a> </td></tr><tr> <td style="text-align: center; color:#FFFFFF;font-size:12px" colspan="2">&nbsp;</td></tr></table></div>';
      _self.sendEmail(mailTo, config.email.mailFrom, subject, message,null, function(error, info){
        if(error){
          console.log(error, message);
        }else{
          console.log('Message sent: ' + info.response, message);
          _self._createInternalMessage(subject, message, userId, {
            id: config.sponsorId,
            email: '',
            name: config.sponsorUn,
          });
        };
      });
    },

    sendBankWireAdminEmails: function(bankwire, payment, otherInfo) {
      var _self = this;
      var subject = 'ClikIntensity: Bank Wire Status Update';
      var mailTo1 = 'finance@icoin.us';
      var mailTo2 = 'gaurav@ith.tech';
      var message = '<div style="max-width: 600px; color: #f90; border-radius:10px; text-align: center; min-height: 300; font-family: arial; text-align: center; margin: auto; padding: 20px; overflow: hidden; box-shadow: 2px 2px 2px 2px #f2f2f2; border:1px solid #ccc;"> <img src="' + config.emailDomain + '/assets/images/91063c67.icmlogo.png" width=200> <br/> <br/> <br/> <div style="text-align:left;color:black"> <h4>Hey there!,</h4> <p>Finance Admin Or Admin Just Approved A Bank Wire Form. Details are as follows: - </p><table> <tr> <td> <strong>Status</strong> </td><td> <strong>COMPLETED</strong> </td></tr><tr> <td>Request Packs</td><td>'+(payment.paidamount / 25)+'</td></tr><tr> <td>Depositor Name</td><td>'+bankwire.depositorname+'</td></tr><tr> <td>Name On Bank Account</td><td>'+bankwire.bankname+'</td></tr><tr> <td>Bank Branch Address</td><td>'+bankwire.bankaddress+'</td></tr><tr> <td>Sort Code/Swift Code/Other Branch IDs</td><td>'+(bankwire.sortcode ? bankwire.sortcode: '')+'</td></tr><tr> <td>Bank Account Number</td><td>'+bankwire.accountnumber+'</td></tr><tr> <td>Uploaded Receipt</td><td> <img src="' + config.emailDomain + '/'+bankwire.receiptpath+'"/> </td></tr><tr> <td>Swift / Transaction ID</td><td>'+otherInfo.swiftid+'</td></tr><tr> <td>No. gold packs to be credited</td><td>'+otherInfo.goldpacks+'</td></tr><tr> <td>Bank Account</td><td>'+otherInfo.adminbankaccount+'</td></tr><tr> <td>Admins Comment</td><td>'+otherInfo.admincomments+'</td></tr></table> <br><br><p> <strong>Regards</strong> <p>Team iCoinMarket </p><br></div><p style="color: #f90;"> In case you are seeing this email by mistake, <br/>Please get the support informed! <br/> <hr/>Drop an email at <b>support@icoinmarket.com </b> for instant replies. </p><hr/> <table align="center" style="margin: 0 auto;padding-top:10px"> <tr> <td style="text-align: center; color:#000;font-size: 12px;" colspan="2"> <p style="padding-bottom:5px"> Do not have an account at <span style="color: #f90;"> iCoinMarket </span>? </p></td></tr><tr> <td style="padding-left: 18px;text-align:center;" colspan="2"> <a href="#"> <img src="' + config.emailDomain + '/assets/images/learn-button.png" alt="learn"> </a> </td></tr><tr> <td style="text-align: center;padding-top: 6px;padding-right: 21px;" colspan="2"> <a href="#"> <img src="' + config.emailDomain + '/assets/images/twitter.png" alt="twitter"> </a> <a href="https://www.youtube.com/channel/UCjG1qbP7T8oqxPK7brWdbVw"> <img src="' + config.emailDomain + '/assets/images/youtube.png" alt="youtube"> </a> <a href="https://www.facebook.com/groups/icoinmarket/"> <img src="' + config.emailDomain + '/assets/images/facebook.png" alt="facebook"> </a> <a href="http://support.icoinmarket.com/"> <img src="' + config.emailDomain + '/assets/images/live-chat-button.png" alt="live chat"> </a> </td></tr><tr> <td style="text-align: center;color:#4A99BC;padding-bottom:13px;font-size:12px" colspan="2"> Manage your subscriptions | <a href="' + config.emailDomain + '/terms-of-service" style="color: #4A99BC; text-decoration: blink;">Privacy Policy</a> </td></tr><tr> <td style="text-align: center; color:#FFFFFF;font-size:12px" colspan="2">&nbsp;</td></tr></table></div>';
      _self.sendEmail(mailTo1, config.email.mailFrom, subject, message, null, function(error, info){
        if(error){
          console.log(error, message);
        }else{
          console.log('Message sent: ' + info.response, message);
        };
      });
      _self.sendEmail(mailTo2, config.email.mailFrom, subject, message, null, function(error, info){
        if(error){
          console.log(error, message);
        }else{
          console.log('Message sent: ' + info.response, message);
          _self._createInternalMessage(subject, message, payment.userid, {
            id: config.sponsorId,
            email: '',
            name: config.sponsorUn,
          });
        };
      });
    },

    sendPurchaseEmail: function(mailTo, userName, mailSubject, orderData, productName) {
      var _self = this, message = '';
      var purchaseMode = ((orderData.paymode == 'ic') ? 'USD Wallet' : (orderData.paymode =='bitcoinBlockIO' ? 'bitcoin' : (orderData.paymode == 'litecoinBlockIO' ? 'litecoin' : orderData.paymode.toUpperCase()) ));
      if(orderData.productid == 'icoin' || orderData.productid == 'usd') {
        if(orderData.productid == 'icoin') {
            mailSubject = 'iCoinMarket :: iCoinMarket coins Purchase Notification';
        } else if(orderData.productid == 'usd') {
            mailSubject = 'iCoinMarket :: USD Purchase Notification';
        }
        var message = '<div style="max-width: 600px; color: #f90; border-radius:10px; text-align: center; min-height: 300; font-family: arial; text-align: center; margin: auto; padding: 20px; overflow: hidden; box-shadow: 2px 2px 2px 2px #f2f2f2; border:1px solid #ccc;"> <img src="' + config.emailDomain + '/assets/images/91063c67.icmlogo.png" width=200> <br/> <br/> <br/> <h1 style="font-size:1.2em;font-weight:100;">'+mailSubject+'</h1> <div style="text-align:left;color:black"> <p style="text-transform:capitalize; padding-top:20px"> <strong>Hello &nbsp;</strong>'+ userName+', </p><p style="padding-top:10px">Please find the details about your new purchase below:</p><p> <p> <strong>Product Name : </strong> '+orderData.productname+' </p><p> <strong>Amount : </strong>'+orderData.paidamount+' $ </p><p> <strong>Mode Of Purchase : </strong> '+purchaseMode+' </p></p><br><p> <strong>Regards</strong> <p>Team iCoinMarket </p><br></div><p style="color: #f90;"> In case you are seeing this email by mistake, <br/>Please get the support informed! <br/> <hr/>Drop an email at <b>support@icoinmarket.com </b> for instant replies. </p><hr/> <table align="center" style="margin: 0 auto;padding-top:10px"> <tr> <td style="text-align: center; color:#000;font-size: 12px;" colspan="2"> <p style="padding-bottom:5px"> Do not have an account at <span style="color: #f90;"> iCoinMarket </span>? </p></td></tr><tr> <td style="padding-left: 18px;text-align:center;" colspan="2"> <a href="#"> <img src="' + config.emailDomain + '/assets/images/learn-button.png" alt="learn"> </a> </td></tr><tr> <td style="text-align: center;padding-top: 6px;padding-right: 21px;" colspan="2"> <a href="#"> <img src="' + config.emailDomain + '/assets/images/twitter.png" alt="twitter"> </a> <a href="https://www.youtube.com/channel/UCjG1qbP7T8oqxPK7brWdbVw"> <img src="' + config.emailDomain + '/assets/images/youtube.png" alt="youtube"> </a> <a href="https://www.facebook.com/groups/icoinmarket/"> <img src="' + config.emailDomain + '/assets/images/facebook.png" alt="facebook"> </a> <a href="http://support.icoinmarket.com/"> <img src="' + config.emailDomain + '/assets/images/live-chat-button.png" alt="live chat"> </a> </td></tr><tr> <td style="text-align: center;color:#4A99BC;padding-bottom:13px;font-size:12px" colspan="2"> Manage your subscriptions | <a href="' + config.emailDomain + '/terms-of-service" style="color: #4A99BC; text-decoration: blink;">Privacy Policy</a> </td></tr><tr> <td style="text-align: center; color:#FFFFFF;font-size:12px" colspan="2">&nbsp;</td></tr></table></div>';
      }

      _self.sendEmail(mailTo, config.email.mailFrom, mailSubject, message, null, function(error, info){
        if(error){
          console.log(error, message);
        }else{
          console.log('Message sent: ' + info.response, message);
          _self._createInternalMessage(mailSubject, message, orderData.userid, {
            id: config.sponsorId,
            email: '',
            name: config.sponsorUn,
          });
        };
      });
    },

    sendCommissionDistributionEmail: function(sponsorId, level, userName,usd, coins, type) {
      // Stopped for now as this section required verification
      var _self = this;
      var subject = 'You Just Made More Money From Tier' + level;
      var message = '<div style="max-width: 600px; color: #f90; border-radius:10px; text-align: center; min-height: 300; font-family: arial; text-align: center; margin: auto; padding: 20px; overflow: hidden; box-shadow: 2px 2px 2px 2px #f2f2f2; border:1px solid #ccc;"> <img src="' + config.emailDomain + '/assets/images/91063c67.icmlogo.png" width=200><br/><br/><br/><h1 style="font-size:1.2em;font-weight:100;">'+subject+'</h1><div style="text-align:left;color:black"><p style="text-transform:capitalize; padding-top:20px"><strong>Congratulations &nbsp;</strong>EMAIL_MEMBER_NAME,</p> <p style="padding-top:10px">Your iCoinMarket system is working with you and for you.</p> <p>Today you can celebrate making some more money with this latest Tier '+level+' Commission.</p><br> <p><strong>Name:</strong> '+userName+',</p> <p><strong>Username:</strong> '+userName+' ,</p><p><strong>Your Commission:</strong><br />USD : $'+usd+' <br />AdsCash : '+coins+'</p> <p>You can find more details about your commissions in the My Wallet section of Your iCoinMarket Backoffice<a href="' + config.emailDomain + '/wallet">Wallet</a></p> <p>Share the exciting news with everyone you know about how easy it is to make money with iCoinMarket and keep those referral commissions rolling in!</p> <p>One of our amazing features is that you only have to do the work one time and you will keep getting paid referral commissions with each and EVERY purchase of an advertising product one of your referrals make, now that is something to be excited about!</p> <p>Keep up the great work and whatever you do, keep driving traffic to your iCoinMarket referral links so you can grow your referral commissions!</p> <p>Keep up the GREAT work!</p><br> <p><strong>Thank You</strong><p>iCoinMarket Team </p></div><p style="color: #f90;">In case you are seeing this email by mistake,<br/>Please get the support informed! <br/><hr/>Drop an email at <b>support@icoinmarket.com </b> for instant replies.</p><hr/><table align="center" style="margin: 0 auto;padding-top:10px"><tr><td style="text-align: center; color:#000;font-size: 12px;" colspan="2"><p style="padding-bottom:5px">Do not have an account at <span style="color: #f90;"> iCoinMarket</span>?</p></td></tr><tr><td style="padding-left: 18px;text-align:center;" colspan="2"><a href="#"><img src="' + config.emailDomain + '"/assets/images/learn-button.png" alt="learn"></a></td></tr><tr><td style="text-align: center;padding-top: 6px;padding-right: 21px;" colspan="2"> <a href="#"> <img src="' + config.emailDomain + '/assets/images/twitter.png" alt="twitter"></a> <a href="https://www.youtube.com/channel/UCjG1qbP7T8oqxPK7brWdbVw"><img src="' + config.emailDomain + '/assets/images/youtube.png" alt="youtube"></a> <a href="https://www.facebook.com/groups/icoinmarket/"> <img src="' + config.emailDomain + '/assets/images/facebook.png" alt="facebook"></a><a href="http://support.icoinmarket.com/"><img src="' + config.emailDomain + '/assets/images/live-chat-button.png" alt="live chat"></a></td></tr><tr><td style="text-align: center;color:#4A99BC;padding-bottom:13px;font-size:12px" colspan="2">Manage your subscriptions | <a href="' + config.emailDomain + '/terms-of-service" style="color: #4A99BC; text-decoration: blink;">Privacy Policy</a></td></tr><tr><td style="text-align: center; color:#FFFFFF;font-size:12px" colspan="2">&nbsp;</td></tr></table></div>';
      subject = 'iCoinMarket : ' + subject;
      Users.findById(sponsorId, function(err, _user) {
        console.log(JSON.stringify(_user));
        if(_user && !err) {
          message = message.replace('EMAIL_MEMBER_NAME', _user.name);
          _self.sendEmail(_user.email, config.email.mailFrom, subject, message,null, function(error, info){
            if(error){
              console.log(error, message);
            }else{
              console.log('Message sent: ' + info.response, message);
              _self._createInternalMessage(subject, message, sponsorId, {
                id: config.sponsorId,
                email: '',
                name: config.sponsorUn,
              });
            };
          });
        }
      });
    },

    sendProductPurchaseEmail: function(userInfo, productName, purchaseInfo) {
      var _self = this;
      var subject = 'iCoinMarket :: '+productName+' Is Purchased By ' + userInfo.username;
      var message = '<div style="max-width: 600px; color: #f90; border-radius:10px; text-align: center; min-height: 300; font-family: arial; text-align: center; margin: auto; padding: 20px; overflow: hidden; box-shadow: 2px 2px 2px 2px #f2f2f2; border:1px solid #ccc;"> <img src="' + config.emailDomain + '/assets/images/91063c67.icmlogo.png" width=200> <br/> <br/> <br/> <div style="text-align:left;color:black"> <h4>Hi!,</h4> <p>A user "'+userInfo.name+'" (Email: '+userInfo.email+', Username: '+userInfo.username+') purchased "'+productName+'".</p><p>Other details as follows: </p><p> <span> <strong>QUANTITY:&nbsp;</strong>&nbsp;'+purchaseInfo.quantity+' </span> <br>OTHER_DATA </p><br><p> <strong>Regards</strong> <p>Team iCoinMarket </p><br></div><p style="color: #f90;"> In case you are seeing this email by mistake, <br/>Please get the support informed! <br/> <hr/>Drop an email at <b>support@icoinmarket.com </b> for instant replies. </p><hr/> <table align="center" style="margin: 0 auto;padding-top:10px"> <tr> <td style="text-align: center; color:#000;font-size: 12px;" colspan="2"> <p style="padding-bottom:5px"> Do not have an account at <span style="color: #f90;"> iCoinMarket </span>? </p></td></tr><tr> <td style="padding-left: 18px;text-align:center;" colspan="2"> <a href="#"> <img src="' + config.emailDomain + '/assets/images/learn-button.png" alt="learn"> </a> </td></tr><tr> <td style="text-align: center;padding-top: 6px;padding-right: 21px;" colspan="2"> <a href="#"> <img src="' + config.emailDomain + '/assets/images/twitter.png" alt="twitter"> </a> <a href="https://www.youtube.com/channel/UCjG1qbP7T8oqxPK7brWdbVw"> <img src="' + config.emailDomain + '/assets/images/youtube.png" alt="youtube"> </a> <a href="https://www.facebook.com/groups/icoinmarket/"> <img src="' + config.emailDomain + '/assets/images/facebook.png" alt="facebook"> </a> <a href="http://support.icoinmarket.com/"> <img src="' + config.emailDomain + '/assets/images/live-chat-button.png" alt="live chat"> </a> </td></tr><tr> <td style="text-align: center;color:#4A99BC;padding-bottom:13px;font-size:12px" colspan="2"> Manage your subscriptions | <a href="' + config.emailDomain + '/terms-of-service" style="color: #4A99BC; text-decoration: blink;">Privacy Policy</a> </td></tr><tr> <td style="text-align: center; color:#FFFFFF;font-size:12px" colspan="2">&nbsp;</td></tr></table></div>';
      if(purchaseInfo.purchasemeta) {
        var otherData = '', data = purchaseInfo.purchasemeta;
        for(var idx in data) {
          otherData += '<span><strong>'+idx.toUpperCase()+':&nbsp;</strong>&nbsp;'+data[idx]+'</span><br>';
        }
        message = message.replace('OTHER_DATA', otherData);
      }

      _self.sendEmail(config.email.withdrawalEmailTo1, config.email.mailFrom, subject, message, null, function(error, info){
        if(error){
          console.log(error, message);
        } else {

          _self.sendEmail(config.email.withdrawalEmailTo2, config.email.mailFrom, subject, message, null, function(error, info){
            console.log('[info] Message Sent For Product Purchase to Admins ');
          });
        };
      });
    },

    _createInternalMessage: function(subject, body, messageTo, messageFrom) {
      var messageInfo = {
        description: body,
        subject: subject
      };

      var msgViewInfo = {
        senderid: messageFrom.id,
        receiverid: messageTo,
        messageid: 0,
        isview: false,
        impmessage: false,
        active: true,
        isspam: false,
        subject: subject,
        senderinfo: {
          name: messageFrom.name,
          email: messageTo.email
        },
        replyof: messageFrom.id
      };

      Messages.create(messageInfo, function(err, message) {
        if(err) { return handleError(res, err); }

        msgViewInfo.messageid = message._id;
        TeamCommunication.create(msgViewInfo, function(err, teamCommunication) {
          if(err) { return handleError(res, err); }
        });
      });
    },

    sendTransactionCancelEmail: function(mailTo, userName, mailSubject, orderData) {
      var _self = this, message = '';
      var purchaseMode;
      //if (orderData.paymode == 'ic')
      var purchaseMode = ((orderData.paymode == 'ic') ? 'USD Wallet' : (orderData.paymode =='bitcoinBlockIO' ? 'bitcoin' : (orderData.paymode == 'litecoinBlockIO' ? 'litecoin' : orderData.paymode.toUpperCase())  ));
      if(orderData.productid == 'gold' || (orderData.productid == 'silver' && orderData.paymode != 'ic')) {
        var coinType = ((orderData.productid == 'silver') ? 'Silver' : 'Gold');
        mailSubject = 'iCoinMarket :: Transaction Cancel Notification';
        var message = '<div style="max-width: 600px; color: #f90; border-radius:10px; text-align: center; min-height: 300; font-family: arial; text-align: center; margin: auto; padding: 20px; overflow: hidden; box-shadow: 2px 2px 2px 2px #f2f2f2; border:1px solid #ccc;"> <img src="' + config.emailDomain + '/assets/images/91063c67.icmlogo.png" width=200><br/><br/><br/> <h1 style="font-size:1.2em;font-weight:100;">'+mailSubject+'</h1> <div style="text-align:left;color:black"> <p style="text-transform:capitalize; padding-top:20px"><strong>Hello &nbsp;</strong>'+ userName+',</p><p style="padding-top:10px">Please find the details about the transaction below:</p><p><p><strong>Product Name : </strong> '+orderData.productname+' Coins</p><p><strong>Mode Of Purchase : </strong>'+purchaseMode+'</p><p><strong>Transaction Id Number :</strong> '+orderData._id+'</p><p><strong>Quantity : </strong>'+orderData.coins+' of '+coinType+' Coins=$'+orderData.paidamount+'</p><p><strong>Status : </strong>'+orderData.status+'</p><br></p><br><p><strong>Regards</strong> <p>Team iCoinMarket </p><br></div><p style="color: #f90;">In case you are seeing this email by mistake,<br/>Please get the support informed! <br/><hr/>Drop an email at <b>support@icoinmarket.com </b> for instant replies.</p><hr/><table align="center" style="margin: 0 auto;padding-top:10px"><tr><td style="text-align: center; color:#000;font-size: 12px;" colspan="2"><p style="padding-bottom:5px">Do not have an account at <span style="color: #f90;"> iCoinMarket </span>?</p></td></tr><tr><td style="padding-left: 18px;text-align:center;" colspan="2"><a href="#"><img src="' + config.emailDomain + '/assets/images/learn-button.png" alt="learn"></a></td></tr><tr><td style="text-align: center;padding-top: 6px;padding-right: 21px;" colspan="2"> <a href="#"> <img src="' + config.emailDomain + '/assets/images/twitter.png" alt="twitter"></a> <a href="https://www.youtube.com/channel/UCjG1qbP7T8oqxPK7brWdbVw"><img src="' + config.emailDomain + '/assets/images/youtube.png" alt="youtube"></a> <a href="https://www.facebook.com/groups/icoinmarket/"> <img src="' + config.emailDomain + '/assets/images/facebook.png" alt="facebook"></a><a href="http://support.icoinmarket.com/"><img src="' + config.emailDomain + '/assets/images/live-chat-button.png" alt="live chat"></a></td></tr><tr><td style="text-align: center;color:#4A99BC;padding-bottom:13px;font-size:12px" colspan="2">Manage your subscriptions | <a href="' + config.emailDomain + '/terms-of-service" style="color: #4A99BC; text-decoration: blink;">Privacy Policy</a></td></tr><tr><td style="text-align: center; color:#FFFFFF;font-size:12px" colspan="2">&nbsp;</td></tr></table></div>';
        console.log("Message is : "+message);
      }
      else if(orderData.productid == 'silver' && orderData.paymode == 'ic') {
        mailSubject = 'iCoinMarket :: Transaction Cancel Notification';
        var message = '<div style="max-width: 600px; color: #f90; border-radius:10px; text-align: center; min-height: 300; font-family: arial; text-align: center; margin: auto; padding: 20px; overflow: hidden; box-shadow: 2px 2px 2px 2px #f2f2f2; border:1px solid #ccc;"> <img src="' + config.emailDomain + '/assets/images/91063c67.icmlogo.png" width=200><br /><br /><br /><h1 style="font-size:1.2em;font-weight:100;">'+mailSubject+'</h1><div style="text-align:left;color:black"><p style="text-transform:capitalize; padding-top:20px"><strong>Hello &nbsp;</strong>'+ userName+',</p><p style="padding-top:10px">Please find the details about your new purchase of Silver Packs below:</p><p><p><strong>Product Name : </strong> Silver Pack </p><p><strong>Mode Of Purchase : </strong>'+purchaseMode+'</p><p><strong>Transaction Id Number :</strong> '+orderData._id+'</p><p><strong>Quantity : </strong>'+orderData.coins+' Of Silver Packs=$'+orderData.paidamount+'</p><p><strong>Status : </strong>'+orderData.status+'</p><br></p><br><p><strong>Regards</strong> <p>Team iCoinMarket </p><br></div><p style="color: #f90;">In case you are seeing this email by mistake,<br />Please get the support informed! <br /><hr />Drop an email at <b>support@icoinmarket.com </b> for instant replies.</p><hr /><table align="center" style="margin: 0 auto;padding-top:10px"><tr><td style="text-align: center; color:#000;font-size: 12px;" colspan="2"><p style="padding-bottom:5px">Do not have an account at <span style="color: #f90;"> iCoinMarket </span>?</p></td></tr><tr><td style="padding-left: 18px;text-align:center;" colspan="2"><a href="#"><img src="' + config.emailDomain + '/assets/images/learn-button.png" alt="learn"></a></td></tr><tr><td style="text-align: center;padding-top: 6px;padding-right: 21px;" colspan="2"> <a href="#"> <img src="' + config.emailDomain + '/assets/images/twitter.png" alt="twitter"></a> <a href="https://www.youtube.com/channel/UCjG1qbP7T8oqxPK7brWdbVw"><img src="' + config.emailDomain + '/assets/images/youtube.png" alt="youtube"></a> <a href="https://www.facebook.com/groups/icoinmarket/"> <img src="' + config.emailDomain + '/assets/images/facebook.png" alt="facebook"></a><a href="http://support.icoinmarket.com/"><img src="' + config.emailDomain + '/assets/images/live-chat-button.png" alt="live chat"></a></td></tr><tr><td style="text-align: center;color:#4A99BC;padding-bottom:13px;font-size:12px" colspan="2">Manage your subscriptions | <a href="' + config.emailDomain + '/terms-of-service" style="color: #4A99BC; text-decoration: blink;">Privacy Policy</a></td></tr><tr><td style="text-align: center; color:#FFFFFF;font-size:12px" colspan="2">&nbsp;</td></tr></table></div>';
      }
      else if(orderData.productid != 'silver' && orderData.productid != 'gold') {
        mailSubject = 'iCoinMarket :: Transaction Cancel Notification';
        var message = '<div style="max-width: 600px; color: #f90; border-radius:10px; text-align: center; min-height: 300; font-family: arial; text-align: center; margin: auto; padding: 20px; overflow: hidden; box-shadow: 2px 2px 2px 2px #f2f2f2; border:1px solid #ccc;"> <img src="' + config.emailDomain + '/assets/images/91063c67.icmlogo.png" width=200><br/><br/><br/> <h1 style="font-size:1.2em;font-weight:100;">'+mailSubject+'</h1> <div style="text-align:left;color:black"> <p style="text-transform:capitalize; padding-top:20px"><strong>Hello &nbsp;</strong>'+ userName+',</p><p style="padding-top:10px">Please find the details about the transaction below:</p><p><p><strong>Product Name : </strong> '+orderData.productname+' </p><p><strong>Amount : </strong>'+orderData.paidamount+' $</p><p><strong>Mode Of Purchase : </strong> '+purchaseMode+' </p><br><p><strong>Transaction Id Number :</strong> '+orderData._id+'</p><p><strong>Status : </strong>'+orderData.status+'</p></p><br><p><strong>Regards</strong> <p>Team iCoinMarket </p><br></div><p style="color: #f90;">In case you are seeing this email by mistake,<br/>Please get the support informed! <br/><hr/>Drop an email at <b>support@icoinmarket.com </b> for instant replies.</p><hr/><table align="center" style="margin: 0 auto;padding-top:10px"><tr><td style="text-align: center; color:#000;font-size: 12px;" colspan="2"><p style="padding-bottom:5px">Do not have an account at <span style="color: #f90;"> iCoinMarket</span>?</p></td></tr><tr><td style="padding-left: 18px;text-align:center;" colspan="2"><a href="#"><img src="' + config.emailDomain + '/assets/images/learn-button.png" alt="learn"></a></td></tr><tr><td style="text-align: center;padding-top: 6px;padding-right: 21px;" colspan="2"> <a href="#"> <img src="' + config.emailDomain + '/assets/images/twitter.png" alt="twitter"></a> <a href="https://www.youtube.com/channel/UCjG1qbP7T8oqxPK7brWdbVw"><img src="' + config.emailDomain + '/assets/images/youtube.png" alt="youtube"></a> <a href="https://www.facebook.com/groups/icoinmarket/"> <img src="' + config.emailDomain + '/assets/images/facebook.png" alt="facebook"></a><a href="http://support.icoinmarket.com/"><img src="' + config.emailDomain + '/assets/images/live-chat-button.png" alt="live chat"></a></td></tr><tr><td style="text-align: center;color:#4A99BC;padding-bottom:13px;font-size:12px" colspan="2">Manage your subscriptions | <a href="' + config.emailDomain + '/terms-of-service" style="color: #4A99BC; text-decoration: blink;">Privacy Policy</a></td></tr><tr><td style="text-align: center; color:#FFFFFF;font-size:12px" colspan="2">&nbsp;</td></tr></table></div>';
      }

      _self.sendEmail(mailTo, config.email.mailFrom, mailSubject, message, null, function(error, info){
        if(error){
          console.log(error, message);
        }else{
          console.log('Message sent: ' + info.response, message);
          _self._createInternalMessage(mailSubject, message, orderData.userid, {
            id: config.sponsorId,
            email: '',
            name: config.sponsorUn,
          });
        };
      });
    },

    sendPurchaseApproveEmail: function(mailTo, userName, mailSubject, orderData) {
      var _self = this, message = '';
      var purchaseMode = ((orderData.paymode == 'ic') ? 'USD Wallet' : (orderData.paymode =='bitcoinBlockIO' ? 'bitcoin' : (orderData.paymode == 'litecoinBlockIO' ? 'litecoin' : orderData.paymode.toUpperCase()) ));

      if(orderData.productid == 'icoin' || orderData.productid == 'usd') {
        if(orderData.productid == 'icoin') {
            mailSubject = 'iCoinMarket :: iCoinMarket coins Purchase Approval Notification';
        } else if(orderData.productid == 'usd') {
            mailSubject = 'iCoinMarket :: USD Purchase Approval Notification';
        }
        var message ='<div style="max-width: 600px; color: #f90; border-radius:10px; text-align: center; min-height: 300; font-family: arial; text-align: center; margin: auto; padding: 20px; overflow: hidden; box-shadow: 2px 2px 2px 2px #f2f2f2; border:1px solid #ccc;"> <img src="' + config.emailDomain + '/assets/images/91063c67.icmlogo.png" width=200><br/><br/><br/> <h1 style="font-size:1.2em;font-weight:100;">'+mailSubject+'</h1> <div style="text-align:left;color:black"> <p style="text-transform:capitalize; padding-top:20px"><strong>Hello &nbsp;</strong>'+ userName+',</p><p style="padding-top:10px">Your purchase transaction has been approved by iCoinMarket. Please find the details about your new purchase below:</p><p><p><strong>Product Name : </strong> '+orderData.productname+' </p><p><strong>Amount : </strong>'+orderData.paidamount+' click</p><p><strong>Mode Of Purchase : </strong> '+purchaseMode+' </p><br></p><br><p><strong>Regards</strong> <p>Team iCoinMarket </p><br></div><p style="color: #f90;">In case you are seeing this email by mistake,<br/>Please get the support informed! <br/><hr/>Drop an email at <b>support@icoinmarket.com </b> for instant replies.</p><hr/><table align="center" style="margin: 0 auto;padding-top:10px"><tr><td style="text-align: center; color:#000;font-size: 12px;" colspan="2"><p style="padding-bottom:5px">Do not have an account at <span style="color: #f90;"> iCoinMarket</span>?</p></td></tr><tr><td style="padding-left: 18px;text-align:center;" colspan="2"><a href="#"><img src="' + config.emailDomain + '/assets/images/learn-button.png" alt="learn"></a></td></tr><tr><td style="text-align: center;padding-top: 6px;padding-right: 21px;" colspan="2"> <a href="#"> <img src="' + config.emailDomain + '/assets/images/twitter.png" alt="twitter"></a> <a href="https://www.youtube.com/channel/UCjG1qbP7T8oqxPK7brWdbVw"><img src="' + config.emailDomain + '/assets/images/youtube.png" alt="youtube"></a> <a href="https://www.facebook.com/groups/icoinmarket/"> <img src="' + config.emailDomain + '/assets/images/facebook.png" alt="facebook"></a><a href="http://support.icoinmarket.com/"><img src="' + config.emailDomain + '/assets/images/live-chat-button.png" alt="live chat"></a></td></tr><tr><td style="text-align: center;color:#4A99BC;padding-bottom:13px;font-size:12px" colspan="2">Manage your subscriptions | <a href="' + config.emailDomain + '/terms-of-service" style="color: #4A99BC; text-decoration: blink;">Privacy Policy</a></td></tr><tr><td style="text-align: center; color:#FFFFFF;font-size:12px" colspan="2">&nbsp;</td></tr></table></div>';
      }
      _self.sendEmail(mailTo, config.email.mailFrom, mailSubject, message, null, function(error, info){
        if(error){
          console.log(error, message);
        }else{
          console.log('Message sent: ' + info.response, message);
          _self._createInternalMessage(mailSubject, message, orderData.userid, {
            id: config.sponsorId,
            email: '',
            name: config.sponsorUn,
          });
        };
      });
    },

    sendUSDTransferEmail: function(mailTo, userName, data) {
      var _self = this, message = '';
      var mailSubject = 'iCoinMarket :: USD Transfer Notification';
      var message = '<div style="max-width: 600px; color: #f90; border-radius:10px; text-align: center; min-height: 300; font-family: arial; text-align: center; margin: auto; padding: 20px; overflow: hidden; box-shadow: 2px 2px 2px 2px #f2f2f2; border:1px solid #ccc;"> <img src="' + config.emailDomain + '/assets/images/91063c67.icmlogo.png" width=200><br/><br/><br/> <h1 style="font-size:1.2em;font-weight:100;">'+mailSubject+'</h1> <div style="text-align:left;color:black"> <p style="text-transform:capitalize; padding-top:20px"><strong>Bingo !! <br></p><p style="padding-top:10px">You have successfully transferred '+data.usdAmount+' USD to '+data.transferredTo+'.</p><p>Thanks for helping your friend.</p><br><p>Please let support desk know if you are finding this email by mistake !</p><br><p><strong>Regards</strong> <p>Team iCoinMarket </p><br></div><p style="color: #f90;">In case you are seeing this email by mistake,<br/>Please get the support informed! <br/><hr/>Drop an email at <b>support@icoinmarket.com </b> for instant replies.</p><hr/><table align="center" style="margin: 0 auto;padding-top:10px"><tr><td style="text-align: center; color:#000;font-size: 12px;" colspan="2"><p style="padding-bottom:5px">Do not have an account at <span style="color: #f90;"> iCoinMarket</span>?</p></td></tr><tr><td style="padding-left: 18px;text-align:center;" colspan="2"><a href="#"><img src="' + config.emailDomain + '/assets/images/learn-button.png" alt="learn"></a></td></tr><tr><td style="text-align: center;padding-top: 6px;padding-right: 21px;" colspan="2"> <a href="#"> <img src="' + config.emailDomain + '/assets/images/twitter.png" alt="twitter"></a> <a href="https://www.youtube.com/channel/UCjG1qbP7T8oqxPK7brWdbVw"><img src="' + config.emailDomain + '/assets/images/youtube.png" alt="youtube"></a> <a href="https://www.facebook.com/groups/icoinmarket/"> <img src="' + config.emailDomain + '/assets/images/facebook.png" alt="facebook"></a><a href="http://support.icoinmarket.com/"><img src="' + config.emailDomain + '/assets/images/live-chat-button.png" alt="live chat"></a></td></tr><tr><td style="text-align: center;color:#4A99BC;padding-bottom:13px;font-size:12px" colspan="2">Manage your subscriptions | <a href="' + config.emailDomain + '/terms-of-service" style="color: #4A99BC; text-decoration: blink;">Privacy Policy</a></td></tr><tr><td style="text-align: center; color:#FFFFFF;font-size:12px" colspan="2">&nbsp;</td></tr></table></div>';
      _self.sendEmail(mailTo, config.email.mailFrom, mailSubject, message, null, function(error, info){
        if(error){
          console.log(error, message);
        }else{
          console.log('Message sent: ' + info.response, message);
          _self._createInternalMessage(mailSubject, message, data.transferredTo, {
            id: config.sponsorId,
            email: '',
            name: config.sponsorUn,
          });
        };
      });
    },

    sendOtpEmail: function(mailTo, userName, otp, type) {
      var _self = this;
      var subject = 'OTP for '+ type;
      var message = '<div style="max-width: 600px; color: #f90; border-radius:10px; text-align: center; min-height: 300; font-family: arial; text-align: center; margin: auto; padding: 20px; overflow: hidden; box-shadow: 2px 2px 2px 2px #f2f2f2; border:1px solid #ccc;"> <img src="' + config.emailDomain + '/assets/images/91063c67.icmlogo.png" width=200><br/><br/><br/> <h1 style="font-size:1.2em;font-weight:100;">'+subject+'</h1> <div style="text-align:left;color:black"> <p>Hi! '+userName+',</p><br><p>Your requested OTP for '+type+' is '+otp+'.</p><p>This OTP is valid only for the next '+config.apiConstants.OTP_TIME_LIMIT+' minutes</p><p><br>You have recieved this mail because someone or you may have requested a transaction on iCoinMarket. If it is not you who requested this, please contact iCoinMarket support</p></div><p style="color: #f90;"><br/><hr/>Drop an email at <b>support@icoinmarket.com </b> for instant replies.</p><hr/><table align="center" style="margin: 0 auto;padding-top:10px"><tr><td style="text-align: center; color:#000;font-size: 12px;" colspan="2"><p style="padding-bottom:5px">Do not have an account at <span style="color: #f90;"> iCoinMarket</span>?</p></td></tr><tr><td style="padding-left: 18px;text-align:center;" colspan="2"><a href="#"><img src="' + config.emailDomain + '/assets/images/learn-button.png" alt="learn"></a></td></tr><tr><td style="text-align: center;padding-top: 6px;padding-right: 21px;" colspan="2"> <a href="#"> <img src="' + config.emailDomain + '/assets/images/twitter.png" alt="twitter"></a> <a href="https://www.youtube.com/channel/UCjG1qbP7T8oqxPK7brWdbVw"><img src="' + config.emailDomain + '/assets/images/youtube.png" alt="youtube"></a> <a href="https://www.facebook.com/groups/icoinmarket/"> <img src="' + config.emailDomain + '/assets/images/facebook.png" alt="facebook"></a><a href="http://support.icoinmarket.com/"><img src="' + config.emailDomain + '/assets/images/live-chat-button.png" alt="live chat"></a></td></tr><tr><td style="text-align: center;color:#4A99BC;padding-bottom:13px;font-size:12px" colspan="2">Manage your subscriptions | <a href="' + config.emailDomain + '/terms-of-service" style="color: #4A99BC; text-decoration: blink;">Privacy Policy</a></td></tr><tr><td style="text-align: center; color:#FFFFFF;font-size:12px" colspan="2">&nbsp;</td></tr></table></div>';
      _self.sendEmail(mailTo, config.email.mailFrom, subject, message, null, function(error, info){
        if(error){
          console.log(error, message);
        }else{
          console.log('Message sent: ' + info.response, message);
        };
      });
    },

    priceUpdateAlertToAdmin: function(mailTo, currency, rate) {
      var _self = this;
      var subject = 'Price increase for '+ currency;
      var message = '<div style="max-width: 600px; color: #f90; border-radius:10px; text-align: center; min-height: 300; font-family: arial; text-align: center; margin: auto; padding: 20px; overflow: hidden; box-shadow: 2px 2px 2px 2px #f2f2f2; border:1px solid #ccc;"> <img src="' + config.emailDomain + '/assets/images/91063c67.icmlogo.png" width=200><br/><br/><br/><h1 style="font-size:1.2em;font-weight:100;">'+subject+'</h1><div style="text-align:left;color:black"><p>Hi! Admin,</p><br><p>'+currency+' prices are increased to '+rate+', plesae visit iCoinMarket and have a look.</p><br><p><strong>Regards</strong> <p>Team iCoinMarket </p></div><p style="color: #f90;">In case you are seeing this email by mistake,<br/>Please get the support informed! <br/><hr/>Drop an email at <b>support@icoinmarket.com </b> for instant replies.</p><hr/><table align="center" style="margin: 0 auto;padding-top:10px"><tr><td style="text-align: center; color:#000;font-size: 12px;" colspan="2"><p style="padding-bottom:5px">Do not have an account at <span style="color: #f90;"> iCoinMarket</span>?</p></td></tr><tr><td style="padding-left: 18px;text-align:center;" colspan="2"><a href="#"><img src="' + config.emailDomain + '/assets/images/learn-button.png" alt="learn"></a></td></tr><tr><td style="text-align: center;padding-top: 6px;padding-right: 21px;" colspan="2"> <a href="#"> <img src="' + config.emailDomain + '/assets/images/twitter.png" alt="twitter"></a> <a href="https://www.youtube.com/channel/UCjG1qbP7T8oqxPK7brWdbVw"><img src="' + config.emailDomain + '/assets/images/youtube.png" alt="youtube"></a> <a href="https://www.facebook.com/groups/icoinmarket/"> <img src="' + config.emailDomain + '/assets/images/facebook.png" alt="facebook"></a><a href="http://support.icoinmarket.com/"><img src="' + config.emailDomain + '/assets/images/live-chat-button.png" alt="live chat"></a></td></tr><tr><td style="text-align: center;color:#4A99BC;padding-bottom:13px;font-size:12px" colspan="2">Manage your subscriptions | <a href="' + config.emailDomain + '/terms-of-service" style="color: #4A99BC; text-decoration: blink;">Privacy Policy</a></td></tr><tr><td style="text-align: center; color:#FFFFFF;font-size:12px" colspan="2">&nbsp;</td></tr></table></div>';
      _self.sendEmail(mailTo, config.email.mailFrom, subject, message, null, function(error, info){
        if(error){
          console.log(error, message);
        }else{
          console.log('Message sent: ' + info.response, message);
        };
      });
    },

    sendExcelToClient : function(fileObj, user, callback) {
      var _self = this;
      var subject = "Signup list for 24 hours";
      var message = '<div style="max-width: 600px; color: #f90; border-radius:10px; text-align: center; min-height: 300; font-family: arial; text-align: center; margin: auto; padding: 20px; overflow: hidden; box-shadow: 2px 2px 2px 2px #f2f2f2; border:1px solid #ccc;"> <img src="' + config.emailDomain + '/assets/images/91063c67.icmlogo.png" width=200><br/><br/><br/><h1 style="font-size:1.2em;font-weight:100;">'+subject+'</h1><div style="text-align:left;color:black"><p> Hi '+user.name+', </p><br><p> We have sent you details of your downline signups in the past 24 hours. Please find the excel sheet attached herewith. <br></p><p>Please contact iCoinMarket support in case of any issues</p><br><p><strong>Regards</strong> <p>Team iCoinMarket </p></div><p style="color:#f90;">In case you are seeing this email by mistake,<br/>Please get the support informed! <br/><hr/>Drop an email at <b>support@icoinmarket.com </b> for instant replies.</p><hr/><table align="center" style="margin: 0 auto;padding-top:10px"><tr><td style="text-align: center; color:#000;font-size: 12px;" colspan="2"><p style="padding-bottom:5px">Do not have an account at <span style="color: #f90;"> iCoinMarket</span>?</p></td></tr><tr><td style="padding-left: 18px;text-align:center;" colspan="2"><a href="#"><img src="' + config.emailDomain + '/assets/images/learn-button.png" alt="learn"></a></td></tr><tr><td style="text-align: center;padding-top: 6px;padding-right: 21px;" colspan="2"> <a href="#"> <img src="' + config.emailDomain + '/assets/images/twitter.png" alt="twitter"></a> <a href="https://www.youtube.com/channel/UCjG1qbP7T8oqxPK7brWdbVw"><img src="' + config.emailDomain + '/assets/images/youtube.png" alt="youtube"></a> <a href="https://www.facebook.com/groups/icoinmarket/"> <img src="' + config.emailDomain + '/assets/images/facebook.png" alt="facebook"></a><a href="http://support.icoinmarket.com/"><img src="' + config.emailDomain + '/assets/images/live-chat-button.png" alt="live chat"></a></td></tr><tr><td style="text-align: center;color:#4A99BC;padding-bottom:13px;font-size:12px" colspan="2">Manage your subscriptions | <a href="' + config.emailDomain + '/terms-of-service" style="color: #4A99BC; text-decoration: blink;">Privacy Policy</a></td></tr><tr><td style="text-align: center; color:#FFFFFF;font-size:12px" colspan="2">&nbsp;</td></tr></table></div>';
      _self.sendEmail(user.email, config.email.mailFrom, subject, message, fileObj, function(err, info) {
        console.log(err, info);
        if(err){
          console.log("Error in sending email to client");
          callback(false);
          //return false;
        } else {
          callback(true);
          //return true;
        }
      })
    },

    sendPasswordMailToBusinessUsers : function(data) {
      var _self = this;
      var subject = "iCoinMarket :: Added as "+ data.role;
      var message = '<div style="max-width: 600px; color: #f90; border-radius:10px; text-align: center; min-height: 300; font-family: arial; text-align: center; margin: auto; padding: 20px; overflow: hidden; box-shadow: 2px 2px 2px 2px #f2f2f2; border:1px solid #ccc;"> <img src="' + config.emailDomain + '/assets/images/91063c67.icmlogo.png" width=200><br/><br/><br/><h1 style="font-size:1.2em;font-weight:100;">'+subject+'</h1><div style="text-align:left;color:black"><p> Hi '+ data.name +', </p><br><br>Congratulations on being registered with iCoinMarket<br><br>You have been successfully added as '+ data.role +'.<br>Please <a href='+ data.link +' style="text-decoration:none">click Here</a> to set password for your account or copy/paste below url to your browser\'s address bar to set your account password.<br><br><a href='+data.link+'>'+data.link+'</a></p><br><p><strong>Regards</strong> <p>Team iCoinMarket </p></div><p style="color: #f90;">In case you are seeing this email by mistake,<br/>Please get the support informed! <br/><hr/>Drop an email at <b>support@icoinmarket.com </b> for instant replies.</p><hr/><table align="center" style="margin: 0 auto;padding-top:10px"><tr><td style="text-align: center; color:#000;font-size: 12px;" colspan="2"><p style="padding-bottom:5px">Do not have an account at <span style="color: #f90;"> iCoinMarket</span>?</p></td></tr><tr><td style="padding-left: 18px;text-align:center;" colspan="2"><a href="#"><img src="' + config.emailDomain + '/assets/images/learn-button.png" alt="learn"></a></td></tr><tr><td style="text-align: center;padding-top: 6px;padding-right: 21px;" colspan="2"> <a href="#"> <img src="' + config.emailDomain + '/assets/images/twitter.png" alt="twitter"></a> <a href="https://www.youtube.com/channel/UCjG1qbP7T8oqxPK7brWdbVw"><img src="' + config.emailDomain + '/assets/images/youtube.png" alt="youtube"></a> <a href="https://www.facebook.com/groups/icoinmarket/"> <img src="' + config.emailDomain + '/assets/images/facebook.png" alt="facebook"></a><a href="http://support.icoinmarket.com/"><img src="' + config.emailDomain + '/assets/images/live-chat-button.png" alt="live chat"></a></td></tr><tr><td style="text-align: center;color:#4A99BC;padding-bottom:13px;font-size:12px" colspan="2">Manage your subscriptions | <a href="' + config.emailDomain + '/terms-of-service" style="color: #4A99BC; text-decoration: blink;">Privacy Policy</a></td></tr><tr><td style="text-align: center; color:#FFFFFF;font-size:12px" colspan="2">&nbsp;</td></tr></table></div>';
      _self.sendEmail(data.mailTo, config.email.mailFrom, subject, message, null, function(error, info){
        if(error){
          console.log(error, message);
        }else{
          console.log('Message sent: ' + info.response, message);
        };
      });
    },

    sendPasswordMailToPortfolioManagers : function(data) {
      var _self = this;
      var subject = "iCoinMarket :: Added as "+ data.role;
      var message = '<div style="max-width: 600px; color: #f90; border-radius:10px; text-align: center; min-height: 300; font-family: arial; text-align: center; margin: auto; padding: 20px; overflow: hidden; box-shadow: 2px 2px 2px 2px #f2f2f2; border:1px solid #ccc;"> <img src="' + config.emailDomain + '/assets/images/91063c67.icmlogo.png" width=200><br/><br/><br/><h1 style="font-size:1.2em;font-weight:100;">'+subject+'</h1><div style="text-align:left;color:black"><p> Hi '+ data.name +', </p><br><br>Congratulations on being registered with iCoinMarket <br><br>You have been successfully added as '+ data.role +'.<br>Please <a href='+ data.link +' style="text-decoration:none">click Here</a> to set password for your account or copy/paste below url to your browser\'s address bar to set your account password.<br><br><a href='+data.link+'>'+data.link+'</a></p><br><p> <strong>Team iCoinMarket</strong><strong>Regards</strong> <p>Team iCoinMarket </p></div><p style="color: #f90;">In case you are seeing this email by mistake,<br/>Please get the support informed! <br/><hr/>Drop an email at <b>support@icoinmarket.com </b> for instant replies.</p><hr/><table align="center" style="margin: 0 auto;padding-top:10px"><tr><td style="text-align: center; color:#000;font-size: 12px;" colspan="2"><p style="padding-bottom:5px">Do not have an account at <span style="color: #f90;"> iCoinMarket</span>?</p></td></tr><tr><td style="padding-left: 18px;text-align:center;" colspan="2"><a href="#"><img src="' + config.emailDomain + '/assets/images/learn-button.png" alt="learn"></a></td></tr><tr><td style="text-align: center;padding-top: 6px;padding-right: 21px;" colspan="2"> <a href="#"> <img src="' + config.emailDomain + '/assets/images/twitter.png" alt="twitter"></a> <a href="https://www.youtube.com/channel/UCjG1qbP7T8oqxPK7brWdbVw"><img src="' + config.emailDomain + '/assets/images/youtube.png" alt="youtube"></a> <a href="https://www.facebook.com/groups/icoinmarket/"> <img src="' + config.emailDomain + '/assets/images/facebook.png" alt="facebook"></a><a href="http://support.icoinmarket.com/"><img src="' + config.emailDomain + '/assets/images/live-chat-button.png" alt="live chat"></a></td></tr><tr><td style="text-align: center;color:#4A99BC;padding-bottom:13px;font-size:12px" colspan="2">Manage your subscriptions | <a href="' + config.emailDomain + '/terms-of-service" style="color: #4A99BC; text-decoration: blink;">Privacy Policy</a></td></tr><tr><td style="text-align: center; color:#FFFFFF;font-size:12px" colspan="2">&nbsp;</td></tr></table></div>';
      _self.sendEmail(data.mailTo, config.email.mailFrom, subject, message, null, function(error, info){
        if(error){
          console.log(error, message);
        }else{
          console.log('Message sent: ' + info.response, message);
        };
      });
    },

     sendWrongNumberCallStatusMail : function(data) {
      var _self = this;
      var subject = "iCoinMarket :: Call Status - Wrong number";
      var message = '<div style="max-width: 600px; color: #f90; border-radius:10px; text-align: center; min-height: 300; font-family: arial; text-align: center; margin: auto; padding: 20px; overflow: hidden; box-shadow: 2px 2px 2px 2px #f2f2f2; border:1px solid #ccc;"> <img src="' + config.emailDomain + '/assets/images/91063c67.icmlogo.png" width=200><br/><br/><br/><h1 style="font-size:1.2em;font-weight:100;">'+subject+'</h1><div style="text-align:left;color:black"><p> Dear '+ data.name +', </p><br><br>Our trade experts tried to contact  you, unfortunately were unable to reach  as the number was not correct .We request you to kindly provide us with your best and reachable contact to get started.<br/><br/><br/><strong>Thank You</strong><p>iCoinMarket Team </p></div><p style="color: #f90;">In case you are seeing this email by mistake,<br/>Please get the support informed! <br/><hr/>Drop an email at <b>support@icoinmarket.com </b> for instant replies.</p><hr/><table align="center" style="margin: 0 auto;padding-top:10px"><tr><td style="text-align: center; color:#000;font-size: 12px;" colspan="2"><p style="padding-bottom:5px">Do not have an account at <span style="color: #f90;"> iCoinMarket</span>?</p></td></tr><tr><td style="padding-left: 18px;text-align:center;" colspan="2"><a href="#"><img src="' + config.emailDomain + '/assets/images/learn-button.png" alt="learn"></a></td></tr><tr><td style="text-align: center;padding-top: 6px;padding-right: 21px;" colspan="2"> <a href="#"> <img src="' + config.emailDomain + '/assets/images/twitter.png" alt="twitter"></a> <a href="https://www.youtube.com/channel/UCjG1qbP7T8oqxPK7brWdbVw"><img src="' + config.emailDomain + '/assets/images/youtube.png" alt="youtube"></a> <a href="https://www.facebook.com/groups/icoinmarket/"> <img src="' + config.emailDomain + '/assets/images/facebook.png" alt="facebook"></a><a href="http://support.icoinmarket.com/"><img src="' + config.emailDomain + '/assets/images/live-chat-button.png" alt="live chat"></a></td></tr><tr><td style="text-align: center;color:#4A99BC;padding-bottom:13px;font-size:12px" colspan="2">Manage your subscriptions | <a href="' + config.emailDomain + '/terms-of-service" style="color: #4A99BC; text-decoration: blink;">Privacy Policy</a></td></tr><tr><td style="text-align: center; color:#FFFFFF;font-size:12px" colspan="2">&nbsp;</td></tr></table></div>';
      _self.sendEmail(data.mailTo, config.email.mailFrom, subject, message, null, function(error, info){
        if(error){
          console.log(error, message);
        }else{
          console.log('Message sent: ' + info.response, message);
        };
      });
    },

     sendUnavailableCallStatusMail : function(data) {
      var _self = this;
      var subject = "iCoinMarket :: Call Status -  Unavailable ";
      var message = '<div style="max-width: 600px; color: #f90; border-radius:10px; text-align: center; min-height: 300; font-family: arial; text-align: center; margin: auto; padding: 20px; overflow: hidden; box-shadow: 2px 2px 2px 2px #f2f2f2; border:1px solid #ccc;"> <img src="' + config.emailDomain + '/assets/images/91063c67.icmlogo.png" width=200><br/><br/><br/><h1 style="font-size:1.2em;font-weight:100;">'+subject+'</h1><div style="text-align:left;color:black"><p> Dear '+ data.name +', </p><br><br>Our trade experts tried to contact  you,but  unfortunately were unable to reach  as the number was unavailable .We request you to kindly provide us with your best and reachable contact to get started.<br/><br/><br/><strong>Thank You</strong><p>iCoinMarket Team </p></div><p style="color: #f90;">In case you are seeing this email by mistake,<br/>Please get the support informed! <br/><hr/>Drop an email at <b>support@icoinmarket.com </b> for instant replies.</p><hr/><table align="center" style="margin: 0 auto;padding-top:10px"><tr><td style="text-align: center; color:#000;font-size: 12px;" colspan="2"><p style="padding-bottom:5px">Do not have an account at <span style="color: #f90;"> iCoinMarket</span>?</p></td></tr><tr><td style="padding-left: 18px;text-align:center;" colspan="2"><a href="#"><img src="' + config.emailDomain + '/assets/images/learn-button.png" alt="learn"></a></td></tr><tr><td style="text-align: center;padding-top: 6px;padding-right: 21px;" colspan="2"> <a href="#"> <img src="' + config.emailDomain + '/assets/images/twitter.png" alt="twitter"></a> <a href="https://www.youtube.com/channel/UCjG1qbP7T8oqxPK7brWdbVw"><img src="' + config.emailDomain + '/assets/images/youtube.png" alt="youtube"></a> <a href="https://www.facebook.com/groups/icoinmarket/"> <img src="' + config.emailDomain + '/assets/images/facebook.png" alt="facebook"></a><a href="http://support.icoinmarket.com/"><img src="' + config.emailDomain + '/assets/images/live-chat-button.png" alt="live chat"></a></td></tr><tr><td style="text-align: center;color:#4A99BC;padding-bottom:13px;font-size:12px" colspan="2">Manage your subscriptions | <a href="' + config.emailDomain + '/terms-of-service" style="color: #4A99BC; text-decoration: blink;">Privacy Policy</a></td></tr><tr><td style="text-align: center; color:#FFFFFF;font-size:12px" colspan="2">&nbsp;</td></tr></table></div>';
      _self.sendEmail(data.mailTo, config.email.mailFrom, subject, message, null, function(error, info){
        if(error){
          console.log(error, message);
        }else{
          console.log('Message sent: ' + info.response, message);
        };
      });
    },

     sendPlaceCommitmentMail : function(data) {
      var _self = this;
      var subject = "iCoinMarket :: Commitment Placed for " + data.packagename + " Plan";
      var message = '<div style="max-width: 600px; color: #f90; border-radius:10px; text-align: center; min-height: 300; font-family: arial; text-align: center; margin: auto; padding: 20px; overflow: hidden; box-shadow: 2px 2px 2px 2px #f2f2f2; border:1px solid #ccc;"> <img src="' + config.emailDomain + '/assets/images/91063c67.icmlogo.png" width=200><br/><br/><br/><h1 style="font-size:1.2em;font-weight:100;">'+subject+'</h1><div style="text-align:left;color:black"><p> Dear '+ data.name +', </p><br><br>Thanks for going ahead with '+ data.packagename +' plan. Your trade of $ '+ data.amount +' is locked with the system for '+ data.maturityPeriod +' months! You can track your daily growth by logging directly to your dashboard.<br />With ICM, you can make profits upto 300%! Our support is just a click away. Ask anything, anytime!<br/><br/><br/><strong>Thank You</strong><p>iCoinMarket Team </p></div><p style="color: #f90;">In case you are seeing this email by mistake,<br/>Please get the support informed! <br/><hr/>Drop an email at <b>support@icoinmarket.com </b> for instant replies.</p><hr/><table align="center" style="margin: 0 auto;padding-top:10px"><tr><td style="text-align: center; color:#000;font-size: 12px;" colspan="2"><p style="padding-bottom:5px">Do not have an account at <span style="color: #f90;"> iCoinMarket</span>?</p></td></tr><tr><td style="padding-left: 18px;text-align:center;" colspan="2"><a href="#"><img src="' + config.emailDomain + '/assets/images/learn-button.png" alt="learn"></a></td></tr><tr><td style="text-align: center;padding-top: 6px;padding-right: 21px;" colspan="2"> <a href="#"> <img src="' + config.emailDomain + '/assets/images/twitter.png" alt="twitter"></a> <a href="https://www.youtube.com/channel/UCjG1qbP7T8oqxPK7brWdbVw"><img src="' + config.emailDomain + '/assets/images/youtube.png" alt="youtube"></a> <a href="https://www.facebook.com/groups/icoinmarket/"> <img src="' + config.emailDomain + '/assets/images/facebook.png" alt="facebook"></a><a href="http://support.icoinmarket.com/"><img src="' + config.emailDomain + '/assets/images/live-chat-button.png" alt="live chat"></a></td></tr><tr><td style="text-align: center;color:#4A99BC;padding-bottom:13px;font-size:12px" colspan="2">Manage your subscriptions | <a href="' + config.emailDomain + '/terms-of-service" style="color: #4A99BC; text-decoration: blink;">Privacy Policy</a></td></tr><tr><td style="text-align: center; color:#FFFFFF;font-size:12px" colspan="2">&nbsp;</td></tr></table></div>';
      _self.sendEmail(data.mailTo, config.email.mailFrom, subject, message, null, function(error, info){
        if(error){
          console.log(error, message);
        }else{
          console.log('Message sent: ' + info.response, message);
        };
      });
    },

    cancelSignupBonusTransferMail : function(mailTo,descriptions) {
      var _self = this;
      var subject = "iCoinMarket :: Signup bonus transfer reversed By Admin";
      var mailbody = 'As per the iCoinMarket policies, Signup Bonus cannot be used for Fund Transfer. It can be used for trading purposes only. Hence We are reversing the transaction.';
      var message = '<div style="max-width: 600px; color: #f90; border-radius:10px; text-align: center; min-height: 300; font-family: arial; text-align: center; margin: auto; padding: 20px; overflow: hidden; box-shadow: 2px 2px 2px 2px #f2f2f2; border:1px solid #ccc;"> <img src="' + config.emailDomain + '/assets/images/91063c67.icmlogo.png" width=200><br/><br/><br/><h1 style="font-size:1.2em;font-weight:100;">'+subject+'</h1><div style="text-align:left;color:black"><p> Dear User, </p><br><br>'+mailbody+'<br/><br/><br/><strong>Thank You</strong><p>iCoinMarket Team </p></div><p style="color: #f90;">In case you are seeing this email by mistake,<br/>Please get the support informed! <br/><hr/>Drop an email at <b>support@icoinmarket.com </b> for instant replies.</p><hr/><table align="center" style="margin: 0 auto;padding-top:10px"><tr><td style="text-align: center; color:#000;font-size: 12px;" colspan="2"><p style="padding-bottom:5px">Do not have an account at <span style="color: #f90;"> iCoinMarket</span>?</p></td></tr><tr><td style="padding-left: 18px;text-align:center;" colspan="2"><a href="#"><img src="' + config.emailDomain + '/assets/images/learn-button.png" alt="learn"></a></td></tr><tr><td style="text-align: center;padding-top: 6px;padding-right: 21px;" colspan="2"> <a href="#"> <img src="' + config.emailDomain + '/assets/images/twitter.png" alt="twitter"></a> <a href="https://www.youtube.com/channel/UCjG1qbP7T8oqxPK7brWdbVw"><img src="' + config.emailDomain + '/assets/images/youtube.png" alt="youtube"></a> <a href="https://www.facebook.com/groups/icoinmarket/"> <img src="' + config.emailDomain + '/assets/images/facebook.png" alt="facebook"></a><a href="http://support.icoinmarket.com/"><img src="' + config.emailDomain + '/assets/images/live-chat-button.png" alt="live chat"></a></td></tr><tr><td style="text-align: center;color:#4A99BC;padding-bottom:13px;font-size:12px" colspan="2">Manage your subscriptions | <a href="' + config.emailDomain + '/terms-of-service" style="color: #4A99BC; text-decoration: blink;">Privacy Policy</a></td></tr><tr><td style="text-align: center; color:#FFFFFF;font-size:12px" colspan="2">&nbsp;</td></tr></table></div>';
      _self.sendEmail(mailTo, config.email.mailFrom, subject, message, null, function(error, info){
        if(error){
          console.log(error, message);
        }else{
          console.log('Message sent: ' + info.response, message);
        };
      });
    },

    cancelCommitmentEmail : function(mailTo,commitmentTime,descriptions) {
      var _self = this;
      if(commitmentTime){
        var commitmentTime = commitmentTime.split('T')[0];
      }      
      var subject = "iCoinMarket :: Commitment reversed By Admin";
      var mailbody = 'As per the iCoinMarket policies, the commitment placed on '+commitmentTime+' (as per UTC Time) was not acceptable. Hence we are reversing the commitment. The commitment amount will be added to your wallet.</br> Admin Comments: '+descriptions;
      var message = '<div style="max-width: 600px; color: #f90; border-radius:10px; text-align: center; min-height: 300; font-family: arial; text-align: center; margin: auto; padding: 20px; overflow: hidden; box-shadow: 2px 2px 2px 2px #f2f2f2; border:1px solid #ccc;"> <img src="' + config.emailDomain + '/assets/images/91063c67.icmlogo.png" width=200><br/><br/><br/><h1 style="font-size:1.2em;font-weight:100;">'+subject+'</h1><div style="text-align:left;color:black"><p> Dear User, </p><br><br>'+mailbody+'<br/><br/><br/><strong>Thank You</strong><p>iCoinMarket Team </p></div><p style="color: #f90;">In case you are seeing this email by mistake,<br/>Please get the support informed! <br/><hr/>Drop an email at <b>support@icoinmarket.com </b> for instant replies.</p><hr/><table align="center" style="margin: 0 auto;padding-top:10px"><tr><td style="text-align: center; color:#000;font-size: 12px;" colspan="2"><p style="padding-bottom:5px">Do not have an account at <span style="color: #f90;"> iCoinMarket</span>?</p></td></tr><tr><td style="padding-left: 18px;text-align:center;" colspan="2"><a href="#"><img src="' + config.emailDomain + '/assets/images/learn-button.png" alt="learn"></a></td></tr><tr><td style="text-align: center;padding-top: 6px;padding-right: 21px;" colspan="2"> <a href="#"> <img src="' + config.emailDomain + '/assets/images/twitter.png" alt="twitter"></a> <a href="https://www.youtube.com/channel/UCjG1qbP7T8oqxPK7brWdbVw"><img src="' + config.emailDomain + '/assets/images/youtube.png" alt="youtube"></a> <a href="https://www.facebook.com/groups/icoinmarket/"> <img src="' + config.emailDomain + '/assets/images/facebook.png" alt="facebook"></a><a href="http://support.icoinmarket.com/"><img src="' + config.emailDomain + '/assets/images/live-chat-button.png" alt="live chat"></a></td></tr><tr><td style="text-align: center;color:#4A99BC;padding-bottom:13px;font-size:12px" colspan="2">Manage your subscriptions | <a href="' + config.emailDomain + '/terms-of-service" style="color: #4A99BC; text-decoration: blink;">Privacy Policy</a></td></tr><tr><td style="text-align: center; color:#FFFFFF;font-size:12px" colspan="2">&nbsp;</td></tr></table></div>';
      _self.sendEmail(mailTo, config.email.mailFrom, subject, message, null, function(error, info){
        if(error){
          console.log(error, message);
        }else{
          console.log('Message sent: ' + info.response, message);
        };
      });
    },

    withdrawCommitmentEmail : function(data, totalAmount, usdAmount, adscash) {
      var _self = this;
      var subject = "iCoinMarket :: Commitment Withdrawal (Mature)";
      var message = '<div style="max-width: 600px; color: #f90; border-radius:10px; text-align: center; min-height: 300; font-family: arial; text-align: center; margin: auto; padding: 20px; overflow: hidden; box-shadow: 2px 2px 2px 2px #f2f2f2; border:1px solid #ccc;"> <img src="' + config.emailDomain + '/assets/images/91063c67.icmlogo.png" width=200><br/><br/><br/><h1 style="font-size:1.2em;font-weight:100;">'+subject+'</h1><div style="text-align:left;color:black"><p>Dear Customer,<br /><br />Your withdrawal request has been approved from our end. The Withdrawal has been processed to your registered Wallet.<br /><br /><strong>Amount Withdrawn:</strong> '+totalAmount+'$<br /><strong>USD :</strong> '+usdAmount+'$<br /><strong>AdsCash :</strong> '+adscash+'  <br /><br />Keep growing with ICM and generate returns up to 300%!<br /><br /><br /><strong>Thank You</strong><p>iCoinMarket Team </p></div><p style="color: #f90;">In case you are seeing this email by mistake,<br/>Please get the support informed! <br/><hr/>Drop an email at <b>support@icoinmarket.com </b> for instant replies.</p><hr/><table align="center" style="margin: 0 auto;padding-top:10px"><tr><td style="text-align: center; color:#000;font-size: 12px;" colspan="2"><p style="padding-bottom:5px">Do not have an account at <span style="color: #f90;"> iCoinMarket</span>?</p></td></tr><tr><td style="padding-left: 18px;text-align:center;" colspan="2"><a href="#"><img src="' + config.emailDomain + '/assets/images/learn-button.png" alt="learn"></a></td></tr><tr><td style="text-align: center;padding-top: 6px;padding-right: 21px;" colspan="2"> <a href="#"> <img src="' + config.emailDomain + '/assets/images/twitter.png" alt="twitter"></a> <a href="https://www.youtube.com/channel/UCjG1qbP7T8oqxPK7brWdbVw"><img src="' + config.emailDomain + '/assets/images/youtube.png" alt="youtube"></a> <a href="https://www.facebook.com/groups/icoinmarket/"> <img src="' + config.emailDomain + '/assets/images/facebook.png" alt="facebook"></a><a href="http://support.icoinmarket.com/"><img src="' + config.emailDomain + '/assets/images/live-chat-button.png" alt="live chat"></a></td></tr><tr><td style="text-align: center;color:#4A99BC;padding-bottom:13px;font-size:12px" colspan="2">Manage your subscriptions | <a href="' + config.emailDomain + '/terms-of-service" style="color: #4A99BC; text-decoration: blink;">Privacy Policy</a></td></tr><tr><td style="text-align: center; color:#FFFFFF;font-size:12px" colspan="2">&nbsp;</td></tr></table></div>';
      _self.sendEmail(data.mailTo, config.email.mailFrom, subject, message, null, function(error, info){
        if(error){
          console.log(error, message);
        }else{
          console.log('Message sent: ' + info.response, message);
        };
      });
    },

    preMatureWithdrawCommitmentEmail : function(data, totalAmount, usdAmount, adscash) {
      var _self = this;
      var subject = "iCoinMarket :: Commitment Withdrawal (Premature)";
      var message = '<div style="max-width: 600px; color: #f90; border-radius:10px; text-align: center; min-height: 300; font-family: arial; text-align: center; margin: auto; padding: 20px; overflow: hidden; box-shadow: 2px 2px 2px 2px #f2f2f2; border:1px solid #ccc;"> <img src="' + config.emailDomain + '/assets/images/91063c67.icmlogo.png" width=200><br/><br/><br/><h1 style="font-size:1.2em;font-weight:100;">'+subject+'</h1><div style="text-align:left;color:black"><p>Dear Customer,<br /><br />Your withdrawal request has been approved from our end. The Withdrawal has been processed to your registered Wallet.<br /><br /><strong>Amount Withdrawn:</strong> '+totalAmount+'$<br /><strong>USD :</strong> '+usdAmount+'$<br /><strong>AdsCash :</strong> '+adscash+'  <br /><br />Keep growing with ICM and generate returns up to 300%!<br /><br /><br /><strong>Thank You</strong><p>iCoinMarket Team </p></div><p style="color: #f90;">In case you are seeing this email by mistake,<br/>Please get the support informed! <br/><hr/>Drop an email at <b>support@icoinmarket.com </b> for instant replies.</p><hr/><table align="center" style="margin: 0 auto;padding-top:10px"><tr><td style="text-align: center; color:#000;font-size: 12px;" colspan="2"><p style="padding-bottom:5px">Do not have an account at <span style="color: #f90;"> iCoinMarket</span>?</p></td></tr><tr><td style="padding-left: 18px;text-align:center;" colspan="2"><a href="#"><img src="' + config.emailDomain + '/assets/images/learn-button.png" alt="learn"></a></td></tr><tr><td style="text-align: center;padding-top: 6px;padding-right: 21px;" colspan="2"> <a href="#"> <img src="' + config.emailDomain + '/assets/images/twitter.png" alt="twitter"></a> <a href="https://www.youtube.com/channel/UCjG1qbP7T8oqxPK7brWdbVw"><img src="' + config.emailDomain + '/assets/images/youtube.png" alt="youtube"></a> <a href="https://www.facebook.com/groups/icoinmarket/"> <img src="' + config.emailDomain + '/assets/images/facebook.png" alt="facebook"></a><a href="http://support.icoinmarket.com/"><img src="' + config.emailDomain + '/assets/images/live-chat-button.png" alt="live chat"></a></td></tr><tr><td style="text-align: center;color:#4A99BC;padding-bottom:13px;font-size:12px" colspan="2">Manage your subscriptions | <a href="' + config.emailDomain + '/terms-of-service" style="color: #4A99BC; text-decoration: blink;">Privacy Policy</a></td></tr><tr><td style="text-align: center; color:#FFFFFF;font-size:12px" colspan="2">&nbsp;</td></tr></table></div>';
      _self.sendEmail(data.email, config.email.mailFrom, subject, message, null, function(error, info){
        if(error){
          console.log(error, message);
        }else{
          console.log('Message sent: ' + info.response, message);
        };
      });
    },

    sendADSWithdrawalSuccess: function(mailTo, userName, amount, winfo, userId) {
      var _self = this;
      var subject = 'iCoinMarket :: Your AdsCash withdrawal request is completed';    
      var mailbody = "<p style='padding-top: 20px;'>An amount of "+amount+" AdsCash has been withdrawn to ETH Address ."+winfo.creditaccount+" on "+winfo.createdat+" . Your withdrawal Id is "+winfo._id+".</p><p><br /><br /></p>";
      var message = '<div style="max-width: 600px; color: #f90; border-radius:10px; text-align: center; min-height: 300; font-family: arial; text-align: center; margin: auto; padding: 20px; overflow: hidden; box-shadow: 2px 2px 2px 2px #f2f2f2; border:1px solid #ccc;"> <img src="' + config.emailDomain + '/assets/images/91063c67.icmlogo.png" width=200><br/><br/><br/><h1 style="font-size:1.2em;font-weight:100;">'+subject+'</h1><div style="text-align:left;color:black"><p> Dear User, </p><br>'+mailbody+'<br/><strong>Thank You</strong><p>iCoinMarket Team </p></div><p style="color: #f90;">In case you are seeing this email by mistake,<br/>Please get the support informed! <br/><hr/>Drop an email at <b>support@icoinmarket.com </b> for instant replies.</p><hr/><table align="center" style="margin: 0 auto;padding-top:10px"><tr><td style="text-align: center; color:#000;font-size: 12px;" colspan="2"><p style="padding-bottom:5px">Do not have an account at <span style="color: #f90;"> iCoinMarket</span>?</p></td></tr><tr><td style="padding-left: 18px;text-align:center;" colspan="2"><a href="#"><img src="' + config.emailDomain + '/assets/images/learn-button.png" alt="learn"></a></td></tr><tr><td style="text-align: center;padding-top: 6px;padding-right: 21px;" colspan="2"> <a href="#"> <img src="' + config.emailDomain + '/assets/images/twitter.png" alt="twitter"></a> <a href="https://www.youtube.com/channel/UCjG1qbP7T8oqxPK7brWdbVw"><img src="' + config.emailDomain + '/assets/images/youtube.png" alt="youtube"></a> <a href="https://www.facebook.com/groups/icoinmarket/"> <img src="' + config.emailDomain + '/assets/images/facebook.png" alt="facebook"></a><a href="http://support.icoinmarket.com/"><img src="' + config.emailDomain + '/assets/images/live-chat-button.png" alt="live chat"></a></td></tr><tr><td style="text-align: center;color:#4A99BC;padding-bottom:13px;font-size:12px" colspan="2">Manage your subscriptions | <a href="' + config.emailDomain + '/terms-of-service" style="color: #4A99BC; text-decoration: blink;">Privacy Policy</a></td></tr><tr><td style="text-align: center; color:#FFFFFF;font-size:12px" colspan="2">&nbsp;</td></tr></table></div>';

      _self.sendEmail(mailTo, config.email.mailFrom, subject, message, null, function(error, info){
        if(error){
          console.log(error, message);
        }else{
          console.log('Message sent: ' + info.response, message);
          _self._createInternalMessage(subject, message, userId, {
            id: config.sponsorId,
            email: '',
            name: config.sponsorUn,
          });
        };
      });
    },

    sendPlaceCommitmentMailBySystem : function(data, nextpackage, maturityPeriod, maturedAmount) {
      var _self = this;
      var subject = "iCoinMarket :: Commitment Plan upgraded from " + data.packagename + " Plan to " + nextpackage + " Plan";
      var message = '<div style="max-width: 600px; color: #f90; border-radius:10px; text-align: center; min-height: 300; font-family: arial; text-align: center; margin: auto; padding: 20px; overflow: hidden; box-shadow: 2px 2px 2px 2px #f2f2f2; border:1px solid #ccc;"> <img src="' + config.emailDomain + '/assets/images/91063c67.icmlogo.png" width=200><br/><br/><br/><h1 style="font-size:1.2em;font-weight:100;">'+subject+'</h1><div style="text-align:left;color:black"><p> Dear '+ data.userid.name +', </p>Congratulations !! Due to inactivity from your end, your matured amount of $'+maturedAmount+' from this commitment is locked by system further for '+nextpackage+' plan which will last for '+maturityPeriod+' months.<br />You can track your daily growth by logging directly to your dashboard.<br />With ICM, you can make profits upto 300%! Our support is just a click away. Ask anything, anytime!<br/><br/><br/><strong>Thank You</strong><p>iCoinMarket Team </p></div><p style="color: #f90;">In case you are seeing this email by mistake,<br/>Please get the support informed! <br/><hr/>Drop an email at <b>support@icoinmarket.com </b> for instant replies.</p><hr/><table align="center" style="margin: 0 auto;padding-top:10px"><tr><td style="text-align: center; color:#000;font-size: 12px;" colspan="2"><p style="padding-bottom:5px">Do not have an account at <span style="color: #f90;"> iCoinMarket</span>?</p></td></tr><tr><td style="padding-left: 18px;text-align:center;" colspan="2"><a href="#"><img src="' + config.emailDomain + '/assets/images/learn-button.png" alt="learn"></a></td></tr><tr><td style="text-align: center;padding-top: 6px;padding-right: 21px;" colspan="2"> <a href="#"> <img src="' + config.emailDomain + '/assets/images/twitter.png" alt="twitter"></a> <a href="https://www.youtube.com/channel/UCjG1qbP7T8oqxPK7brWdbVw"><img src="' + config.emailDomain + '/assets/images/youtube.png" alt="youtube"></a> <a href="https://www.facebook.com/groups/icoinmarket/"> <img src="' + config.emailDomain + '/assets/images/facebook.png" alt="facebook"></a><a href="http://support.icoinmarket.com/"><img src="' + config.emailDomain + '/assets/images/live-chat-button.png" alt="live chat"></a></td></tr><tr><td style="text-align: center;color:#4A99BC;padding-bottom:13px;font-size:12px" colspan="2">Manage your subscriptions | <a href="' + config.emailDomain + '/terms-of-service" style="color: #4A99BC; text-decoration: blink;">Privacy Policy</a></td></tr><tr><td style="text-align: center; color:#FFFFFF;font-size:12px" colspan="2">&nbsp;</td></tr></table></div>';
      _self.sendEmail(data.userid.email, config.email.mailFrom, subject, message, null, function(error, info){
        if(error){
          console.log(error, message);
        }else{
          console.log('Message sent: ' + info.response, message);
        };
      });
    },

    adsWithdrawalAutoProcessAlertToAdmin: function(mailTo, message) {
      var _self = this;
      var subject = 'iCoinMarket :: Adscash Withdrawal auto process error.';

      var mailbody = 'iCoinMarket is unable to auto process ADS Withdrawal request, getting this message in response: '+message+'. Plesae visit iCoinMarket and have a look.</p>';
      var message = '<div style="max-width: 600px; color: #f90; border-radius:10px; text-align: center; min-height: 300; font-family: arial; text-align: center; margin: auto; padding: 20px; overflow: hidden; box-shadow: 2px 2px 2px 2px #f2f2f2; border:1px solid #ccc;"> <img src="' + config.emailDomain + '/assets/images/91063c67.icmlogo.png" width=200><br/><br/><h1 style="font-size:1.2em;font-weight:100;">'+subject+'</h1><div style="text-align:left;color:black"><p> Dear Admin, </p><br><br>'+mailbody+'<br/><strong>Thank You</strong><p>iCoinMarket Team </p></div><p style="color: #f90;">In case you are seeing this email by mistake,<br/>Please get the support informed! <br/><hr/>Drop an email at <b>support@icoinmarket.com </b> for instant replies.</p><hr/><table align="center" style="margin: 0 auto;padding-top:10px"><tr><td style="text-align: center; color:#000;font-size: 12px;" colspan="2"><p style="padding-bottom:5px">Do not have an account at <span style="color: #f90;"> iCoinMarket</span>?</p></td></tr><tr><td style="padding-left: 18px;text-align:center;" colspan="2"><a href="#"><img src="' + config.emailDomain + '/assets/images/learn-button.png" alt="learn"></a></td></tr><tr><td style="text-align: center;padding-top: 6px;padding-right: 21px;" colspan="2"> <a href="#"> <img src="' + config.emailDomain + '/assets/images/twitter.png" alt="twitter"></a> <a href="https://www.youtube.com/channel/UCjG1qbP7T8oqxPK7brWdbVw"><img src="' + config.emailDomain + '/assets/images/youtube.png" alt="youtube"></a> <a href="https://www.facebook.com/groups/icoinmarket/"> <img src="' + config.emailDomain + '/assets/images/facebook.png" alt="facebook"></a><a href="http://support.icoinmarket.com/"><img src="' + config.emailDomain + '/assets/images/live-chat-button.png" alt="live chat"></a></td></tr><tr><td style="text-align: center;color:#4A99BC;padding-bottom:13px;font-size:12px" colspan="2">Manage your subscriptions | <a href="' + config.emailDomain + '/terms-of-service" style="color: #4A99BC; text-decoration: blink;">Privacy Policy</a></td></tr><tr><td style="text-align: center; color:#FFFFFF;font-size:12px" colspan="2">&nbsp;</td></tr></table></div>';
      _self.sendEmail(mailTo, config.email.mailFrom, subject, message, null, function(error, info){
        if(error){
          console.log(error, message);
        }else{
          console.log('Message sent: ' + info.response, message);
        };
      });
    },

    updateCommitmentStatusMatureBySystem : function(data, maturedAmount, profit ) {
      var _self = this;
      var subject = "iCoinMarket :: Congratulations! Your commitment plan has matured";
      var message = '<div style="max-width: 600px; color: #f90; border-radius:10px; text-align: center; min-height: 300; font-family: arial; text-align: center; margin: auto; padding: 20px; overflow: hidden; box-shadow: 2px 2px 2px 2px #f2f2f2; border:1px solid #ccc;"> <img src="' + config.emailDomain + '/assets/images/91063c67.icmlogo.png" width=200><br/><br/><br/><h1 style="font-size:1.2em;font-weight:100;">'+subject+'</h1><div style="text-align:left;color:black"><p> Dear '+data.userid.name+',<br /><br />Congratulations! Your locked amount is matured and is now open for withdrawal!<br /><br /><strong>Your initial committed amount:</strong> $'+ data.amount.value +' <br /><strong>Matured Amount:</strong> $'+ maturedAmount+'<br /><strong>Profit:</strong> $'+ profit +' <br /><br />Now, you can withdraw your whole amount or your profit amount according to your choice. You can withdraw your amount as in 50% in Adscash and 50% in Bitcoin. Make sure you withdraw within 5 days! On the 6th day, the entire amount will be locked for the next period automatically by the system.<br/><br/><br/><strong>Thank You</strong><p>iCoinMarket Team </p></div><p style="color: #f90;">In case you are seeing this email by mistake,<br/>Please get the support informed! <br/><hr/>Drop an email at <b>support@icoinmarket.com </b> for instant replies.</p><hr/><table align="center" style="margin: 0 auto;padding-top:10px"><tr><td style="text-align: center; color:#000;font-size: 12px;" colspan="2"><p style="padding-bottom:5px">Do not have an account at <span style="color: #f90;"> iCoinMarket</span>?</p></td></tr><tr><td style="padding-left: 18px;text-align:center;" colspan="2"><a href="#"><img src="' + config.emailDomain + '/assets/images/learn-button.png" alt="learn"></a></td></tr><tr><td style="text-align: center;padding-top: 6px;padding-right: 21px;" colspan="2"> <a href="#"> <img src="' + config.emailDomain + '/assets/images/twitter.png" alt="twitter"></a> <a href="https://www.youtube.com/channel/UCjG1qbP7T8oqxPK7brWdbVw"><img src="' + config.emailDomain + '/assets/images/youtube.png" alt="youtube"></a> <a href="https://www.facebook.com/groups/icoinmarket/"> <img src="' + config.emailDomain + '/assets/images/facebook.png" alt="facebook"></a><a href="http://support.icoinmarket.com/"><img src="' + config.emailDomain + '/assets/images/live-chat-button.png" alt="live chat"></a></td></tr><tr><td style="text-align: center;color:#4A99BC;padding-bottom:13px;font-size:12px" colspan="2">Manage your subscriptions | <a href="' + config.emailDomain + '/terms-of-service" style="color: #4A99BC; text-decoration: blink;">Privacy Policy</a></td></tr><tr><td style="text-align: center; color:#FFFFFF;font-size:12px" colspan="2">&nbsp;</td></tr></table></div>';
      _self.sendEmail(data.userid.email, config.email.mailFrom, subject, message, null, function(error, info){
        if(error){
          console.log(error, message);
        }else{
          console.log('Message sent: ' + info.response, message);
        };
      });
    },

    withdrawalAutoProcessAlert: function(data, commitmentData) {
      var _self = this;
      var subject = 'iCoinMarket :: Commitment Auto Process Reminder.';
      var profitWithdrawnText = '';
      if(commitmentData.profitWithdrawn != 0)
         profitWithdrawnText +='<strong>Profits withdrawn:</strong> $'+commitmentData.profitWithdrawn+' <br />';
      profitWithdrawnText += '<strong>Matured Amount:</strong> $'+commitmentData.maturedAmount;   
      var message = '<div style="max-width: 600px; color: #f90; border-radius:10px; text-align: center; min-height: 300; font-family: arial; text-align: center; margin: auto; padding: 20px; overflow: hidden; box-shadow: 2px 2px 2px 2px #f2f2f2; border:1px solid #ccc;"> <img src="' + config.emailDomain + '/assets/images/91063c67.icmlogo.png" width=200><br/><br/><br/><h1 style="font-size:1.2em;font-weight:100;">'+subject+'</h1><div style="text-align:left;color:black">Dear Customer, <br /><br />Due to inactivity from your end, the system will automatically lock your matured amount further for <strong> '+commitmentData.nextPlanName+'</strong> plan which will last for '+commitmentData.nextPlanMaturityPeriod+' months.<br /><br />If you still wish to withdraw, you can place the withdrawal request before '+commitmentData.lastDayofMaturity+'. <br /><strong>Principal Amount:</strong> $'+commitmentData.commitedAmount+' <br />'+profitWithdrawnText+'<br /><strong>Profit:</strong> $'+commitmentData.profitAmount+' <br /><br />You can withdraw your amount as 50% in Adscash 50% in Bitcoin. <br />Keep growing with ICM!<br /><br /><strong>Thank You</strong><p>iCoinMarket Team </p></div><p style="color: #f90;">In case you are seeing this email by mistake,<br/>Please get the support informed! <br/><hr/>Drop an email at <b>support@icoinmarket.com </b> for instant replies.</p><hr/><table align="center" style="margin: 0 auto;padding-top:10px"><tr><td style="text-align: center; color:#000;font-size: 12px;" colspan="2"><p style="padding-bottom:5px">Do not have an account at <span style="color: #f90;"> iCoinMarket</span>?</p></td></tr><tr><td style="padding-left: 18px;text-align:center;" colspan="2"><a href="#"><img src="' + config.emailDomain + '/assets/images/learn-button.png" alt="learn"></a></td></tr><tr><td style="text-align: center;padding-top: 6px;padding-right: 21px;" colspan="2"> <a href="#"> <img src="' + config.emailDomain + '/assets/images/twitter.png" alt="twitter"></a> <a href="https://www.youtube.com/channel/UCjG1qbP7T8oqxPK7brWdbVw"><img src="' + config.emailDomain + '/assets/images/youtube.png" alt="youtube"></a> <a href="https://www.facebook.com/groups/icoinmarket/"> <img src="' + config.emailDomain + '/assets/images/facebook.png" alt="facebook"></a><a href="http://support.icoinmarket.com/"><img src="' + config.emailDomain + '/assets/images/live-chat-button.png" alt="live chat"></a></td></tr><tr><td style="text-align: center;color:#4A99BC;padding-bottom:13px;font-size:12px" colspan="2">Manage your subscriptions | <a href="' + config.emailDomain + '/terms-of-service" style="color: #4A99BC; text-decoration: blink;">Privacy Policy</a></td></tr><tr><td style="text-align: center; color:#FFFFFF;font-size:12px" colspan="2">&nbsp;</td></tr></table></div>';
      _self.sendEmail(data.userid.email, config.email.mailFrom, subject, message, null, function(error, info){
        if(error){
          console.log(error, message);
        }else{
          console.log('Message sent: ' + info.response, message);
        };
      });
    }
  }
}
