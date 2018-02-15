/**
 * Payment model.
 * @module ci-server/payment-model
 */
'use strict';

var mongoose = require('mongoose'),
    Schema   = mongoose.Schema,
    autoInc  = require('mongoose-sequence');

/**
PaymentSchema<br>
- userid: String (User's "_id" from "users" collection, User who purchased gold, silver, products)<br>
- productid: String (Product's "_id" from "products" collection, but in case of "Gold", "Silver" packs this field value is "gold" or "silver")<br>
- productname: String (Name of the product)<br>
- quantity: Number (Purchase quantity, (i.e. If user purchase 5 Gold Packs its value is 5))<br>
- unitprice: Number (USD Amount of purchase)<br>
- unitcoins: Number (Number of coins user will get if his/her purchase quantity is 1)<br>
- paidamount: Number (Total amount user need to pay)<br>
- coins: Number (Coins user will earnned after successfull purchase)<br>
- paymode: String (Payment modes (i.e. Paypal, AdvCash, STP, Internal Credits (Denoted by: IC), Payza, etc))<br>
- paytoken: Object (Payment token we received through Payment Gateway (Applied in case of PayPal, but for others we generate this as {TOKEN: 'GENERATED_UUID1', STAUS: 'success'}))<br>
- gatewaysuccess: Object (Holds Success response, which we received from Gateway if payment is successfull)<br>
- gatewayfailure: Object (Holds Fail response, which we received from Gateway if payment is failed, cancelled)<br>
- active: Boolean (Purchase is completed successfully and this purchase is a valid purchase)<br>
- createdAt: {type: Date, default: Date.now} (When user purchase this)<br>
- seqPrefix: {type: Number, default: (new Date()).getFullYear()} (Invoice number prefix, according to this OrderId will automatically restart from one, its value is current year i.e. 2016 and next year its value become 2017)<br>
- orderId: Number (Numeric id of purchase based on seqPrefix)<br>
- status: String (Possiable values are "COMPLETED", "PENDING", "CANCELLED", "PROCESSING", "FAILED", "PENDING PAYMENT". If its value is "PENDING PAYMENT" that mean user click on "Pay Now" / "Buy Now" Button but close the popup when it ask to select "Payment Gateway")<br>
- paymentHash: String (Not In Use)<br>
*/
var PaymentSchema = new Schema({
  userid: String,
  icm: Boolean,
  productid: String,
  productname: String,
  quantity: Number,
  unitprice: Number,
  unitcoins: Number,
  paidamount: Number,
  coins: Number,
  gcused: Number,
  paymode: String,
  paymode2: String,
  paytoken: Object,
  gatewaydata: Object,
  gatewaysuccess: Object,
  gatewayfailure: Object,
  active: Boolean,
  createdAt: {type: Date, default: Date.now},
  seqPrefix: {type: Number, default: (new Date()).getFullYear()},
  orderId: Number,
  status: String, // COMPLETED, PENDING, CANCELLED, PROCESSING, FAILED, CIPENDING, CISUCCESS, CIREJECTED
  paymentHash: String,
  requirecredit: { type: Boolean, "default": true }, // For some products we don't need to add gold/silver coins in his wallet
  productsubtype: {type: String, "default": 'normal'},
  purchasemeta: Object,
  extrapayment : Object,
  productemailsent: { type: Boolean, "default": false },
  is_business_payment : { type: Boolean, "default": false },
  commission : Object,
  comment : String,
  tech_comment : String
});

PaymentSchema.plugin(autoInc, {id: 'orderId_inc', inc_field: 'orderId', reference_fields: ['seqPrefix']});
module.exports = mongoose.model('Payment', PaymentSchema);


  //db.payments.aggregate({$match: {status:'COMPLETED', active:true}}, {$group: {_id: "$paymode", total: {$sum: "$paidamount"}}})
