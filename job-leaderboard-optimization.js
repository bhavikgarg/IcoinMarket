'use strict';

var crontab = require('node-crontab');
var LeaderboardData = require('./tasks/leaderboard-data-optimization');

var jobId = crontab.scheduleJob("*/1 * * *", function() {
    var lw = new LeaderboardData();
    lw.execute(function(err, data){
      console.log(err, data);
      process.exit(0);
    });
});
