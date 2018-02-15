'use strict';

var crontab = require('node-crontab');
var job = require('./tasks/processSendExcelEvery24Hours');

var jobId = crontab.scheduleJob("* * 7 * * *", function() {

  var jw = new job();
  jw.execute(function(err, data){
    console.log(err, data);
    process.exit(0);
  });
});
