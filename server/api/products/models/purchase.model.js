'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var PurchaseSchema = new Schema({
  productId: String,
  userId: String,
  quantity: Number,
  amount: Number,
  coins: Number,
  status: String,
  paidBy: String,
  active: Boolean,
  createdAt: {type: Date, default: Date.now}
});

module.exports = mongoose.model('Purchase', PurchaseSchema);
