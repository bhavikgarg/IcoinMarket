'use strict';

var mongoose = require('mongoose');
require('mongoose-double')(mongoose);
var Schema = mongoose.Schema,
    SchemaTypes = Schema.Types;

var CommissionLogsSchema = new Schema({
  userid: String,
  coins: SchemaTypes.Double,
  desc: String,
  createdat: {type: Date, default: Date.now},
});

/**
 * Calculate commission details for specific userId
 * for allTime (i.e. till now), previousDay (i.e. last Day),
 * last7Days, last30Days, last365Days
 */
CommissionLogsSchema.methods.getCommissionDetails = function(userId) {
  var previousDay = new Date(),
      last7Days   = new Date(),
      last30Days  = new Date(),
      last365Days = new Date();

  previousDay.setDate(previousDay.getDate() - 1);
  previousDay.setMinutes(0); previousDay.setHours(0); previousDay.setSeconds(0);
  last7Days.setDate(last7Days.getDate() - 7);
  last7Days.setMinutes(0); last7Days.setHours(0); last7Days.setSeconds(0);
  last30Days.setDate(last30Days.getDate() - 30);
  last30Days.setMinutes(0); last30Days.setHours(0); last30Days.setSeconds(0);
  last365Days.setDate(last365Days.getDate() - 365);
  last365Days.setMinutes(0); last365Days.setHours(0); last365Days.setSeconds(0);

  return this.model('CommissionLog').aggregate([
    {"$match": {"userid": userId+''}},
    {"$group": {
      "_id": "$userid",
      "previousDay": {"$sum":{"$cond":{"if": {"$gte": ["$createdat", previousDay]}, "then": "$coins", "else": 0}}},
      "last7Days": {"$sum":{"$cond":{"if": {"$gte": ["$createdat", last7Days]}, "then": "$coins", "else": 0}}},
      "last30Days": {"$sum":{"$cond":{"if": {"$gte": ["$createdat", last30Days]}, "then": "$coins", "else": 0}}},
      "last365Days": {"$sum":{"$cond":{"if": {"$gte": ["$createdat", last365Days]}, "then": "$coins", "else": 0}}},
      "coins": {"$sum": "$coins"}
    }}
  ]);
};

module.exports = mongoose.model('CommissionLog', CommissionLogsSchema);
