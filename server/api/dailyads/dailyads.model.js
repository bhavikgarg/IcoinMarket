// 'use strict';
//
// var mongoose = require('mongoose'),
//     Schema = mongoose.Schema;
//
// var DailyAdSchema = new Schema({
//   userid: {type: String, required: true},
//   purchaseid: {type: String, required: true},
//   pageurl: {type: String, required: true},
//   broadcaststart: { type: String, required: true, unique: true },
//   broadcastend: { type: String, required: true, unique: true },
//   comments: String,
//   active: { type: Boolean, "default": true },
//   expireAt: {type: Date, 'default': (+new Date()+(5*60*1000)), index: {expireAfterSeconds: 0}}
// }, { timestamps: true });
//
// var pageUrlPattern = /^(http(?:s)?\:\/\/[a-zA-Z0-9]+(?:(?:\.|\-)[a-zA-Z0-9]+)+(?:\:\d+)?(?:\/[\w\-]+)*(\.[a-zA-Z]{2,4})((\/[\w\-\s\%]+)*)((\/{0,1})\?[\w]+=[\w\-\s\%]+((\&[\w]+=[\w\-\s\%]+)*))*)$/;
//
// DailyAdSchema
//   .path('pageurl')
//   .validate(function(value, respond) {
//     if(!validatePresenceOf(value)) return respond(false);
//     if(value != 'N/A' && !pageUrlPattern.test(value)) return respond(false);
//     return respond(true);
//   }, 'Invalid URL');
//
// var validatePresenceOf = function(value) {
//   return value && value.trim().length;
// };
//
// module.exports = mongoose.model('DailyAd', DailyAdSchema);
