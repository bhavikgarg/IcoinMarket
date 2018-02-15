'use strict';

var mongoose  = require('mongoose');
var Schema    = mongoose.Schema;

var CryptoMarketDataSchema = new Schema({
  currencyName: String,
  domain: String,
  type: String,
  data: Object,
  fromDate: { type: Date },
  tillDate: { type: Date },
  active: { type: Boolean, 'default': true },
  createdDate: { type: Date, "default": Date.now }
});

module.exports = mongoose.model('CryptoMarket', CryptoMarketDataSchema);