'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var AffiliatesSchema = new Schema({
  userid: String,
  linktype: String,
  linkurl: String,
  linkname: String,
  isactive: Boolean,
  visitcount: { type: Number, "default": 0 },
  registercount: { type: Number, "default": 0 },
  reference: String,
  target: String,
  createdat: { type: Date, "default": Date.now },
  banner: {},
  landingpage: String,
  defaultLink: Boolean,
  userfriendlyurl: String,
  uniqueid: Number,
  memberid: String,
  landingpage1: String,
  userfriendlyurl1: String
});

module.exports = mongoose.model('Affiliates', AffiliatesSchema);
