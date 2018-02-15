'use strict';

var crontab = require('node-crontab');
var ProcessCommitmentsProfit = require('./tasks/process-commitments-profit');

// Find agile pack commitments and provide a fix amount of profit.
var job1 = crontab.scheduleJob("0 */6 * * *", function() { // Every 6 Hour
  var lw = new ProcessCommitmentsProfit();
  lw.execute(function(err, data){
    console.log(err, data);
    process.exit(0);
  });
});
