'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var ViewCampaignLogSchema = new Schema({
  campaignid: String,
  userid: String,
  createdAt: {type: Date, 'default': Date.now },
  impression: Boolean,
  logtype: {type: String, 'default': 'view'},
  silvercoins: Number,
  goldcoins: Number,
});

module.exports = mongoose.model('ViewCampaignLog', ViewCampaignLogSchema);
