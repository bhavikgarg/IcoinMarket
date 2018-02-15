'use strict';

var crontab = require('node-crontab');
var UpdateADCPacks = require('./tasks/updateGenealogyAdcPacks');

var jobId = crontab.scheduleJob("0 0 * * *", function() {

  var jw = new UpdateADCPacks();
  jw.execute(function(err, data){
    console.log(err, data);
    process.exit(0);
  });
});
