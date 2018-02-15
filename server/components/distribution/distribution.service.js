'use strict';

var _ = require('lodash');
var Users            = require('../../api/user/user.model');
var Credits          = require('./../credits/credits.service');
var config           = require('../../config/environment');
var OverflowBkt      = require('../../api/distribution/overflowbucket.model');
var QualificationBkt = require('../../api/distribution/qualificationbucket.model');
var ProductModel     = require('../../api/products/products.model');
var ActivePacks      = require('./../../api/payment/activesilverpacks.model');
var CurrencyRate     = require('./../../api/payment/currency-rate.model');
var Emails           = require('../emails/email.service');
var CompOffUsers     = require('./../../api/user/compoff-user.model');
//var ViewCampaignLog  = require('./../../api/campaign/viewcampaignlog.model');
var SilverCommission = require('./silver-commission.service');
var CommitmentService = require('./../commitments/commitments.service');
var AdscashService = require('./../adscash/adscash.service');

module.exports = function() {
    var _self = this;

    _self.distributionMaxLevel = 3;
    _self.distributionInfo = {
        l1: {
            percent: 10,
            qulification: 100,
            notQulifyPercent: 1
        },
        l2: {
            percent: 3,
            qulification: 1000,
            notQulifyPercent: 0
        },
        l3: {
            percent: 2,
            qulification: 10000,
            notQulifyPercent: 0
        }
    };


    _self.getSponsor = function(userId, callback) {

        Users.findById(userId + '', callback);
        return true;
    }

    _self.Credits = new Credits();
    _self.Emails = new Emails();
    _self.CommitmentService = new CommitmentService();
    _self.AdscashService = new AdscashService();

    // Roundof Amount and dump data in overlowbucket
    _self.roundofAmount = function(userId, level, amount, type) {
        var calAmount = 0,
            roundAmount = 0;
        // console.log(userId, level, amount, parseInt(amount * 100000), (parseInt(amount * 100000) / 100000));
        // calAmount = (parseInt(amount * 100000) / 100000); // To get the amount only with two decimal digit
        // roundAmount = amount - calAmount;
        calAmount = Math.floor(amount); // To get the amount only without decimal digit
        roundAmount = amount - calAmount;
        if (roundAmount > 0) {
            OverflowBkt.create({
                sponsorid: userId + '',
                level: level,
                amount: roundAmount,
                type: type
            }, function(_err, _d) {
                console.log('[info] Round of take place and Overflow Bucket Have: ', userId, level, amount, roundAmount, _err);
            });
        }

        return calAmount;
    }

    // Distribute Gold Coins To Sponsor's  (Products Purchase)
    _self.adscashCoinDistribution = function(userId, coins, level, productId, userName, callback) {
        if (!_self.adscashRate) {
            _self.AdscashService.adsCashLiveRate(function(err, data) {
                if (JSON.parse(data.body).error) {
                    console.log("[Error] Distribution service unable to get currency rate", err, adcrate);
                    callback(false);
                } else {
                    _self.adscashRate = JSON.parse(data.body).data.rate;
                    return _self.adscashCoinDistribution(userId, coins, level, productId, userName, callback);
                }
            });
        } else if (level <= _self.distributionMaxLevel && userId != config.sponsorId) {
            _self.getSponsor(userId, function(err, _user) {
                if (err || !_user) {
                    console.log('Unable to distribute amount: ', userId, level, err);
                    //return false;
                    callback(false);
                }

                if (!userName) {
                    userName = (_user ? _user.username : userId);
                }

                var percentConfig = _self.distributionInfo['l' + level];
                //var reCall         = ((_user.sponsor && _user.sponsor!='') ? true : false);
                var sponsorId = ((_user.sponsor && _user.sponsor != '') ? (_user.sponsor) : config.sponsorId);
                _self.CommitmentService.getOnTradeAmount(sponsorId + '', function(err, data) {
                    // if sponsor hasn't committed any amount, we set the sponsorCredit to zero
                    var sponsorCredits = data[0] || {usd: 0};
                    if (err || !sponsorCredits) {
                        console.log("[Error] Distribution service Unable to get sponsor credits to check qualification", sponsorId, err, sponsorCredits);
                        return _self.adscashCoinDistribution(sponsorId, coins, (level + 1), productId, userName, callback);
                    } else {
                        CompOffUsers.findOne({
                            userid: sponsorId,
                            isEnabled : true,
                            isDeleted :false
                        }, function(err, compoffUser) {
                            if (err) {
                                console.log("Unable to find user in comp off list : ", err);
                                return _self.adscashCoinOldDistribution(sponsorId, coins, (level + 1), date, userName, isOldCommissions, callback);
                            }
                            if (compoffUser && compoffUser != undefined && compoffUser != null && level <= compoffUser.level) {
                                var sponsorCoins = (coins * percentConfig.percent) / 100;
                            }
                            //Common code of both scenarios.
                            else if (level == 1 && sponsorCredits.usd < percentConfig.qulification) {
                                var sponsorCoins = (coins * percentConfig.notQulifyPercent) / 100;
                            } else if (sponsorCredits.usd < percentConfig.qulification) {
                                console.log("Sponsor is not Qualified yet.", sponsorId, sponsorCredits);
                                return _self.adscashCoinDistribution(sponsorId, coins, (level + 1), productId, userName, callback);
                            } else {
                                var sponsorCoins = (coins * percentConfig.percent) / 100;
                            }

                            // sponsorCoins = _self.roundofAmount(sponsorId, level, sponsorCoins);
                            // Calculate commitions in coins and USD both;
                            var sponsorUSD = sponsorCoins / 2 // _self.roundofAmount(sponsorId, level, (sponsorCoins / 2), 'USD');
                            var sponsorAdscash = _self.roundofAmount(sponsorId, level, (sponsorUSD / _self.adscashRate), 'adscash');
                            _self.Credits.updateCredits(sponsorId, {
                                adscash: sponsorAdscash,
                                usd: sponsorUSD,
                                adcpacks: 0
                            }, function(err, credits) {
                                if (err || !credits) {
                                    console.log('[err] Unable to distribute coins ', err, sponsorId, sponsorCoins);
                                    return _self.adscashCoinDistribution(sponsorId, coins, (level + 1), productId, userName, callback);
                                } else if (credits) {
                                    _self.Credits.addCreditTransferLog(sponsorId, {
                                        amount: sponsorUSD,
                                        description: 'Team Sales Commission for Buying Trading Package (By: ' + userName + ', Gen ' + level + ')',
                                        type: 'usd',
                                        subtype: 'C',
                                        cointype: 'usd',
                                        createdat: (new Date())
                                    }, function(err, usdLog) {
                                        console.log('Credit Log of Level: ' + level, err, sponsorUSD);
                                        _self.Credits.addCreditTransferLog(sponsorId, {
                                            amount: sponsorAdscash,
                                            description: 'Team Sales Commission for Buying Trading Package (By: ' + userName + ', Gen ' + level + ')',
                                            type: 'adscash',
                                            subtype: 'C',
                                            cointype: 'adscash',
                                            createdat: (new Date())
                                        }, function(_err, adclog) {
                                            console.log('Commission Log of Level: ' + level, _err, sponsorAdscash);
                                            _self.Emails.sendCommissionDistributionEmail(sponsorId, level, userName, sponsorUSD, sponsorAdscash, 'USD');
                                        });
                                    });
                                    return _self.adscashCoinDistribution(sponsorId, coins, (level + 1), productId, userName, callback);
                                }
                            });
                        });
                    }
                });
            });
        } else {
            console.log('Distribution of Commission for Trading Package Purchase Done: ', userId);
            callback(true);
        }
    }

    _self.commissionDistribution = function(userId, coins, createdat, level, productId, userName, callback) {
        _self.adscashRate = 0.137;
        if (level <= _self.distributionMaxLevel && userId != config.sponsorId) {
            _self.getSponsor(userId, function(err, _user) {
                if (err || !_user) {
                    console.log('Unable to distribute amount: ', userId, level, err);
                    //return false;
                    callback(true);
                }

                if (!userName) {
                    userName = (_user ? _user.username : userId);
                }

                var percentConfig = _self.distributionInfo['l' + level];
                //var reCall         = ((_user.sponsor && _user.sponsor!='') ? true : false);
                var sponsorId = ((_user.sponsor && _user.sponsor != '') ? (_user.sponsor) : config.sponsorId);
                _self.CommitmentService.getOnTradeAmountAfterNoonOfSecondAugust(sponsorId + '', createdat, function(err, data) {
                    // if sponsor hasn't committed any amount, we set the sponsorCredit to zero
                    var sponsorCredits = data[0] || {usd: 0};
                    if (err || !sponsorCredits) {
                        console.log("[Error] Distribution service Unable to get sponsor credits to check qualification", sponsorId, err, sponsorCredits);
                        return _self.commissionDistribution(sponsorId, coins, createdat, (level + 1), productId, userName, callback);
                    } else {
                        CompOffUsers.findOne({
                            userid: sponsorId,
                            isEnabled : true,
                            isDeleted :false
                        }, function(err, compoffUser) {
                            if (err) {
                                console.log("Unable to find user in comp off list : ", err);
                                return _self.adscashCoinOldDistribution(sponsorId, coins, (level + 1), date, userName, isOldCommissions, callback);
                            }
                            if (compoffUser && compoffUser != undefined && compoffUser != null && level <= compoffUser.level) {
                                var sponsorCoins = (coins * percentConfig.percent) / 100;
                            }
                            //Common code of both scenarios.
                            else if (level == 1 && sponsorCredits.usd < percentConfig.qulification) {
                                var sponsorCoins = (coins * percentConfig.notQulifyPercent) / 100;
                            } else if (sponsorCredits.usd < percentConfig.qulification) {
                                console.log("Sponsor is not Qualified yet.", sponsorId, sponsorCredits);
                                return _self.commissionDistribution(sponsorId, coins, createdat, (level + 1), productId, userName, callback);
                            } else {
                                var sponsorCoins = (coins * percentConfig.percent) / 100;
                            }

                            // sponsorCoins = _self.roundofAmount(sponsorId, level, sponsorCoins);
                            // Calculate commitions in coins and USD both;
                            var sponsorUSD = sponsorCoins / 2 // _self.roundofAmount(sponsorId, level, (sponsorCoins / 2), 'USD');
                            var sponsorAdscash = _self.roundofAmount(sponsorId, level, (sponsorUSD / _self.adscashRate), 'adscash');
                            _self.Credits.updateCredits(sponsorId, {
                                adscash: sponsorAdscash,
                                usd: sponsorUSD,
                                adcpacks: 0
                            }, function(err, credits) {
                                if (err || !credits) {
                                    console.log('[err] Unable to distribute coins ', err, sponsorId, sponsorCoins);
                                    return _self.commissionDistribution(sponsorId, coins, createdat, (level + 1), productId, userName, callback);
                                } else if (credits) {
                                    _self.Credits.addCreditTransferLog(sponsorId, {
                                        amount: sponsorUSD,
                                        description: 'Team Sales Commission for Buying Trading Package (By: ' + userName + ', Gen ' + level + ')',
                                        type: 'usd',
                                        subtype: 'C',
                                        cointype: 'usd',
                                        createdat: createdat
                                    }, function(err, usdLog) {
                                        console.log('Credit Log of Level: ' + level, err, sponsorUSD);
                                        _self.Credits.addCreditTransferLog(sponsorId, {
                                            amount: sponsorAdscash,
                                            description: 'Team Sales Commission for Buying Trading Package (By: ' + userName + ', Gen ' + level + ')',
                                            type: 'adscash',
                                            subtype: 'C',
                                            cointype: 'adscash',
                                            createdat: createdat
                                        }, function(_err, adclog) {
                                            console.log('Commission Log of Level: ' + level, _err, sponsorAdscash);
                                            // _self.Emails.sendCommissionDistributionEmail(sponsorId, level, userName, sponsorUSD, sponsorAdscash, 'USD');
                                        });
                                    });
                                    return _self.commissionDistribution(sponsorId, coins, createdat, (level + 1), productId, userName, callback);
                                }
                            });
                        });
                    }
                });
            });
        } else {
            console.log('Distribution of Commission for Trading Package Purchase Done: ', userId);
            callback(false, true);
        }
    }
    return {
        distributeAdscashProductCredits: _self.adscashCoinDistribution,
        commissionDistribution: _self.commissionDistribution
    }

};
