'use strict';
var crontab = require('node-crontab');
var CryptoMarketData = require('./tasks/crypto-market-data-update');

var jobId = crontab.scheduleJob("*/1 * * * *", function() {
  var lw = new CryptoMarketData();
    lw.execute(function(err, data){
      console.log("Job 'fetch crypto market data' error: ", err, data);
      process.exit(0);
    });
});