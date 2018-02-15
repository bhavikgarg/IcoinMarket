'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var AffiliatesLogSchema = new Schema({
  userid: String,
  target: String,
  logtype: String, // visit or signup
  createdat: { type: Date, "default": Date.now }
});

module.exports = mongoose.model('AffiliatesLog', AffiliatesLogSchema);
