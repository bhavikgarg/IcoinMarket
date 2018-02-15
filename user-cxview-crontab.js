'use strict';

var crontab = require('node-crontab');
var UserCXViewWorker = require('./tasks/clear-cx-view.task');

var jobId = crontab.scheduleJob("*/15 * * * *", function() { //This function will run every hour at 01 minute

  var scw = new UserCXViewWorker();
  scw.execute(function(err, data) {
    console.log(err, data);
    process.exit(0);
  });
});
