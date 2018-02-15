'use strict';

var crontab = require('node-crontab');
var ProcessCommitment = require('./tasks/process-commitments-status');

// Find commitments matured on today and update their status to Matured
var job1 = crontab.scheduleJob("00 04 * * *", function() { // Every day at 04:00 GMT Time
  var lw = new ProcessCommitment();
  lw.execute(function(err, data){
    console.log(err, data);
    process.exit(0);
  });
});

// Find commitments matured 4 days ago and send reminder email
var job2 = crontab.scheduleJob("05 04 * * *", function() { // Every day at 04:05 GMT Time
  var lw = new ProcessCommitment();
  lw.execute2(function(err, data){
    console.log(err, data);
    process.exit(0);
  });
});


// Find commitments matured 5 days ago and send reminder email
var job3 = crontab.scheduleJob("10 04 * * *", function() { // Every day at 04:10 GMT Time
  var lw = new ProcessCommitment();
  lw.execute3(function(err, data){
    console.log(err, data);
    process.exit(0);
  });
});