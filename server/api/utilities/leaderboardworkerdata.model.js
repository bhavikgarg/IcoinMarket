'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var LeaderboardWorkerData = new Schema({
  lastprocessedat: { type: Date },
  laststartat: {type: Date },
  status: String,   // 'new', 'processing', 'processed'
  queuename: String,  // 'leaderboard-max-directs', 'leaderboard-max-teamsize'
  recordid: Number,
  recordtime: { type: Date }
});

module.exports = mongoose.model('leaderboardworkerdata', LeaderboardWorkerData);
