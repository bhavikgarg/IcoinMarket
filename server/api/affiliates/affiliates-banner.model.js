'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var AffiliatesBannerSchema = new Schema({
  userid: String,
  bannername: String,
  bannerwidth: Number,
  bannerHeight: Number,
  bannerimage: String,
  bannerviewhtml: String,
  createdat: { type: Date, "default": Date.now },
  isactive: { type: Boolean, "default": true },
  target: String,
  linkurl: String
});

module.exports = mongoose.model('AffiliatesBanner', AffiliatesBannerSchema);
