'use strict';

var mongoose         = require('mongoose');
var config           = require('./../server/config/environment');
var moment           = require('moment');
var co               = require('co');

mongoose.connect(config.mongo.uri, config.mongo.options);
mongoose.Promise = global.Promise;
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


var ProcessFixProfitCommitments = function() {

  var _self = this;
  _self.emailService = new EmailService();
  _self.commitmentLogService = new CommitmentLogService();

  _self.updateProfit = function* (){
    var today = moment().startOf('day');
    return yield Commitments.update({
        "status": config.apiConstants.STATUS_COMMITTED,
        "packagename" : { $in : config.fixed_profit.packages },
        "maturitydate": {
            $gt: today.toDate()
        }
    }, { $inc : { profit : config.fixed_profit.profitpercent}}, {multi : true});
  };

  _self.startWorker = function (callback) {
    co(function*(){
      let updatedProfit = yield _self.updateProfit();
      console.log("Profit updated :", updatedProfit);
      process.exit(0);
    }).catch(function(err){
      console.log("[Error] Unable to process profit share: "+err);
      process.exit(0);
    });
  };
  return {
    execute: _self.startWorker
  }
}

module.exports = ProcessFixProfitCommitments;
