'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var WithdrawalSchema = new Schema({
  userid: String,
  userfullname: String,
  username: String,
  useremail: String,
  creditlogid: String,
  withdrawaltype : String,
  requestedadscash: {type : Number, default : 0},
  requestedusd: {type : Number, default : 0},
  feedetails: String,
  feeamount: Number,
  repurchasedamount : Number,  // 20 % of requested
  withdrawamount: Number,   // 78 % of requested
  btcamount: Number,    // equivalent BTC amount of 78% of usdAmount
  adscashcoins: Number,     // coins of value of 20 % of requestedusd
  transferthrough: String,
  createdat: { type: Date, 'default': Date.now },
  updatedat: { type: Date, 'default': Date.now },
  status: String,  // Pending, Completed, Cancelled, Returned, Initiated
  transactionid: String,
  admincommentcomplete: String,
  admincommentreturn: String,
  admincommentcancel: String,
  gatewaysuccess: Object,
  gatewayfailure: Object,
  creditaccount: String,   // user block chain address
  currentbtcrate: Number
  // expireAt: {type: Date, 'default': (+new Date()+(5*60*1000)), index: {expireAfterSeconds: 0}}
});

module.exports = mongoose.model('Withdrawal', WithdrawalSchema);
