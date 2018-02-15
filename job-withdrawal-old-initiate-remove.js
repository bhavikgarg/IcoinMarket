'use strict';

var crontab = require('node-crontab');
var RemoveOldInitiatedWithdrawal = require('./tasks/withdrawal-old-initiate-remove');

var jobId = crontab.scheduleJob("*/15 * * * *", function() {
      var lw = new RemoveOldInitiatedWithdrawal();
      lw.execute(function(err, data){
        console.log(err, data.result);
        process.exit(0);
      });
});
