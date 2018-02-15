'use strict';

var crontab = require('node-crontab');
var archriveCompletedAddresses = require('./tasks/archrive-completed-addresses');

var jobId = crontab.scheduleJob("0 */6 * * *", function() {
    let startDate = new Date();
    let endDate = new Date();
        startDate.setMinutes(startDate.getMinutes() - 48*60);
        
  var lw = new archriveCompletedAddresses();
  lw.execute(startDate, endDate, function(err, data){
    console.log(err, data);
    process.exit(0);
  });
});
