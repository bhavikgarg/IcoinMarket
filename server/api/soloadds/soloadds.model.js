'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var SoloaddsSchema = new Schema({
  title: String,
  linkurl: String,
  userid: String,
  clicks: Number,
  trackinglink: String,
  isaccepted: Boolean,
  acceptat: { type: Date },
  complateat: { type: Date },
  purchaseid: String,
  createdat: { type: Date, "default": Date.now }
});

module.exports = mongoose.model('Soloadds', SoloaddsSchema);
