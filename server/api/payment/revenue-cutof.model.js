/**
 * RevenueCutof model.
 * @module ci-server/revenuecutof-model
 */
'use strict';

var mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

/**
RevenueCutof Schema
- cutofvalue: Number,  (Max unit coins, which is distributed by the "Revenue Share" cycle)<br>
- createdat: { type: Date, "default": Date.now } (When value is set/changed)<br>
- expireat: { type: Date }, (When the set value is expired. This value is auto set when admin change the previously set "cutofvalue")<br>
- isactive: Boolean (Is this "cutofvalue" value is effective or not)<br>
@var
*/
var RevenueCutof = new Schema({
  cutofvalue: Number,
  createdat: { type: Date, "default": Date.now },
  expireat: { type: Date },
  isactive: Boolean
});

RevenueCutof
  .path('cutofvalue')
  .validate(function(value, respond) {
    if(value > 0 && value < 1) return respond(true);
    return respond(false);
  }, 'Revenue cutof value must be less then 1 and greater than 0');

module.exports = mongoose.model('RevenueCutof', RevenueCutof);
