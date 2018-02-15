'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var LeaderboardData = new Schema({
    category: String,
    allTime: [new Schema({
        country: String,
        name: String,
        users: Number
    })],
    last7days: [new Schema({
        country: String,
        name: String,
        users: Number
    })],
    last30days: [new Schema({
        country: String,
        name: String,
        users: Number
    })],
    flagUrl: String
});

module.exports = mongoose.model('leaderboarddata', LeaderboardData);
