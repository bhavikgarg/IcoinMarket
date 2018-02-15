'use strict';

var crontab = require('node-crontab');
var ValidateTransaction = require('./tasks/validate-transaction-and-trasferamount');

var jobId = crontab.scheduleJob("*/5 * * * *", function() {
    let startDate = new Date();
    let endDate = new Date();
      startDate.setMinutes(startDate.getMinutes() - 35);
      endDate.setMinutes(endDate.getMinutes() - 5);

  var lw = new ValidateTransaction();
  lw.execute(startDate, endDate, 500, function(err, data){
    console.log(err, data);
    process.exit(0);
  });
});
