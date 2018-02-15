'use strict';

var crontab = require('node-crontab');
var Circulation = require('./tasks/circulation-update');

var jobId = crontab.scheduleJob("*/15 * * * *", function() {

  var lw = new Circulation();
  lw.execute(function(err, data){
    console.log(err, data);
    process.exit(0);
  });
});
