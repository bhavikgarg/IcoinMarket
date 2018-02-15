'use strict';

var Commitments = require('./commitments.model');
var Commitmentprofit = require('./commitmentsprofit.model');
var Commitmentprofitlog = require('./commitmentsprofit-logs.model');
var Credits = require('../../components/credits/credits.service');
var UserCreditsLog = require('../credits/credit-logs.model');
var config = require('../../config/environment');
var EmailService = require('../../components/emails/email.service');
var DistributionService = require('../../components/distribution/distribution.service');
var Commitmentslogs = require('../../components/commitments/commitmentsLogs.service');
var AdscashService = require('../../components/adscash/adscash.service');
var OverflowBkt = require('../../api/distribution/overflowbucket.model');
var User = require('../user/user.model');
var json2xls = require('json2xls');
var uuid = require('uuid');
var fs = require('fs');
var co = require("co");
var _ = require('lodash');


// Get list of Placed Commitments.
exports.commitmentsList = function(req, res, next) {
    var commitmentsData = [];
    var totalCommitedAmount = 0;
    var totalMaturityAmount = 0;
    var maturityTimeCompleted = 0;
    var populateQuery = [{
        path: 'portfoliomanagerId',
        select: 'name'
    }];
    Commitments.find({
            userid: req.user._id
        })
        .populate(populateQuery)
        .exec(function(err, data) {
            if (err) {
                return next(res, err);
            }
            if (!data) {
                res.status(200).json({
                    message: 'No commitment found'
                });
            } else {
                        data.forEach(function(info, index) {
                            var currentDate = new Date();
                            var maturityDays = (Math.floor(info.maturitydate.getTime() - info.startdate.getTime()) / 1000 / 60 / 60 / 24);
                            var CompletedDays = (Math.floor(currentDate.getTime() - info.startdate.getTime()) / 1000 / 60 / 60 / 24);
                            if (info.status == config.apiConstants.STATUS_CANCELLED) {
                                maturityTimeCompleted = 0;
                            } else {
                                maturityTimeCompleted = Math.floor((CompletedDays / maturityDays) * 100);
                                totalCommitedAmount = parseInt(totalCommitedAmount) + parseInt(info.amount.value);
                            }
                            var profitpercent = info.profit;
                            commitmentsData.push({
                                "id": info._id,
                                "userid": info.userid,
                                "packagename": info.packagename,
                                "amount": info.amount,
                                "status": info.status,
                                "cointype": info.cointype,
                                "maturityPeriod": info.maturityPeriod,
                                "startdate": info.startdate,
                                "maturitydate": info.maturitydate,
                                "maturityTimeCompleted": (maturityTimeCompleted > 100 ? 100 : maturityTimeCompleted),
                                "createdat": info.createdat,
                                "portfoliomanager": info.portfoliomanagerId,
                                "profitpercent" : info.profit
                            });
                            // if (new Date(parseInt(new Date())) <= new Date(parseInt(info.maturitydate))) {
                                var statusArr = [config.apiConstants.STATUS_WITHDRAWN, config.apiConstants.STATUS_CANCELLED, config.apiConstants.STATUS_MATURED_WITHDRAWN];
                                if (!statusArr.includes(info.status))
                                     {
                                        if (profitpercent > 0) {
                                            var calcAamount =parseFloat(totalMaturityAmount) + (parseFloat(info.amount.value) + ((parseFloat(info.amount.value) * profitpercent) / 100));
                                             totalMaturityAmount = Math.round( calcAamount * 100) / 100;
                                        } else {

                                                totalMaturityAmount = Math.round((parseFloat(totalMaturityAmount) + parseFloat(info.amount.value)) * 100) / 100;
                                        }
                                    }
                            // }
                        });
                        return res.status(200).json({
                            error: false,
                            result: commitmentsData,
                            commitedAmount: totalCommitedAmount,
                            maturityAmount: totalMaturityAmount
                        });
            }
        });
}

exports.getAllCommitments = function(req, res, next) {
    var conditions = {};
    var query = {};
    var viewLimit = 25;
    var currentPage = (req.query.page ? req.query.page : 1);
    var skipRows = (viewLimit * (currentPage - 1));
    var view = req.query.view;
    var excel = req.query.excel;
    if (view) {
        conditions = {
            'status': view
        };
    }
    var tillDate = req.query.tillDate;
    var fromDate = req.query.fromDate;
    //var userOffset = req.query.userTzOffset;
    if (tillDate && fromDate) {
        conditions.createdat = {
            "$gte": fromDate,
            "$lte": tillDate
        };
    }
    var filter = req.query.filters;
    if (filter) {
        // first find the user as per the filter then seach for users in commitment table
        var userQuery = {
            '$or': [{
                'name': filter
            }, {
                'email': filter
            }]
        };
        User.find(userQuery, function(_err, users) {
            if (_err || !users || (users && users.length == 0)) {
                // no data found
                res.status(200).json({
                    message: 'No commitment found'
                });
            } else {
                var _users = [];
                users.forEach(function(ud) {
                    _users.push(ud._id + '');
                });
                conditions['$or'] = [{
                    'userid': {
                        "$in": _users
                    }
                }];
                return findCommitment(conditions, viewLimit, skipRows, excel, res);
            }
        });
    } else {
        return findCommitment(conditions, viewLimit, skipRows, excel, res);
    }
}


function findCommitment(conditions, viewLimit, skipRows, excel, res) {
    var commitmentsData = [];
    var totalCommitedAmount = 0;
    var totalMaturityAmount = 0;
    var maturityTimeCompleted = 0;
    var totalRecords = 0;
    var populateQuery = [{
        path: 'portfoliomanagerId',
        select: 'name'
    }, {
        path: 'userid',
        select: 'name email'
    }];

    // get total records
    Commitments.count(conditions, function(err, resp){
        if(err){
            return next(res, err);
        }
        else{
            totalRecords = resp;
        }
    });


    Commitments.find(conditions)
        .skip(skipRows)
        .limit(viewLimit)
        .sort({
            createdat: -1
        })
        .populate(populateQuery)
        .exec(function(err, data) {
            if (err) {
                return next(res, err);
            }
            if (!data) {
                res.status(200).json({
                    message: 'No commitment found'
                });
            } else {
                data.forEach(function(info, index) {
                    var currentDate = new Date();
                    var maturityDays = (Math.floor(info.maturitydate.getTime() - info.startdate.getTime()) / 1000 / 60 / 60 / 24);
                    var CompletedDays = (Math.floor(currentDate.getTime() - info.startdate.getTime()) / 1000 / 60 / 60 / 24);
                    maturityTimeCompleted = Math.floor((CompletedDays / maturityDays) * 100);
                    commitmentsData.push({
                        "id": info._id,
                        "userid": info.userid,
                        "packagename": info.packagename,
                        "amount": info.amount,
                        "status": info.status,
                        "cointype": info.cointype,
                        "maturityPeriod": info.maturityPeriod,
                        "startdate": info.startdate,
                        "maturitydate": info.maturitydate,
                        "maturityTimeCompleted": maturityTimeCompleted,
                        "createdat": info.createdat,
                        "portfoliomanager": info.portfoliomanagerId ? info.portfoliomanagerId.name : 'Not Picked'
                    });
                });
                console.log(commitmentsData);
                // if excel is true then print excel instead of sending the data as response
                if (excel) {
                    sendXlsFileAsOutput(commitmentsData, function(err, filename) {
                        if (err) {
                            return res.status(200).json({
                                success: false,
                                file: null
                            });
                        }
                        if (undefined != filename && '' != filename) {
                            return res.status(200).json({
                                success: true,
                                file: filename
                            });
                        }
                    });
                }
                // if excel is false send data as response
                else {
                    return res.status(200).json({
                        error: false,
                        result: commitmentsData,
                        totalRecords :totalRecords
                    });
                }
            }
        });
}

//cancel commitment
exports.cancelCommitment = function(req, res){
    var commitmentId  = req.body.commitmentId;
    var adminComment = req.body.adminComment;
    var amount = req.body.commitmentAmount;
    var userid = req.body.userId;
    var commitmentTime = req.body.commitmentTime;

    // 1. update status of commitment to CANCELLED
    Commitments.findOneAndUpdate({_id: commitmentId,status: config.apiConstants.STATUS_COMMITTED},{'status': config.apiConstants.STATUS_CANCELLED}, function(error, data){
        if (error) {
            return res.status(200).json({
                error: true,
                message: 'Unbale to cancel commitment'
            });
        }
        else{
            //2. add balance of commitment to uers account
            var _Credits = new Credits();
            _Credits.updateCredits(userid, {
                usd: (amount),
                adscash: 0,
                adcpacks: 0
             }, function(err, data) {
                console.log('Refund against cancelled Commitment : ', err, data);
                if (err) {
                    return res.status(200).json({
                        error: true,
                        message: 'Unbale to refund USD againts cancelled Commitment'
                    });
                }
                else{
                    // 3. Transfer logs in U1 creditlog
                    _Credits.addCreditTransferLog(userid, {
                        amount: (amount),
                        description: adminComment,
                        type: 'usd',
                        subtype: 'P',
                        cointype: 'usd'
                     }, function(err, data) {
                        console.log('Credit Log Info: ', err, data._id);
                        if (err) {
                            return res.status(200).json({
                                error: true,
                                message: 'Unbale to refund USD againts cancelled Commitment'
                            });
                        }
                        else{
                            //4. add cancelled commitment log into Commitment Log
                            var _Commitmentslogs = new Commitmentslogs();
                            _Commitmentslogs.addTradeLog(req.user._id, {
                                commitmentid : commitmentId,
                                status : config.apiConstants.STATUS_CANCELLED,
                                description : adminComment
                            }, function(clErr, clData){
                                if(clErr){
                                    console.log('Cancel Commitment- Log Info : ', clErr);
                                    return res.status(200).json({
                                        error: true,
                                        message: 'Unbale to write cancel Commitment log'
                                    });
                                }
                                else{
                                    //5. Send user an email regarding cancelling of commitment
                                    User.findOne({'_id':userid}, function(err1, userDetails){
                                        if(err){
                                            return res.status(200).json({
                                                error: true,
                                                message: 'Unbale to find user email'
                                            });
                                        }
                                        else{
                                            var userEmail = userDetails._doc.email;
                                            //send mail to user
                                            var emailService = new EmailService();
                                            emailService.cancelCommitmentEmail(userEmail,commitmentTime,adminComment);
                                            return res.status(200).json({
                                                error: false,
                                                message: 'Commitment cancelled successfully'
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }
    });

}

// Export Purchase List As Excel
exports.exportCommitment = function(req, res) {
    var commitmentsData = [];
    var totalCommitedAmount = 0;
    var totalMaturityAmount = 0;
    var maturityTimeCompleted = 0;
    var populateQuery = {};
    var query = {};
    var viewLimit = 0;
    //var currentPage = (req.query.page ? req.query.page : 1);
    var skipRows = 0;
    var view = req.query.view;
    if (view) {
        var conditions = {
            'status': view
        };
    }
    var filter = req.query.filters;
    var populateQuery = [{
        path: 'portfoliomanagerId',
        select: 'name'
    }, {
        path: 'userid',
        select: 'name email'
    }];

    // get total records
    Commitments.count(conditions, function(err, resp){
        if(err){
            return next(res, err);
        }
        else{
            totalRecords = resp;
        }
    });


    Commitments.find(conditions)
        .populate(populateQuery)
        .exec(function(err, data) {
            if (err) {
                return next(res, err);
            }
            if (!data) {
                res.status(200).json({
                    message: 'No commitment found'
                });
            } else {
                data.forEach(function(info, index) {
                    var currentDate = new Date();
                    var maturityDays = (Math.floor(info.maturitydate.getTime() - info.startdate.getTime()) / 1000 / 60 / 60 / 24);
                    var CompletedDays = (Math.floor(currentDate.getTime() - info.startdate.getTime()) / 1000 / 60 / 60 / 24);
                    maturityTimeCompleted = Math.floor((CompletedDays / maturityDays) * 100);
                    // apply filter
                    if (filter) {
                        if (info.userid.name === filter || info.userid.email == filter) {
                            commitmentsData.push({
                                "id": info._id,
                                "userid": info.userid,
                                "packagename": info.packagename,
                                "amount": info.amount,
                                "status": info.status,
                                "cointype": info.cointype,
                                "maturityPeriod": info.maturityPeriod,
                                "startdate": info.startdate,
                                "maturitydate": info.maturitydate,
                                "maturityTimeCompleted": maturityTimeCompleted,
                                "createdat": info.createdat,
                                "portfoliomanager": info.portfoliomanagerId ? info.portfoliomanagerId.name : 'Trade Expert 1'
                            });
                        }
                    } else {
                        commitmentsData.push({
                            "id": info._id,
                            "userid": info.userid,
                            "packagename": info.packagename,
                            "amount": info.amount,
                            "status": info.status,
                            "cointype": info.cointype,
                            "maturityPeriod": info.maturityPeriod,
                            "startdate": info.startdate,
                            "maturitydate": info.maturitydate,
                            "maturityTimeCompleted": maturityTimeCompleted,
                            "createdat": info.createdat,
                            "portfoliomanager": info.portfoliomanagerId ? info.portfoliomanagerId.name : 'Trade Expert 1'
                        });
                    }
                });
                sendXlsFileAsOutput(commitmentsData, function(err, filename) {
                    if (err) {
                        return res.status(200).json({
                            success: false,
                            file: null
                        });
                    }
                    if (undefined != filename && '' != filename) {
                        return res.status(200).json({
                            success: true,
                            file: filename
                        });
                    }
                });
            }
        });
}

// Place Commitment in the DB.
exports.placeCommitment = function(req, res, next) {
    //Validate data.
    var amount = parseInt(req.body.amount);
    if (!amount && req.body.duration == '' && !req.body.duration) {
        return res.status(200).json({
            error: true,
            message: 'Validation Error ! Please check your commited amount and duration then try again'
        });
    }
    if(req.body && req.body.packagename && req.body.packagename.toLowerCase() != 'agile'){
      return res.status(200).json({
          error: true,
          message: 'Currently only agile package is enabled for commitments. Please select Agile pack and try again.'
      });
    }

    if (amount < config.apiConstants.MIN_COMMITMENT_LIMIT) {
        return res.status(200).json({
            error: true,
            message: 'Minimum commitment amount is ' + config.apiConstants.MIN_COMMITMENT_LIMIT
        })
    }

    // Check if user has sufficient amount in wallet.
    var balance = 0;
    var _Credits = new Credits();
    _Credits.getCredits(req.user._id, function(err, data) {
        if (err) {
            return handleError(res, err);
        } else {
            balance = data.usd;
            if (amount > balance.value) {
                return res.status(200).json({
                    error: true,
                    message: 'You do not have sufficient balance to commit,Please add fund and try again'
                });
            }

            //Finally create commitment.
            Commitments.create({
                userid: req.user._id,
                packagename: req.body.packagename,
                amount: amount,
                status: config.apiConstants.STATUS_COMMITTED,
                cointype: req.body.cointype,
                maturityPeriod: req.body.maturityPeriod,
                maturitydate: req.body.maturitydate,
                startdate: req.body.startdate,
                description: '',
            }, function(err, commitment) {
                if (err) {
                    return handleError(res, err);
                } else {
                    // Add in Transaction table and Removing USD amount from U1 credits
                    _Credits.updateCredits(req.user._id, {
                        usd: (amount * -1),
                        adscash: 0,
                        adcpacks: 0
                    }, function(err, data) {
                        console.log('USD Commited Amount Error : ', err, data);
                        if (err) {
                            return res.status(200).json({
                                error: true,
                                message: 'Unbale to Commit USD'
                            });
                        }
                    });

                    // Transfer logs in U1 creditlog
                    _Credits.addCreditTransferLog(req.user._id, {
                        amount: (amount * -1),
                        description: 'USD amount commited for ' + req.body.maturityPeriod + ' Months',
                        type: 'usd',
                        subtype: 'W',
                        cointype: 'usd'
                    }, function(err, data) {
                        console.log('Credit Log Info: ', err, data._id);
                        if (err) {
                            return res.status(200).json({
                                error: true,
                                message: 'Unbale to Commit USD'
                            });
                        }
                    });

                    // Trade logs
                    var _Commitmentslogs = new Commitmentslogs();
                    _Commitmentslogs.addTradeLog(req.user._id, {
                        commitmentid: commitment._id,
                        status: config.apiConstants.STATUS_COMMITTED,
                        startdate: req.body.startdate,
                        description: '',
                    }, function(err, data) {
                        console.log('Trade Log Info: ', err, data._id);
                        if (err) {
                            return res.status(200).json({
                                error: true,
                                message: 'Unbale to write trade Logs'
                            });
                        }
                    });

                    var dservice = new DistributionService();
                    dservice.distributeAdscashProductCredits(req.user._id, amount, 1, null, '', function(res) {
                        if (res)
                            console.log('commissions distributed.');
                        else
                            console.log('[Error] Unable to distribute commissions');
                        // payment.update({tech_comment: 'COMMISSION_RELEASED'}, console.log);
                    });

                    // Code for Mail after Commitment.
                    var emailService = new EmailService();
                    emailService.sendPlaceCommitmentMail({
                        mailTo: req.user.email,
                        name: req.user.name,
                        packagename: req.body.packagename,
                        amount: amount,
                        maturityPeriod: req.body.maturityPeriod,
                    });

                    return res.status(201).json({
                        error: false,
                        result: commitment,
                        message: "Your Commitment Placed Successfully."
                    });
                }
            });
        }
    });
}

// Withdraw Commitment in the DB.
exports.withdrawCommitment = function (req, res, next) {

    //Validate data.
    if (!req.body.commitmentId && req.body.commitmentId == '') {
        return res.status(200).json({
            error: true,
            message: 'Withdrawal Error! Please check your committed amount, which is not valid for withdrawal'
        });
    }
    var conditions = {
        "_id": req.body.commitmentId,
        "userid": req.user._id,
        "status": { "$nin": [config.apiConstants.STATUS_CANCELLED, config.apiConstants.STATUS_WITHDRAWN, config.apiConstants.STATUS_MATURED_WITHDRAWN] }
    };
    Commitments.findOne(conditions, function (err, commitmentData) {
        if (err) {
            return handleError(res, err);
        }
        if (!commitmentData) {
            return res.status(200).json({ error: true, message: 'Unable to process request.' });
        }
        var responseJSON = { error: true, message: 'Unable to process request.' };

        var adscashService = new AdscashService();
        adscashService.adsCashLiveRate(function (err, data) {
            if (JSON.parse(data.body).error) {
                console.log("[Error] Distribution service unable to get currency rate", err);
                return handleError(res, err);
            } else {
                    var isMature = (config.apiConstants.STATUS_MATURED == commitmentData.status );
                    var profitpercent = commitmentData.profit.value;
                    if (isMature) {
                        return processMatureProfitWithdrawal(commitmentData, data, req, responseJSON, res, profitpercent, req.body.withdrawType);
                    }else{
                        return processPreMatureCommitement(commitmentData, data, req, responseJSON, res, profitpercent);
                    }
            }
        });
    });
}

function processMatureProfitWithdrawal(commitmentData, data, req, responseJSON, res, profitpercent, withdrawType) {
    var amountInUSD = 0.00;
    var adsCash = 0;
    var maintenanceFee = 0.00;
    var profitAmount = 0.00;
    var totalprofitAmount = 0.00;
    var maintenanceFeePercentage = 0;
    var commitmentStatus = config.apiConstants.STATUS_MATURED_WITHDRAWN;
    var profitwithdrawn = parseFloat(commitmentData.profitwithdrawn.value || 0.0);

    var adsCashRate =  JSON.parse(data.body).data.rate;
    var withdrawalAmount = 0;
    if (commitmentData && commitmentData.amount)
        withdrawalAmount = commitmentData.amount.value;
    if (profitpercent) {
        totalprofitAmount = ((parseFloat(withdrawalAmount) * parseFloat(profitpercent)) / 100);
    }

    if (commitmentData.packagename) {
        if(totalprofitAmount > 0)
           maintenanceFeePercentage = config.trade_packages[commitmentData.packagename.toLowerCase()].maintenance_fee;

        if (totalprofitAmount) {
            maintenanceFee = ((parseFloat(totalprofitAmount) * parseFloat(maintenanceFeePercentage) / 100));
            profitAmount = Math.round((totalprofitAmount - maintenanceFee) * 100) / 100;
        }
        if(withdrawType != 'allAmount' && profitwithdrawn == 0.0){
            // Calculation Only for Profit.
            withdrawalAmount = profitAmount;
            amountInUSD = withdrawalAmount / 2;
            var adsCashAmount = (amountInUSD / adsCashRate);
            adsCash = roundOfAmount(req.user._id, 0, adsCashAmount, 'adscash');
            commitmentStatus = config.apiConstants.STATUS_MATURED_PROFIT_WITHDRAWN;
            commitmentData.profitwithdrawn = (parseFloat(profitAmount)+parseFloat(maintenanceFee)); /* profit withdrawal also include maintenance fee*/
        }else{
            withdrawalAmount = profitwithdrawn ? (withdrawalAmount) : (withdrawalAmount + profitAmount - profitwithdrawn);            
            amountInUSD = withdrawalAmount / 2;
            var adsCashAmount = (amountInUSD / adsCashRate);
            adsCash = roundOfAmount(req.user._id, 0, adsCashAmount, 'adscash');
        }

             commitmentData.status = commitmentStatus;
            //1. Update Withdrawal status
            commitmentData.save(function(cdErr) {
                if (cdErr) {
                    console.log('Withdrawal - Info: ', cdErr);
                    responseJSON.message = 'Withdrawal Error! status is not being change to withdrawn.';
                    return res.status(200).json(responseJSON);
                }

                //2. Add Withdrawal log into CommitmentLog
                var _Commitmentslogs = new Commitmentslogs();
                _Commitmentslogs.addTradeLog(req.user._id, {
                    commitmentid: req.body.commitmentId,
                    status: commitmentStatus,
                    startdate: req.body.currentDate,
                    description: '',
                }, function(clErr, clData) {
                    if (clErr) {
                        console.log('Withdrawal - Log Info: ', clErr, clData._id);
                        responseJSON.message = 'Withdrawal Error! Unable to write withdrawal Logs.';
                        return res.status(200).json(responseJSON);
                    }

                    //3. Update User Credit
                    var _Credits = new Credits();
                    _Credits.updateCredits(req.user._id, {
                        adscash: adsCash,
                        usd: amountInUSD,
                        adcpacks: 0
                    }, function(crdtErr, crdtData) {
                        if (crdtErr) {
                            console.log('Withdrawal - User Credit Error : ', crdtErr, crdtData);
                            responseJSON.message = 'Withdrawal Error! Unable to add user credit(AdsCash).';
                            return res.status(200).json(responseJSON);
                        }

                        //4. Add User Credit Logs for AdsCash Coins
                        UserCreditsLog.create({
                            userid: req.user._id,
                            coins: adsCash,
                            type: "adscash",
                            subtype: "W",
                            cointype: "adscash",
                            description: "Commitment withdrawal of " + amountInUSD + " USD id : "+ commitmentData._id,
                            createdat: req.body.currentDate
                        }, function(ucErr, ucData) {
                            if (ucErr) {
                                console.log('Withdrawal - User Credit Logs Error : ', ucErr, ucData);
                                responseJSON.message = 'Withdrawal Error! Unable to add user credit logs.';
                                return res.status(200).json(responseJSON);
                            }

                            //5. Add User Credit Logs for USD
                            UserCreditsLog.create({
                                userid: req.user._id,
                                coins: amountInUSD,
                                type: "usd",
                                subtype: "W",
                                cointype: "usd",
                                description: "Commitment withdrawal of " + amountInUSD + " USD id : "+ commitmentData._id,
                                createdat: req.body.currentDate
                            }, function(ucErr, ucData) {
                                if (ucErr) {
                                    console.log('Withdrawal - User Credit Logs Error : ', ucErr, ucData);
                                    responseJSON.message = 'Withdrawal Error! Unable to add user credit logs.';
                                    return res.status(200).json(responseJSON);
                                }

                                //6. Add Commission Logs for USD
                                var _Credits = new Credits();
                                _Credits.addCommissionLog(req.user._id, {
                                    amount: maintenanceFee,
                                    description: 'Commitment Maintenance Fee.',
                                    createdat: (new Date())
                                    }, function(_err, cmlog) {
                                        if (_err) {
                                            console.log('Withdrawal - Commission Logs Error : ', _err, cmlog);
                                            responseJSON.message = 'Withdrawal Error! Unable to add Commission Logs.';
                                            return res.status(200).json(responseJSON);
                                        }
                                        // return success message
                                        responseJSON.error = false;
                                        responseJSON.message = 'Withdrawal has been completed successfully.';
                                        responseJSON.status = commitmentStatus;

                                        var emailService = new EmailService();
                                        emailService.withdrawCommitmentEmail(req.user, withdrawalAmount, amountInUSD, adsCash);
                                        return res.status(200).json(responseJSON);
                                });
                            });
                        });
                    });
                });
            });
    }
    else {
            return res.status(200).json({error: true,message: 'Unable to process request.'});
    }
}

function processPreMatureCommitement(commitmentData, data, req, responseJSON, res, profitpercent) {
    var adsCashRate =  JSON.parse(data.body).data.rate;
    var amountInUSD = 0;
    var withdrawalAmount = 0;
    var totalprofitAmount = 0.00;
    var maintenanceFeePercentage = 0;
    var maintenanceFee = 0.00;
    var profitAmount = 0.00;

    if (commitmentData && commitmentData.amount)
        withdrawalAmount = commitmentData.amount.value;
    if (profitpercent) {
        totalprofitAmount = ((parseFloat(withdrawalAmount) * parseFloat(profitpercent)) / 100);
    }
    if (commitmentData.packagename) {
        if (totalprofitAmount > 0)
            maintenanceFeePercentage = config.trade_packages[commitmentData.packagename.toLowerCase()].maintenance_fee;

        if (totalprofitAmount) {
            maintenanceFee = ((parseFloat(totalprofitAmount) * parseFloat(maintenanceFeePercentage) / 100));
            profitAmount = Math.round((totalprofitAmount - maintenanceFee) * 100) / 100;
            withdrawalAmount = withdrawalAmount + profitAmount;
        }
        var adsCashAmount = (withdrawalAmount / adsCashRate);
        var roundedAdsCashAmount = roundOfAmount(req.user._id, 0, adsCashAmount, 'adscash');

        //1. Update Withdrawal status
        commitmentData.status = config.apiConstants.STATUS_WITHDRAWN;
        commitmentData.save(function (cdErr) {
            if (cdErr) {
                console.log('Withdrawal - Info: ', cdErr);
                responseJSON.message = 'Withdrawal Error! status is not being change to withdrawn.';
                return res.status(200).json(responseJSON);
            }

            //2. Add Withdrawal log into CommitmentLog
            var _Commitmentslogs = new Commitmentslogs();
            _Commitmentslogs.addTradeLog(req.user._id, {
                commitmentid: req.body.commitmentId,
                status: config.apiConstants.STATUS_WITHDRAWN,
                startdate: req.body.currentDate,
                description: '',
            }, function (clErr, clData) {
                if (clErr) {
                    console.log('Withdrawal - Log Info: ', clErr, clData._id);
                    responseJSON.message = 'Withdrawal Error! Unable to write withdrawal Logs.';
                    return res.status(200).json(responseJSON);
                }

                //3. Update User Credit
                var _Credits = new Credits();
                _Credits.updateCredits(req.user._id, {
                    adscash: roundedAdsCashAmount,
                    usd: 0,
                    adcpacks: 0
                }, function (crdtErr, crdtData) {
                    if (crdtErr) {
                        console.log('Withdrawal - User Credit Error : ', crdtErr, crdtData);
                        responseJSON.message = 'Withdrawal Error! Unable to add user credit(AdsCash).';
                        return res.status(200).json(responseJSON);
                    }

                    //4. Add User Credit Logs
                    UserCreditsLog.create({
                        userid: req.user._id,
                        coins: roundedAdsCashAmount,
                        type: "adscash",
                        subtype: "W",
                        cointype: "adscash",
                        description: "Commitment withdrawal of " + withdrawalAmount + " USD id : "+ commitmentData._id,
                        createdat: req.body.currentDate
                    }, function (ucErr, ucData) {
                        if (ucErr) {
                            console.log('Withdrawal - User Credit Logs Error : ', ucErr, ucData);
                            responseJSON.message = 'Withdrawal Error! Unable to add user credit logs.';
                            return res.status(200).json(responseJSON);
                        }

                        // return success message
                        responseJSON.error = false;
                        responseJSON.message = 'Withdrawal has been completed successfully.';
                        responseJSON.status = config.apiConstants.STATUS_WITHDRAWN;

                        var emailService = new EmailService();
                        emailService.preMatureWithdrawCommitmentEmail(req.user, withdrawalAmount, amountInUSD, roundedAdsCashAmount);
                        return res.status(200).json(responseJSON);
                    });
                });
            });
        });
    } else {
        return res.status(200).json({
            error: true,
            message: 'Unable to process request.'
        });
    }
}

exports.getPerDayInvestment = function(req, res, next) {
    var tillDate =new Date(req.query.date);
    var fromDate = new Date(req.query.date);
    fromDate.setDate(fromDate.getDate() - 7);
    Commitments.aggregate([{
        "$match": {
            "userid": {"$ne": null},
            "status": { "$nin":[config.apiConstants.STATUS_CANCELLED,config.apiConstants.STATUS_MATURED_WITHDRAWN,config.apiConstants.STATUS_WITHDRAWN]},
            "createdat": {
                $gt: fromDate,
                $lte: tillDate
            }
        }
    }, {
        $group: {
            _id: {
                $add: [{
                    $dayOfYear: "$createdat"
                }, {
                    $multiply: [400, {
                        $year: "$createdat"
                    }]
                }]
            },
            totalAmount: {
                $sum: "$amount"
            },
            totalUsers: {
                $sum: 1
            },
            date: {
                $min: "$createdat"
            },
            users: {
                $addToSet: '$userid'
            }
        }
    }], function(err, data) {
        if (err)
            return next(res, err);
        else if (!data)
            res.status(200).json({
                message: 'No data found'
            });
        else
            return res.status(200).json({
                error: false,
                result: data
            });

    });
}

// Roundof Amount and dump data in overlow bucket
function roundOfAmount(userId, level, amount, type) {
    var calAmount = 0,
        roundAmount = 0;
    calAmount = Math.floor(amount); // To get the amount only without decimal digit
    roundAmount = amount - calAmount;
    if (roundAmount > 0) {
        OverflowBkt.create({
            sponsorid: userId + '',
            level: level,
            amount: roundAmount,
            type: type
        }, function(_err, _d) {
            if (_err)
                console.log('[info] Round of take place and Overflow Bucket Have: ', userId, level, amount, roundAmount, _err);
        });
    }
    return calAmount;
}

function sendXlsFileAsOutput(data, cb) {
    // format data according to requirements
    var exportData = [];
    data.forEach(function(d) {
        /*var date = new Date(d.createdAt),
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
        }*/
        exportData.push({
            "createdAt": d.createdat,
            "Status": d.status,
            "User Id": d.userid._id,
            "User Name": d.userid.name,
            "User Email": d.userid.email,
            "Package Name": d.packagename,
            "Amount": d.amount,
            "Portfolio Manager": d.portfoliomanager,
            "Maturity Date": d.maturitydate,
            //additional Details
            "Maturity Period": d.maturityPeriod,
        });
    });
    var xls = json2xls(exportData);
    var filename = uuid.v1() + '.xlsx';
    var fd = fs.openSync(filename, 'w');
    fs.writeFile(filename, xls, 'binary');
    return cb(null, filename);
}

// Get list of Placed Commitments.
exports.unPickedAmountDetail = function(req, res, next) {
    Commitments.aggregate([{
        "$match": {"status": {"$in": [config.apiConstants.STATUS_COMMITTED]}}
      }, {
        $group: {
            _id: "$status",
            amount: {$sum: "$amount"},
            totalcommit: {$sum: 1},
            fromdate: {$min: "$createdat"},
            todate: {$max: "$createdat"},
            userscount: {$addToSet: '$userid'}
        }
    }], function(err, data) {
        if (err) {
            return handleError(res, err);
        } else {
            if (data) {
                return res.status(200).json({error: false,unpickedCommiments: data});
                // Commitments.aggregate([{
                //     "$match": {
                //         "status": {
                //             "$in": [config.apiConstants.STATUS_ON_TRADE]
                //         }
                //     }
                // }, {
                //     $group: {
                //         _id: "$portfoliomanagerId",
                //         amount: {
                //             $sum: "$amount"
                //         },
                //         totalcommit: {
                //             $sum: 1
                //         },
                //         fromdate: {
                //             $min: "$createdat"
                //         },
                //         todate: {
                //             $max: "$createdat"
                //         },
                //         userscount: {
                //             $addToSet: '$userid'
                //         }
                //     }
                // }], function(err, pickeddata) {
                //     if (err) {
                //         return handleError(res, err);
                //     } else {
                //         if (pickeddata) {
                //             pickeddata.forEach(function(info, index) {
                //                 User.findById(info._id, function(err, portfoliomanager) {
                //                     if (err) {
                //                         return next(res, err);
                //                     } else {
                //                         if (portfoliomanager) {
                //                             pickeddata[index].pmname = portfoliomanager.name;
                //                         }
                //                         if ((index + 1) === pickeddata.length) {
                //                             return res.status(200).json({error: false,unpickedCommiments: data,pickedCommiments: pickeddata});
                //                         }
                //                     }
                //                 });
                //             });
                //         }
                //     }
                // });
            }
        }
    });
}

exports.commitedAmountList = function(req, res, next) {
    var commitmentsDataNewData = [];
    Commitments.aggregate(
        [{
            "$match": {"status": {"$in": [config.apiConstants.STATUS_COMMITTED,config.apiConstants.STATUS_MATURED,config.apiConstants.STATUS_MATURED_PROFIT_WITHDRAWN]}}
        }, {
            $group: {
                _id: "$packagename",
                totalAmount: {$sum: "$amount"},
                totalProfit: {$sum: "$profit"},
                totalUsers: {$sum: 1},
                date: {$min: "$createdat"},
                users: {$addToSet: '$userid'}
            }
        }], function(err, commitmentsData) {
            if (err) {
                return handleError(res, err);
            } else {
              console.log("commitmentsData:", commitmentsData);
                if (commitmentsData) {
                  commitmentsData.forEach(function(info, index) {
                      commitmentsDataNewData.push({
                          "_id": info._id,
                          "totalAmount": info.totalAmount,
                          "totalUsers": info.totalUsers,
                          "profitpercent": info.totalProfit
                      });
                    });
                  return res.status(200).json({error: false,result: commitmentsDataNewData});
                }
            }
        });
}

exports.unPickedCommimentList = function(req, res, next) {
    Commitments.aggregate([{
        "$match": {
            "status": {
                "$in": [config.apiConstants.STATUS_COMMITTED]
            }
        }
    }], function(err, data) {
        if (err) {
            return handleError(res, err);
        } else {
            if (data) {
                return res.status(200).json({
                    error: false,
                    result: data
                });
            }
        }
    });
}

exports.pickCommiments = function(req, res, next) {
    //Validation
    if (req.body.selectedCommitments.length <= 0) {
        return res.status(200).json({
            error: true,
            message: 'Validation Error ! Please check your picked commiments list and try again'
        });
    }
    var data = req.body.selectedCommitments;
    data.forEach(function(info, index) {
        Commitments.findById(info._id, function(err, commitment) {
            if (err) {
                return next(res, err);
            } else {
                commitment.status = config.apiConstants.STATUS_ON_TRADE;
                commitment.portfoliomanagerId = req.user._id;
            }
            commitment.save(function(err) {
                if (err) {
                    return next(err);
                }
                // Trade logs
                var _Commitmentslogs = new Commitmentslogs();
                _Commitmentslogs.addTradeLog(req.user._id, {
                    commitmentid: info._id,
                    status: config.apiConstants.STATUS_ON_TRADE,
                    description: '',
                }, function(err, successdata) {

                    console.log('Trade Log Info: ', err, successdata._id);
                    if (err) {
                        return res.status(200).json({
                            error: true,
                            message: 'Unbale to write trade Logs'
                        });
                    }
                    if (data.length === (index + 1)) {
                        return res.status(201).json({
                            error: false,
                            message: 'updated'
                        });
                    }
                });
            });
        });
    });
}

exports.pickedCommimentList = function(req, res, next) {
    Commitments.aggregate([{
        "$match": {
            "status": {
                "$in": [config.apiConstants.STATUS_ON_TRADE]
            }
        }
    }, {
        $group: {
            _id: "$portfoliomanagerId",
            amount: {
                $sum: "$amount"
            },
            totalcommit: {
                $sum: 1
            },
            fromdate: {
                $min: "$createdat"
            },
            todate: {
                $max: "$createdat"
            },
            userscount: {
                $addToSet: '$userid'
            }
        }
    }], function(err, data) {
        if (err) {
            return handleError(res, err);
        } else {
            if (data) {
                return res.status(200).json({
                    error: false,
                    result: data
                });
            }
        }
    });
}

exports.latestInvestmentList = function(req, res, next) {
    var populateQuery = [{
        path: 'userid',
        select: 'name'
    }];
    Commitments.find({
            "$query": {"status": { "$nin":[config.apiConstants.STATUS_CANCELLED,config.apiConstants.STATUS_MATURED_WITHDRAWN,config.apiConstants.STATUS_WITHDRAWN]}}
        })
        .sort({
            "createdat": -1
        })
        .populate(populateQuery).limit(10)
        .exec(function(err, data) {
            if (err) {
                return next(res, err);
            }
            if (data) {
                res.status(200).json({
                    error: false,
                    result: data
                });
            }
        });
}

exports.pickedCommimentListByPM = function(req, res, next) {
    Commitments.aggregate([{
        "$match": {
            "status": {
                "$in": [config.apiConstants.STATUS_ON_TRADE]
            },
            "portfoliomanagerId": {
                "$in": [req.user._id]
            }
        }
    }], function(err, data) {
        if (err) {
            return handleError(res, err);
        } else {
            if (data) {
                return res.status(200).json({
                    error: false,
                    result: data
                });
            }
        }
    });
}

exports.getCommitmentsData = function(req, res, next) {
    co(function*() {
        let currentDate = new Date(),
            twentyFourhoursAgo = new Date(new Date().getTime() - (24 * 60 * 60 * 1000)),
            oneMonthBefore = new Date(),
            result = [];
        oneMonthBefore.setDate(oneMonthBefore.getDate() - 30);

        let oneDayCommitment = yield Commitments.aggregate([{
            "$match": {
                "userid": {"$ne": null},
                "status": { "$nin":[config.apiConstants.STATUS_CANCELLED,config.apiConstants.STATUS_MATURED_WITHDRAWN,config.apiConstants.STATUS_WITHDRAWN]},
                "createdat": {
                    $gte: twentyFourhoursAgo,
                    $lte: currentDate
                }
            }
        }, {
            "$group": {
                _id: null,
                totalAmount: {
                    $sum: '$amount'
                },
                totalCommitments: {
                    $sum: 1
                },
                users: {
                    $addToSet: '$userid'
                }
            }
        }]).exec();

        let monthCommitment = yield Commitments.aggregate([{
            "$match": {
                "userid": {"$ne": null},
                "status": { "$nin":[config.apiConstants.STATUS_CANCELLED,config.apiConstants.STATUS_MATURED_WITHDRAWN,config.apiConstants.STATUS_WITHDRAWN]},
                "createdat": {
                    $gte: oneMonthBefore,
                    $lte: currentDate
                }
            }
        }, {
            "$group": {
                _id: null,
                totalAmount: {
                    $sum: '$amount'
                },
                totalCommitments: {
                    $sum: 1
                },
                users: {
                    $addToSet: '$userid'
                }
            }
        }]).exec();


        let overallCommitment = yield Commitments.aggregate([{
            "$match": {
                "userid": {"$ne": null},
                "status": { "$nin":[config.apiConstants.STATUS_CANCELLED,config.apiConstants.STATUS_MATURED_WITHDRAWN,config.apiConstants.STATUS_WITHDRAWN]}
            }
        }, {
            $group: {
                _id: '',
                totalAmount: {
                    $sum: '$amount'
                },
                totalCommitments: {
                    $sum: 1
                },
                users: {
                    $addToSet: '$userid'
                }
            }
        }]).exec();

        if (oneDayCommitment && monthCommitment && overallCommitment) {
            return res.status(200).json({
                error: false,
                message: '',
                oneDay: oneDayCommitment,
                monthly: monthCommitment,
                overall: overallCommitment
            });
        } else {
            return res.status(200).json({
                error: true,
                message: 'Could not get commitments',
                oneDay: null,
                monthly: null,
                overall: null
            });
        }


    }).catch(function(err) {
        return res.status(200).json({
            error: true,
            message: err
        });
    });
}

exports.packagesProfitList = function(req, res) {
    Commitmentprofit.findOne({}).exec(function(err, cprofit) {
        if (err || !cprofit) {
            console.log('Error: While commitment profit list', err);
            res.status(200).json({
                commitmentprofitlist: []
            });
        } else {
            return res.status(200).json({
                commitmentprofitlist: cprofit
            });
        }
    })
}

exports.updateProfit = function(req, res, next) {
    var data = req.body.data;
    Commitmentprofit.update({}, {
        $set : {
            packages: data,
            updatedby: req.user._id,
            updatedon: new Date()
        }
    }, {
        upsert: true
    }).exec(function(err, cprofit) {
        if (err || !cprofit) {

        } else {
            console.log(cprofit);
            Commitmentprofitlog.create({
                packages: data,
                updatedby: req.user._id,
                updatedon: new Date()
            }, function (err, clog) {
                if (err) {

                } else {
                  /* update profits in all the current commitments with respective packs*/
                  data.forEach(function(pkgInfo){
                    Commitments.update({packagename : pkgInfo.packageName, status : config.apiConstants.STATUS_COMMITTED}, { $inc : { profit : parseFloat(pkgInfo.profitpercent) }}, {multi : true}, function(cuerr, cudata){
                        console.log("Commitments profits updated for ",pkgInfo, cuerr, cudata );
                    });
                  });
                  return res.status(200).json({error: false, result : []});
                }
            });

        }
    });
}

exports.profitLogList = function(req, res) {
    var populateQuery = [{
        path: 'updatedby',
        select: 'name'
    }];
    Commitmentprofitlog.find({}).populate(populateQuery).limit(20).sort({
        createdat: -1
     }).exec(function(err, data) {
        if (err) {
            console.log('Error: While commitment profit list', err);
            res.status(200).json({
                profitloglist: []
            });
        }
        return res.status(200).json({
            profitloglist: data
        });
    })
}

// Withdraw Commitment in the DB.
exports.commitmentWithdrawalInfo = function (req, res, next) {

    //Validate data.
    if (!req.query.commitmentId && req.query.commitmentId == '') {
        return res.status(200).json({
            error: true,
            message: 'Withdrawal Error! Please check your committed amount, which is not valid for withdrawal'
        });
    }
    var conditions = {
        "_id": req.query.commitmentId,
        "userid": req.user._id,
        "status": { "$nin": [config.apiConstants.STATUS_CANCELLED, config.apiConstants.STATUS_WITHDRAWN, config.apiConstants.STATUS_MATURED_WITHDRAWN] }
    };
    Commitments.findOne(conditions, function (err, commitmentData) {
        if (err) {
            return handleError(res, err);
        }
        if (!commitmentData) {
            return res.status(200).json({ error: true, message: 'Unable to process request.' });
        }

        var adscashService = new AdscashService();
        adscashService.adsCashLiveRate(function (err, data) {
            if (JSON.parse(data.body).error) {
                console.log("[Error] Distribution service unable to get currency rate", err);
                return res.status(200).json({ error: true, message: 'Sorry, Adscash Service is not responding. Please try again after sometime.' });
            } else {
                var isMature = (config.apiConstants.STATUS_MATURED == commitmentData.status );
                var profitpercent = commitmentData.profit.value;
                return CommitementAmountInfo(commitmentData, data, req, res, profitpercent, isMature);
            }
        });
    });
}

function CommitementAmountInfo(commitmentData, data, req, res, profitpercent = 0.00, isMature) {
    var amountInUSD = 0.00;
    var adsCash = 0;
    var maintenanceFee = 0.00;
    var profitAmount = 0.00;
    var totalprofitAmount = 0.00;
    var maintenanceFeePercentage = 0;
    var profitUSD = 0.00;
    var profitAdscash = 0;
    var profitwithdrawn = parseFloat(commitmentData.profitwithdrawn.value || 0);

    var adsCashRate = JSON.parse(data.body).data.rate;
    var withdrawalAmount = 0;
    if (commitmentData && commitmentData.amount)
        withdrawalAmount = commitmentData.amount.value;
    if (profitpercent) {
        totalprofitAmount = ((parseFloat(withdrawalAmount) * parseFloat(profitpercent)) / 100);
    }

    if (commitmentData.packagename) {
        if(totalprofitAmount > 0)
           maintenanceFeePercentage = config.trade_packages[commitmentData.packagename.toLowerCase()].maintenance_fee;

        if (totalprofitAmount) {
            maintenanceFee = ((parseFloat(totalprofitAmount) * parseFloat(maintenanceFeePercentage) / 100));
            profitAmount = Math.round((totalprofitAmount - maintenanceFee) * 100) / 100;
            }
            withdrawalAmount = withdrawalAmount + profitAmount;
            if(isMature){
                 withdrawalAmount = withdrawalAmount - profitwithdrawn;
                 amountInUSD = withdrawalAmount / 2;
                 var adsCashAmount = (amountInUSD / adsCashRate);
                 adsCash = Math.floor(adsCashAmount);

                 // Calculation Only for Profit.
                 profitUSD = profitAmount / 2;
                 var adsCashProfitAmount = (profitUSD / adsCashRate);
                 profitAdscash =  Math.floor(adsCashProfitAmount);

            }else{
                 var adsCashAmount = (withdrawalAmount / adsCashRate);
                 adsCash = Math.floor(adsCashAmount);
            }

            return res.status(200).json({
                error: false,
                data: {
                    AmountInUSD: amountInUSD,
                    AdsCash: adsCash,
                    MaintenanceFee: maintenanceFee,
                    Profitpercent : profitpercent,
                    ProfitAmount: profitAmount,
                    TotalprofitAmount: totalprofitAmount,
                    MaintenanceFeePercentage: maintenanceFeePercentage,
                    ProfitUSD :profitUSD,
                    ProfitAdscash :profitAdscash,
                    ProfitWithdrawan : profitwithdrawn,
                }
            });

        } else {
            return res.status(200).json({
                error: true,
                message: 'Unable to process request.'
            });
        }
}
