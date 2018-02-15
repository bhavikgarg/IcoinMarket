'use strict';

var crontab = require('node-crontab');
var Leaderboard = require('./tasks/leaderboard');

//var jobId = crontab.scheduleJob("*/45 * * * *", function() {
  var lw = new Leaderboard();
  lw.execute();
//});

var flushJob1 = crontab.scheduleJob("* * 0 * * *", function() {
  var lw = new Leaderboard();
  lw.flushLock(function(e, d) {
    console.log('Leaderboard Worker Lock Flush: ', e, d);
    process.exit(0);
  });
});


var flushJob2 = crontab.scheduleJob("* * 12 * * *", function() {   
  var lw = new Leaderboard();
  lw.flushLock(function(e, d) {
    console.log('Leaderboard Worker Lock Flush: ', e, d);
    process.exit(0);
  });
});
