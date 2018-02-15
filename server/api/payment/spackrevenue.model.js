/**
 * SPackRevenue model.
 * @module ci-server/spackrevenue-model
 */
'use strict';

var mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

/**
SPackRevenue Schema
- userid: String (User's "_id" from "users" collection)<br>
- amount: Number (Always 0)<br>
- coins: Number (Number of coins user received during current revenue share cycle)<br>
- isactive: Boolean (Record is active or not)<br>
- createdat: { type: Date, "default": Date.now } (When record is created)<br>
*/
var SPackRevenueSchema = new Schema({
  userid: String,
  amount: Number,
  coins: Number,
  isactive: Boolean,
  createdat: { type: Date, "default": Date.now },
});

module.exports = mongoose.model('SPackRevenue', SPackRevenueSchema);
