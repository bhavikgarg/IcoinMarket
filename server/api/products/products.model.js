'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var ProductsSchema = new Schema({
  name: String,
  amount: Number,
  coins: Number,
  ptype: String,
  active: Boolean,
  description: String,
  pimage: String,
  createdAt: {type: Date, default: Date.now},
  subtype: { type: String }
});

module.exports = mongoose.model('Products', ProductsSchema);
