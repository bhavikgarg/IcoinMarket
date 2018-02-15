'use strict';

var crontab = require('node-crontab');
var ValidateTransaction = require('./tasks/validate-processing-transaction-and-trasferamount');

var jobId = crontab.scheduleJob("*/10 * * * *", function() {

  var lw = new ValidateTransaction();
  lw.execute(function(err, data){
    console.log(err, data);
    process.exit(0);
  });
});
