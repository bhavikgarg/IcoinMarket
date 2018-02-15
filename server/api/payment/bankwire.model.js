/**
 * BankWire model.
 * @module ci-server/bankwire-model
 */
'use strict';

var mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

/**
BankWire Schema:
- userid: String (User's "_id" from "users" collection, User who want to pay through "Bank Wire")<br>
- username: String (User's "username" from "users" collection, User who want to pay through "Bank Wire")<br>
- userfullname: String (User's "name" from "users" collection, User who want to pay through "Bank Wire")<br>
- email: String  (User's "email" from "users" collection, User who want to pay through "Bank Wire")<br>
- paymentid: String (Payment's "_id" from "payments" collection)<br>
- transactionid: String (A unique transaction id generated as 'BW-CURRENT_YEAR-PAYMENT_COLLECTION_ORDER_ID(CURRENT_MONTH - 1)', Example: If CURRENT_YEAR = 2016, PAYMENT_COLLECTION_ORDER_ID = 7301, CURRENT_MONTH = June (i.e. 6); then this field value is 'BW-2016-73015')<br>
- payamount: Number (Amount user will pay)<br>
- depositorname: String (Name of the Depositor (i.e. In Bankwire form))<br>
- bankname: String (Name of the Bank in which user deposit the amount)<br>
- bankbranch: String (Name of the Bank branch where use deposit the amount)<br>
- bankaddress: String (Address of the Bank)<br>
- sortcode: String (Bank's sortcode (i.e. In India it called IFSC code))<br>
- accountnumber: String (User's Bank account number)<br>
- comments: String (Any comment given by User)<br>
- swiftid: String (Bank's swift id in which payment is received)<br>
- status: String, // COMPLETED, PENDING, CANCELLED, PROCESSING, FAILED<br>
- admincomments: String (Comment given by Admin which confirms that payment is received by CI)<br>
- adminbankaccount: String (Bank account number where payment is received)<br>
- goldpacks: Number (Number of packs requested by the CI user)<br>
- receiptpath: String (Uploaded Bankwire form receipt image. When user pay in bank through Bankwire form, he gets the receipt and used needs to upload this receipt)<br>
- createdat: { type: Date, "default": Date.now } (When Bankwire request is created by user)<br>
@var
*/
var BankWireSchema = new Schema({
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
  createdat: { type: Date, "default": Date.now }
});

module.exports = mongoose.model('Bankwire', BankWireSchema);
