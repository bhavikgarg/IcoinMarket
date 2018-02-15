'use strict';

var crontab = require('node-crontab');
var ValidateTransaction = require('./tasks/validate-transaction-and-trasferamount');

var jobId = crontab.scheduleJob("0 */1 * * *", function() {
    let startDate = new Date();
    let endDate = new Date();

      startDate.setMinutes(startDate.getMinutes() - 24*60);
      endDate.setMinutes(endDate.getMinutes() - 3*60);
  var lw = new ValidateTransaction(); 
  lw.execute(startDate, endDate, 5000, function(err, data){
    console.log(err, data);
    process.exit(0);
  });
});
