'use strict';

var crontab      = require('node-crontab');
var ReferralSync = require('./tasks/virtual-income-worker');

var jobId = crontab.scheduleJob("*/3 * * * *", function() { //This will call this function every 3 minutes

  var rsw = new ReferralSync();
  rsw.execute();
});
