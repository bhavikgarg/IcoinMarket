'use strict';

var mongoose         = require('mongoose');
var config           = require('./../server/config/environment');
var moment           = require('moment');
var co               = require('co');

mongoose.connect(config.mongo.uri, config.mongo.options);
mongoose.connection.on('error', function(err) {
  console.error('MongoDB connection error: ' + err);
  process.exit(-1);
  }
);


var CreditLogs = require('./../server/api/credits/credit-logs.model');
var CreditService = require('./../server/components/credits/credits.service');

var Commitments = require('./../server/api/commitments/commitments.model');
var Commitmentprofit = require('./../server/api/commitments/commitmentsprofit.model');
var CommitmentLogService = require('../server/components/commitments/commitmentsLogs.service');
var EmailService = require('../server/components/emails/email.service');


var ProcessCommitments = function() {

  var _self = this;
  _self.emailService = new EmailService();
  _self.commitmentLogService = new CommitmentLogService();

  var fourDaysBack = moment().subtract(4, 'days');
  var fiveDaysBack = moment().subtract(5,'days');
  var sixDaysBack = moment().subtract(6,'days');

  var populateQuery = [{
      path: 'userid',
      select: 'name email'
  }];

  _self.getData = function* (){
    var today = moment().startOf('day');
    var tomorrow = moment(today).add(1, 'days');
    return yield Commitments.find({
        "status": config.apiConstants.STATUS_COMMITTED,
        "maturitydate": {
            $gte: today.toDate(),
            $lt: tomorrow.toDate()
        }
    }).populate(populateQuery);
  };


  // Get All commitments matured 4 days ago
  _self.getData2 = function* () {
      var today = moment().startOf('day');
      var fromDate = moment(today).subtract(4, 'days');
      var toDate = moment(today).subtract(3, 'days');

      return yield Commitments.find({
          "status": { "$in": [config.apiConstants.STATUS_MATURED, config.apiConstants.STATUS_MATURED_PROFIT_WITHDRAWN] },
          "maturitydate": {
              $gte: fromDate.toDate(),
              $lt: toDate.toDate()
          }
      }).populate(populateQuery);
  }

    // Get All commitments matured 4 days ago
  _self.getData3 = function* () {
    var today = moment().startOf('day');
    var fromDate = moment(today).subtract(5,'days');
    var toDate = moment(today).subtract(4,'days');

    return yield Commitments.find({
        // "status": config.apiConstants.STATUS_MATURED,
        "status": { "$in":[config.apiConstants.STATUS_MATURED, config.apiConstants.STATUS_MATURED_PROFIT_WITHDRAWN]},
        "maturitydate": {
            $gte: fromDate.toDate(),
            $lt: toDate.toDate()
        }
    }).populate(populateQuery);
  }

  _self.processInfo = function(data, index, len, callback) {
    console.log("\n\r", '1. Processing For: ', index, len, "\n\r");
    if(index < len) {
        var commitment = data[index];
        console.log("Processing for Commitment :", commitment);
        Commitments.update({_id: Object(commitment._id)}, {$set: {status: config.apiConstants.STATUS_MATURED}}, function (err, cdata) {
            if (err || !cdata) {
                return _self.processInfo(data, (index + 1), len, callback);
            } else {

                 _self.commitmentLogService.addTradeLog(commitment.userid, {
                    commitmentid: commitment._id,
                    status: config.apiConstants.STATUS_MATURED,
                    description: 'Commitment matured'
                 }, function(err, ldata) {
                    console.log('Trade Log Info: ', err, ldata._id);
                    if (err || !ldata) {
                        console.log("Unable to create commitment log for this");
                    }
                      Commitmentprofit.findOne(function(err, cprofit) {
                          if (err || !cprofit) {
                              return res.status(200).json({error: true, message: 'Unable to process request.'});
                          } else {
                              var nextpackage = 'Fixed',
                                  profitpercent = 0;
                              cprofit.packages.forEach(function(plan, index) {
                                  if (plan.packageName == commitment.packagename) {
                                      nextpackage = (cprofit.packages[index+1] && cprofit.packages[index+1].packageName) || cprofit.packages[cprofit.packages.length -1].packageName;
                                      profitpercent = commitment.profit;
                                  }
                              });

                              var profitAmount = ((parseFloat(commitment.amount.value) * parseFloat(profitpercent.value))/ 100);
                              var finalCommitmentAmount = parseInt(commitment.amount.value) + parseFloat(profitAmount);

                               _self.emailService.updateCommitmentStatusMatureBySystem(commitment, finalCommitmentAmount, profitAmount);
                              return _self.processInfo(data, (index + 1), len, callback);
                          }
                      });
                });
            }
        });
    } else {
      return callback();
    }
  };

  _self.processInfo2 = function(data, index, len, callback) {
    console.log("\n\r", '2. Processing For: ', index, len, "\n\r");
    if(index < len) {
        var commitment = data[index];
        Commitmentprofit.findOne(function(err, cprofit) {
            if (err || !cprofit) {
                return res.status(200).json({error: true, message: 'Unable to process request.'});
            } else {
                var nextpackage = 'Fixed',
                    profitpercent = 0;
                cprofit.packages.forEach(function(plan, index) {
                    if (plan.packageName == commitment.packagename) {
                        nextpackage = (cprofit.packages[index+1] && cprofit.packages[index+1].packageName) || cprofit.packages[cprofit.packages.length -1].packageName;
                        profitpercent = commitment.profit;
                    }
                });
                var nextPlanMaturityPeriod = config.trade_packages[nextpackage.toLowerCase()].maturityPeriod;
                var today = moment();
                var lastDayofMaturity = moment(today).add(1,'days').set({hours: 4,minute:0,second:0,millisecond:0}).toDate();
                var profitAmount = ((parseFloat(commitment.amount.value) * parseFloat(profitpercent.value))/ 100);
                var finalCommitmentAmount = parseFloat(commitment.amount.value) + parseFloat(profitAmount);
                var profitWithdrawn = parseFloat(commitment.profitwithdrawn.value) || 0;
                if (commitment.status == config.apiConstants.STATUS_MATURED_PROFIT_WITHDRAWN) {
                    finalCommitmentAmount -= profitWithdrawn;
                }

                var commitmentData = {
                               nextPlanName :  nextpackage,
                               nextPlanMaturityPeriod : nextPlanMaturityPeriod,
                               lastDayofMaturity : lastDayofMaturity,
                               commitedAmount : parseFloat(commitment.amount.value),
                               maturedAmount : finalCommitmentAmount,
                               profitAmount :  profitAmount,
                               profitWithdrawn : profitWithdrawn
                };
                _self.emailService.withdrawalAutoProcessAlert(commitment, commitmentData);
               return _self.processInfo2(data, (index + 1), len, callback);
            }
        });
    } else {
      return callback();
    }
  };


  _self.processInfo3 = function(data, index, len, callback) {
    console.log("\n\r", '3. Processing For: ', index, len, "\n\r");
    if(index < len) {
        var commitment = data[index];
        console.log("Processing for Commitment :", commitment);
        Commitmentprofit.findOne(function(err, cprofit) {
            if (err || !cprofit) {
                return res.status(200).json({error: true, message: 'Unable to process request.'});
            } else {
                var nextpackage = 'Fixed',
                    profitpercent = 0;
                cprofit.packages.forEach(function(plan, index) {
                    if (plan.packageName == commitment.packagename) {
                        nextpackage = (cprofit.packages[index+1] && cprofit.packages[index+1].packageName) || cprofit.packages[cprofit.packages.length -1].packageName;
                        profitpercent = commitment.profit;
                    }
                });

                var today = moment();
                var maturityPeriod = config.trade_packages[nextpackage.toLowerCase()].maturityPeriod;
                var maturitydate = moment(today).add(maturityPeriod, 'months');
                var finalCommitmentAmount = parseInt(commitment.amount.value) + ((parseFloat(commitment.amount.value) * parseFloat(profitpercent.value))/ 100);
                var profitWithdrawn = parseFloat(commitment.profitwithdrawn.value) || 0;
                if (commitment.status == config.apiConstants.STATUS_MATURED_PROFIT_WITHDRAWN) {
                    finalCommitmentAmount -= profitWithdrawn;
                }
                Commitments.update({_id: Object(commitment._id)}, {
                    $set: {
                        status: config.apiConstants.STATUS_COMMITTED,
                        amount: finalCommitmentAmount,
                        packagename: nextpackage,
                        startdate: new Date(),
                        profitwithdrawn: 0.0,
                        profit : 0.0,
                        maturityPeriod: maturityPeriod,
                        maturitydate: maturitydate.toString()
                    }
                }, function (err, cdata) {
                    if (err || !cdata) {
                        return _self.processInfo3(data, (index + 1), len, callback);
                    } else {
                         _self.commitmentLogService.addTradeLog(commitment.userid, {
                            commitmentid: commitment._id,
                            status: config.apiConstants.STATUS_COMMITTED,
                            description: 'Commitment upgraded to ' + nextpackage + ' package at amount ' +  finalCommitmentAmount + ' USD.'
                         }, function(err, ldata) {
                            console.log('Trade Log Info: ', err, ldata._id);
                            if (err || !ldata) {
                                console.log("Unable to create commitment log for this");
                            }
                            _self.emailService.sendPlaceCommitmentMailBySystem(commitment, nextpackage, maturityPeriod, finalCommitmentAmount);
                            return _self.processInfo3(data, (index + 1), len, callback);
                        });
                    }
                });
            }
        });
    } else {
      return callback();
    }
  };

  _self.startWorker = function (callback) {
    co(function*(){
      let commitments = yield _self.getData();
      if(commitments && commitments.length > 0){
        _self.processInfo(commitments, 0, commitments.length, function(err, result){
        });
      }
      else{
        console.log("No records found to process ");
        process.exit(0);
      }
    }).catch(function(err){
      console.log("[Error] Unable to process verify commitments: "+err);
      process.exit(0);
    });
  };

  _self.startWorker2 = function (callback) {
    co(function*(){
      let commitments = yield _self.getData2();
      if(commitments && commitments.length > 0){
        _self.processInfo2(commitments, 0, commitments.length, function(err, result){

        });
      }
      else{
        console.log("2. No records found to process ");
        process.exit(0);
      }
    }).catch(function(err){
      console.log("[Error] Unable to process verify commitments: "+err);
      process.exit(0);
    });
  };

  _self.startWorker3 = function (callback) {
    co(function*(){
      let commitments = yield _self.getData3();
      if(commitments && commitments.length > 0){
        _self.processInfo3(commitments, 0, commitments.length, function(err, result){

        });
      }
      else{
        console.log("3. No records found to process ");
        process.exit(0);
      }
    }).catch(function(err){
      console.log("[Error] Unable to process verify commitments: "+err);
      process.exit(0);
    });
  };

  return {
    execute: _self.startWorker,
    execute2: _self.startWorker2,
    execute3: _self.startWorker3
  }
}

module.exports = ProcessCommitments;
