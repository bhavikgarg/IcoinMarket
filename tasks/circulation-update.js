'use strict'

var mongoose = require('mongoose');
var co = require('co');
var config = require('./../server/config/environment');

// Connect to database
mongoose.connect(config.mongo.uri, config.mongo.options);
mongoose.connection.on('error', function(err) {
    console.error('MongoDB connection error: ' + err);
    process.exit(-1);
});



var CreditLogs = require('./../server/api/credits/credit-logs.model');
var Payment = require('./../server/api/payment/payment.model');
var Circulation = require('./../server/api/payment/circulation.model');
var CurrencyRate = require('./../server/api/payment/currency-rate.model');
var EmailService = require('./../server/components/emails/email.service');
var CirculationClass = function() {

    var _self = this;
    _self.increaseRate = config.apiConstants.APPRECIATION_RATE_INCREMENT;
    _self.increaseNextRate = (config.apiConstants.APPRECIATION_RATE_INCREMENT*2);
    _self.execute = function(cb) {
        co(function*() {
            let totalPurchasedAdsCashCoins = 0,
                totalBonusAdsCashCoins = 0;

            totalPurchasedAdsCashCoins = yield Payment.aggregate([{
                '$match': {
                    productid: 'adscash',
                    status: 'COMPLETED'
                }
            }, {
                '$group': {
                    _id: null,
                    coins: {
                        '$sum': "$coins"
                    }
                }
            }]).exec();

            totalBonusAdsCashCoins = yield CreditLogs.aggregate([{
                '$match': {
                    type: 'adscash',
                    cointype: 'PROMOTION-SIGNUP'
                }
            }, {
                '$group': {
                    _id: null,
                    coins: {
                        '$sum': "$coins"
                    }
                }
            }]).exec();


            totalPurchasedAdsCashCoins = ((totalPurchasedAdsCashCoins[0] && totalPurchasedAdsCashCoins[0].coins) ? totalPurchasedAdsCashCoins[0].coins : 0);
            totalBonusAdsCashCoins = ((totalBonusAdsCashCoins[0] && totalBonusAdsCashCoins[0].coins) ? totalBonusAdsCashCoins[0].coins : 0);

            let currentCirculation = parseInt(totalPurchasedAdsCashCoins + totalBonusAdsCashCoins);

            Circulation.findOne({
                active: true
            }, function(err, circulation) {
                if (err || !circulation) {
                    console.log("[Error] Unable to get current circulation data:", err, circulation);
                    cb(err);
                } else if (circulation && currentCirculation >= circulation.nextappreciation) {
                    circulation.update({
                        active: false,
                        updatedat: new Date()
                    }, function(cerr) {
                        console.log("Updated current circulation.", cerr);
                        let nextappreciation = parseInt(circulation.nextappreciation + ((config.apiConstants.TOTAL_SUPPLY*config.apiConstants.APPRECIATION_PERCENTAGE)/100));
                        Circulation.create({
                            lastappreciation: circulation.nextappreciation,
                            totaladscashcirculation: currentCirculation,
                            nextappreciation: nextappreciation,
                            active: true,
                            cp: parseFloat(circulation.cp + _self.increaseRate).toFixed(3),
                            np: parseFloat(circulation.cp + _self.increaseNextRate).toFixed(3)
                        }, function(ncerr, nc) {
                            console.log("Create new circulation:", ncerr, nc);
                            /* update currency rates */
                            CurrencyRate.findOneAndUpdate({
                                currency: 'adscash',
                                isactive: true
                            }, {
                                isactive: false,
                                expireat: new Date()
                            }).exec(function(crerr, cr) {
                              console.log(crerr, cr);
                                if (!crerr && cr) {
                                    CurrencyRate.create({
                                        rate: parseFloat(cr.rate + _self.increaseRate).toFixed(3),
                                        currency: 'adscash',
                                        isactive: true
                                    }, function(nrerr, nr) {
                                        console.log("New currency rates:", nrerr, nr);
                                        var emailService = new EmailService();
                                        emailService.priceUpdateAlertToAdmin('ravi@ith.tech', 'adscash', nr.rate);
                                        cb(nrerr);
                                    });
                                } else {
                                    console.log("[Error] Unable to update Current rates.", crerr);
                                    cb(crerr);
                                }
                            });
                        });
                    });
                } else {
                    circulation.update({
                        totaladscashcirculation: currentCirculation
                    }, function(ucerr) {
                        console.log("Update circulation:", ucerr);
                        cb(ucerr);
                    });
                }
            });
        }).catch(function(err) {
            console.log("Error:", err);
            cb(err);
        });
    }

    return {
        execute: _self.execute
    }
}

module.exports = CirculationClass
