'use strict';

var crontab      = require('node-crontab');
var DBSyncWorker = require('./tasks/virtual-income-worker');

var jobId = crontab.scheduleJob("*/7 * * * *", function() { //This will call this function every 7 minutes

  var dbsw = new DBSyncWorker();
  dbsw.execute();
});
