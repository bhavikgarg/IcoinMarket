'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var WithdrawalLogSchema = new Schema({
  userid: String,
  withdrawalid: String,
  feedetails: String,
  feeamount: Number,
  createdat: { type: Date, 'default': Date.now },
  updatedat: { type: Date, 'default': Date.now }
});

module.exports = mongoose.model('WithdrawalLog', WithdrawalLogSchema);
