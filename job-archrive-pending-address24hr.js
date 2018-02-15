'use strict';

var crontab = require('node-crontab');
var archrivePendingAddresses = require('./tasks/archrive-allpendingrequest24hr');

var jobId = crontab.scheduleJob("0 */6 * * *", function() {

  let startDate = new Date();
  let endDate = new Date();
    startDate.setMinutes(startDate.getMinutes() - 60*12);
    endDate.setMinutes(endDate.getMinutes() - 60*6);


  var lw = new archrivePendingAddresses();
  lw.execute(startDate, endDate, function(err, data){
    console.log(err, data);
    process.exit(0);
  });
});
