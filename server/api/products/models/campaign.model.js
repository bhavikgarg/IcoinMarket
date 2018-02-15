'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var CampaignSchema = new Schema({
  name: String,
  amount: Number,
  coins: Number,
  ptype: String,
  active: Boolean,
  createdAt: {type: Date, default: Date.now}
});

module.exports = mongoose.model('Campaign', CampaignSchema);
