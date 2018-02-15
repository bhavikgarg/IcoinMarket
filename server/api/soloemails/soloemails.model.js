// 'use strict';
//
// var mongoose = require('mongoose'),
//     Schema = mongoose.Schema;
//
// var SoloEmailSchema = new Schema({
//   subject: { type: String, required: true },
//   content: { type: String, required: true },
//   userid: { type: String, required: true },
//   replyto: { type: String, required: true },
//   purchaseid: { type: String, required: true, unique: true },
//   broadcastdate: { type: String, required: true, unique: true },
//   comments: String,
//   active: { type: Boolean, 'default': true },
// }, { timestamps: true });
//
// module.exports = mongoose.model('SoloEmail', SoloEmailSchema);
