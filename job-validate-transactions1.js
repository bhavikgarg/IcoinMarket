'use strict';

var crontab = require('node-crontab');
var ValidateTransaction = require('./tasks/validate-transaction-and-trasferamount');

var jobId = crontab.scheduleJob("02 * * * *", function() {
    let startDate = new Date();
    let endDate = new Date();

      startDate.setMinutes(startDate.getMinutes() - 185);

      endDate.setMinutes(endDate.getMinutes() - 30);
  var lw = new ValidateTransaction();
  lw.execute(startDate, endDate, 2000, function(err, data){
    console.log(err, data);
    process.exit(0);
  });
});

var jobId = crontab.scheduleJob("32 * * * *", function() {
    let startDate = new Date();
    let endDate = new Date();

      startDate.setMinutes(startDate.getMinutes() - 182);
      endDate.setMinutes(endDate.getMinutes() - 32);
  var lw = new ValidateTransaction();
  lw.execute(startDate, endDate, 2000, function(err, data){
    console.log(err, data);
    process.exit(0);
  });
});

