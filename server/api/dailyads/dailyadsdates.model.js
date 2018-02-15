// 'use strict';
//
// var mongoose = require('mongoose'),
//     Schema = mongoose.Schema;
//
// var DailyAdDateSchema = new Schema({
//   adid: {type: String, required: true},
//   viewdate: {type: String, required: true, unique: true},
//   viewlink: {type: String, required: true},
//   expireAt: {type: Date, 'default': (+new Date()+(5*60*1000)), index: {expireAfterSeconds: 0}}
// }, { timestamps: true });
//
// module.exports = mongoose.model('DailyAdDate', DailyAdDateSchema);
