'use strict';

var mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

var TransferUserSchema = new Schema({
  userid: { type: String, unique: true },
  token: { type: String },
  reqtype: { type: String },
  updatedat: { type: Date, "default": Date.now },
  rev: { type: Number }
});

TransferUserSchema.index({token: 1, rev: 1, reqtype: 1}, {unique: true})

module.exports = mongoose.model('TransferUser', TransferUserSchema);
