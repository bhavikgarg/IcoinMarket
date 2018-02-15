'use strict';

var mongoose = require('mongoose');
var co = require('co');
var config = require('./../server/config/environment');


mongoose.connect(config.mongo.uri, config.mongo.options);
mongoose.connection.on('error', function(err) {
    console.error('MongoDB connection error: ' + err);
    process.exit(-1);
});

var LeaderboardModel = require('./../server/api/utilities/leaderboard.model');
var LeaderboardDataModel = require('./../server/api/utilities/leaderboard.data.model');

var Leaderboard = function() {
    var _self = this;

    _self.startWorker = function (callback) {
        var date=  new Date();
        date.setDate(date.getDate() - 7);
        var sevenDaysAgo = new Date(date);
        date = new Date();
        date.setDate(date.getDate() - 30);
        var oneMonthAgo = new Date(date);

        co(function*() {
            var maxDirectDataProcessed = yield _self.processMaxDirectsData(sevenDaysAgo, oneMonthAgo);
            if (!maxDirectDataProcessed.ok) {
                console.log("Error while fetching max directs data, All done!!!!");
                process.exit(0);
            } else {
                var maxTeamSizeDataProcessed = yield _self.processMaxTeamSizeData(sevenDaysAgo, oneMonthAgo);
                if (!maxTeamSizeDataProcessed.ok) {
                    console.log("Error while fetching max team size data, All done!!!!");
                    process.exit(0);
                } else {
                    return callback(false, 'All Done ...');
                }
            }
        });
    };

    _self.processMaxDirectsData = function *(sevenDaysAgo, oneMonthAgo) {
        var leaderboard7days = yield LeaderboardModel.aggregate([
          {$match: {createdat: {$gte: sevenDaysAgo}}},
          {$group: {
            _id: "$memberid",
            name: {$first: "$membername"},
            country: {$first: "$country"},
            users: {$sum: "$directs"},
          }},
          {$sort: {users: -1}},
          {$limit: 50}
        ]);

        var leaderboard30days = yield LeaderboardModel.aggregate([
            {$match: {createdat: {$gte: oneMonthAgo}}},
            {$group: {
              _id: "$memberid",
              name: {$first: "$membername"},
              country: {$first: "$country"},
              users: {$sum: "$directs"},
            }},
            {$sort: {users: -1}},
            {$limit: 50}
          ]);

        var leaderboardalltime = yield LeaderboardModel.aggregate([
              {$group: {
                _id: "$memberid",
                name: {$first: "$membername"},
                country: {$first: "$country"},
                users: {$sum: "$directs"},
              }},
              {$sort: {users: -1}},
              {$limit: 50}
            ]);

        return yield LeaderboardDataModel.update({category: 'maxDirects'}, {
            last7days: leaderboard7days,
            last30days: leaderboard30days,
            allTime: leaderboardalltime,
            flagUrl: config.flagUrl
        }, { upsert : true });
    }

    _self.processMaxTeamSizeData = function *(sevenDaysAgo, oneMonthAgo) {
        var leaderboard7days = yield LeaderboardModel.aggregate([
            {$match: {
              createdat: {$gte: sevenDaysAgo}
            }},
            {$group: {
              _id: "$memberid",
              name: {$first: "$membername"},
              country: {$first: "$country"},
              users: {$sum: "$members"},
            }},
            {$sort: {users: -1}},
            {$limit: 50}
          ]);

        var leaderboard30days = yield LeaderboardModel.aggregate([
          {$match: {
            createdat: {$gte: oneMonthAgo}
          }},
          {$group: {
            _id: "$memberid",
            name: {$first: "$membername"},
            country: {$first: "$country"},
            users: {$sum: "$members"},
          }},
          {$sort: {users: -1}},
          {$limit: 50}
        ]);

        var leaderboardalltime = yield LeaderboardModel.aggregate([
            {$group: {
              _id: "$memberid",
              name: {$first: "$membername"},
              country: {$first: "$country"},
              users: {$sum: "$members"},
            }},
            {$sort: {users: -1}},
            {$limit: 50}
          ]);

        return yield LeaderboardDataModel.update({category: 'maxTeamSize'}, {
            last7days: leaderboard7days,
            last30days: leaderboard30days,
            allTime: leaderboardalltime,
            flagUrl: config.flagUrl
        }, { upsert : true });
    }

    return {
        execute: _self.startWorker,
    }
}

module.exports = Leaderboard;
