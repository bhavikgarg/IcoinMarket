'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Leaderboard = new Schema({
  memberid: String,
  membername: String,
  createdat: { type: Date, default : new Date() },
  country: String,
  members: Number,
  directs: Number
});

module.exports = mongoose.model('leaderboard', Leaderboard);
