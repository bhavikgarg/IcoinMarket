'use strict';

var mongoose  = require('mongoose');
var Schema    = mongoose.Schema;

var PremiumUserSchema = new Schema({
  userid: {type : String, required: true},
  name: String,
  email: { type: String, lowercase: true },
  createdat: { type: Date, "default": Date.now },
  username: { type: String, lowercase: true },
  isActive: {type: Boolean, default: false}
});

module.exports = mongoose.model('PremiumUser', PremiumUserSchema);
