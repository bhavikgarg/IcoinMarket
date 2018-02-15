'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var MessageSchema = new Schema({
  subject: String,
  description: String,
  createdat: { type: Date, "default": Date.now }
});

module.exports = mongoose.model('TeamMessage', MessageSchema);
