// 'use strict';
//
// var mongoose = require('mongoose'),
//     Schema = mongoose.Schema;
//
// var ViewCampaignSchema = new Schema({
//   campaignid: String,
//   userid: String,
//   impression: Boolean,
//   logtype : String,
//   expireAt: {type: Date, 'default': (+new Date()+(24*60*60*1000)), index: {expireAfterSeconds: 0}}
// });
//
// module.exports = mongoose.model('ViewCampaign', ViewCampaignSchema);
