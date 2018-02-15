'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var EmailVerifySchema = new Schema({
  userId: String,
  customText: String
});

module.exports = mongoose.model('EmailVerify', EmailVerifySchema);
