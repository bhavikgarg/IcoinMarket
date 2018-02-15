'use strict';

var mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

var OtpGenerationSchema = new Schema({
  userid: String,
  otp: String,
  type: String,
  isactive: { type: Boolean, "default": true },
  createdat: { type: Date, "default": Date.now }
  // expireAt: {type: Date, 'default': (+new Date()+(10*60*1000)), index: {expireAfterSeconds: 0}}
});

module.exports = mongoose.model('OtpGeneration', OtpGenerationSchema);
