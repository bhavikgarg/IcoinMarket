/**
 * Currency rate model.
 * @module ci-server/currency-rate-model
 */
'use strict';

var mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

/**
CurrencyRate Schema
- cutofvalue: Number,  (Max unit coins, which is distributed by the "Revenue Share" cycle)<br>
- createdat: { type: Date, "default": Date.now } (When value is set/changed)<br>
- expireat: { type: Date }, (When the set value is expired. This value is auto set when admin change the previously set "cutofvalue")<br>
- isactive: Boolean (Is this "cutofvalue" value is effective or not)<br>
@var
*/
var CurrencyRate = new Schema({
  rate: Number,
  currency : { type: String, "default": 'adscash' },
  createdat: { type: Date, "default": Date.now },
  expireat: { type: Date },
  isactive: Boolean
});

CurrencyRate
  .path('rate')
  .validate(function(value, respond) {
    if(value > 0 && value < 1000) return respond(true);
    return respond(false);
  }, 'Currency rate value must be less then 1000 and greater than 0');

module.exports = mongoose.model('CurrencyRate', CurrencyRate);
