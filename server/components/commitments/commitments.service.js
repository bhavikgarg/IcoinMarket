'use strict';

var _ = require('lodash');
var mongoose = require('mongoose');
var Commitments = require('../../api/commitments/commitments.model');
var config = require('../../config/environment');
var request = require('request');

module.exports = function() {
  var commitmentsService = {
    getOnTradeAmount: function (userid, callback) {
      return Commitments.aggregate(
        { "$match": {
        "userid" : mongoose.Types.ObjectId(userid),
        "status": { "$nin":[config.apiConstants.STATUS_WITHDRAWN,config.apiConstants.STATUS_CANCELLED]},
      }},
       { "$group": {
          _id: "$userid",
          usd: { "$sum": "$amount" }
       }}, callback);
    },
    getOnTradeAmountBeforeNoonOfSecondAugust: function (userid, callback) {
      return Commitments.aggregate(
        { "$match": {
        "userid" : mongoose.Types.ObjectId(userid),
        "status": { "$nin":[config.apiConstants.STATUS_WITHDRAWN,config.apiConstants.STATUS_CANCELLED]},
        "createdat": {$lt: new Date("2017-08-02T06:30:00Z") }
      }},
       { "$group": {
          _id: "$userid",
          usd: { "$sum": "$amount" }
       }}, callback);
    },
    getOnTradeAmountAfterNoonOfSecondAugust: function (userid, createdat, callback) {
      return Commitments.aggregate(
        { "$match": {
        "userid" : mongoose.Types.ObjectId(userid),
        "status": { "$nin":[config.apiConstants.STATUS_WITHDRAWN,config.apiConstants.STATUS_CANCELLED]},
        "createdat": {$lt: createdat }
      }},
       { "$group": {
          _id: "$userid",
          usd: { "$sum": "$amount" }
       }}, callback);
    }
  };
  return commitmentsService;
};
