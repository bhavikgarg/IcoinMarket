'use strict';

var mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

var UserGatewaysInfoSchema = new Schema({
  userid: String,
  username: String,
  userfullname: String,
  email: String,
  paymentid: String,
  transactionid: String,
  quantity: { type: Number, "default": 0 },
  payamount: Number,
  depositorname: String,
  bankname: String,
  bankbranch: String,
  bankaddress: String,
  sortcode: String,
  accountnumber: String,
  comments: String,
  swiftid: String,
  status: String, // COMPLETED, PENDING, CANCELLED, PROCESSING, FAILED
  admincomments: String,
  adminbankaccount: String,
  goldpacks: Number,
  receiptpath: String,
  gateway : String, // Paypal, Bankwire etc
  txdate : Date,
  createdat: { type: Date, "default": Date.now },
  gatewaytxnId : String
});

module.exports = mongoose.model('UserGatewaysInfo', UserGatewaysInfoSchema);
