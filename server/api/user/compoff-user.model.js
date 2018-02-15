'use strict';

var mongoose  = require('mongoose');
var Schema    = mongoose.Schema;

var CompOffUserSchema = new Schema({
  userid: {type : String, required: true},
  name: String,
  email: { type: String, lowercase: true },
  countryName: String,
  countryCode: String,
  mobile: String,
  sponsor: String,
  createdat: { type: Date, "default": Date.now },
  username: { type: String, lowercase: true },
  isEnabled: {type: Boolean, default: false},
  level: {type: String},
  isDeleted:{type: Boolean, default: false}

});

module.exports = mongoose.model('CompOffUser', CompOffUserSchema);
