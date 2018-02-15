/**
 * RevenueDump model. <b>Not In Use</b>
 * @module ci-server/revenuedump-model
 */
'use strict';

var mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

var RevenueDumpSchema = new Schema({
  userid: String,
  amount: Number,
  createdat: { type: Date, "default": Date.now },
});

module.exports = mongoose.model('RevenueDump', RevenueDumpSchema);
