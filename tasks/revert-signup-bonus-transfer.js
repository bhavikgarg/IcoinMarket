'use strict';

var mongoose = require('mongoose');
var config = require('./../server/config/environment');
var co = require('co');

mongoose.connect(config.mongo.uri, config.mongo.options);
mongoose.connection.on('error', function(err) {
    console.error('MongoDB connection error: ' + err);
    process.exit(-1);
});

var CreditLogs = require('./../server/api/credits/credit-logs.model');
var Credit = require('./../server/api/credits/credits.model');
var CreditService = require('./../server/components/credits/credits.service');
var Users = require('./../server/api/user/user.model');
var EmailService = require('../server/components/emails/email.service');

var RevertSingupBonusTransfer = function() {

    var _self = this;
    _self.creditService = new CreditService();

    _self.getData = function*() {
        return yield CreditLogs.find({
            coins: -10,
            subtype: "W",
            createdat: { $lt: new Date("2017-07-24 18:00:00.000Z")},
            description: {$regex: 'Transfer USD amount \\(To user.*'}
        }).populate({ path : "userid", select : "name email", model : "User" }).exec();
    };

    _self.processInfo = function(data, index, len, callback) {
        console.log("\n\r\n\r", 'Processing For: ', index, len, "\n\r\n\r");
        if (index < len) {
            var creditLog = data[index];
            console.log("Processing for CreditLog :", creditLog);
            var a = creditLog.userid.email;
            _self.creditService.updateCredits(creditLog.userid._id, {
                adscash: 0,
                usd: 10,
                adcpacks: 0
            }, function(err, credits) {
                if (err || !credits) {
                    console.log('[err] Unable to update balance ', err);
                } else {
                    var receiverEmailId = creditLog.description.split(":")[1].slice(0, -1).trim();
                    console.log(receiverEmailId);
                    var description ='Signup bonus reversed By Admin (transferred to: '+receiverEmailId +' earlier)';
                    _self.creditService.addCreditTransferLog(creditLog.userid._id, {
                        amount: 10,
                        description: description,
                        type: 'usd',
                        subtype: 'P',
                        cointype: 'usd',
                        createdat: (new Date())
                    }, function(err, usdLog) {
                       //Send Mail to reciever.
                       var emailService = new EmailService();
                       emailService.cancelSignupBonusTransferMail(creditLog.userid.email,description);

                        Users.findOne({
                            email: receiverEmailId
                        }, '_id', function(err, userid) {
                            if (err) {
                                res.status(200).json({
                                    message: 'No History Found.'
                                });
                            } else {
                                _self.creditService.updateCredits(userid._id + '', {
                                    adscash: 0,
                                    usd: -9.8,
                                    adcpacks: 0
                                }, function(err, credits) {
                                    if (err || !credits) {
                                        console.log('[err] Unable to update balance ', err);
                                    } else {
                                        var descreversed = 'Signup bonus transfer reversed By Admin';
                                        _self.creditService.addCreditTransferLog(userid._id + '', {
                                            amount: -9.8,
                                            description: descreversed,
                                            type: 'usd',
                                            subtype: 'W',
                                            cointype: 'usd',
                                            createdat: (new Date())
                                        }, function(err, usdLog) {
                                            if (!err) {
                                                emailService.cancelSignupBonusTransferMail(receiverEmailId,descreversed);
                                                return _self.processInfo(data, (index + 1), len, callback);
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    });
                }
            });
        } else {
            return callback();
        }
    };

    _self.startWorker = function(callback) {
        co(function*() {
            let creditLog = yield _self.getData();
            console.log(creditLog);
            if (creditLog && creditLog.length > 0) {
               _self.processInfo(creditLog, 0, creditLog.length, function(err, result) {
                });
            } else {
                console.log("No records found to process ");
                process.exit(0);
            }
        }).catch(function(err) {
            console.log("[Error] Unable to process verify credit Logs: " + err);
            process.exit(0);
        });
    };

    return {
        execute: _self.startWorker
    }
}

var revertSingupBonusTransfer = new RevertSingupBonusTransfer();

setTimeout(function() {
    revertSingupBonusTransfer.execute(function(err, data) {
        console.log(err, data);
        //  process.exit(0);
    });

}, 15000);