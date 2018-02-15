'use strict';

var mongoose         = require('mongoose');
var config           = require('./../server/config/environment');
var co = require('co');

mongoose.connect(config.mongo.uri, config.mongo.options);
mongoose.set('debug', true);
mongoose.connection.on('error', function(err) {
  console.error('MongoDB connection error: ' + err);
  process.exit(-1);
  }
);


var Commitments = require('./../server/api/commitments/commitments.model');
var CommitmentProfitLogs = require('./../server/api/commitments/commitmentsprofit-logs.model');


var FixProfit = function() {

  var _self = this;
  _self.getData = function* (){
    return yield Commitments.find({});
  };

  _self.processInfo = function(data, index, len, callback) {
    console.log("\n\r\n\r", 'Processing For: ', index, len, "\n\r\n\r");
    if(index < len) {
       var commitment = data[index];
       console.log("Processing for Commitment :", commitment);

       CommitmentProfitLogs.find({createdat : {$gte : commitment.createdat}}, function(cplerr, cpldata){
          if(cplerr || cpldata.length == 0){
            console.log("Unable to update commitment profit. ",cplerr, cpldata);
            return callback();
          }
          else{
            let profit = 0;
            for (var i = 0; i < cpldata.length; i++) {
              let cpl = cpldata[i];
              var profitpercent = cpl.packages.filter(function(data) {
                if (data.packageName == commitment.packagename)
                    return data.profitpercent;
              });
              console.log(profitpercent[0].profitpercent);
              console.log(typeof(profitpercent[0].profitpercent));
              profit = (profit+parseFloat(profitpercent[0].profitpercent));
            }
            commitment.update({profit : profit}, function(cuerr, cudata){
              if(cuerr || !cudata){
                 console.log("Unable to update commitment profit. ",cuerr, cudata);
                 return callback();
              } else {
                  return _self.processInfo(data, (index + 1), len, callback);
              }
            });
          }
       });
    } else {
      return callback();
    }
  };

  _self.startWorker = function (callback) {
    co(function*(){
      let commitments = yield _self.getData();
      if(commitments && commitments.length > 0){
        _self.processInfo(commitments, 0, commitments.length, function(err, result){
        });
      }
      else{
        console.log("No records found to process ");
        process.exit(0);
      }
    }).catch(function(err){
      console.log("[Error] Unable to process verify commitments: "+err);
      process.exit(0);
    });
  };

  return {
    execute: _self.startWorker
  }
}

var FixProfit = new FixProfit();

//setTimeout(function () {
    FixProfit.execute(function(err, data){
      console.log(err, data);
    //  process.exit(0);
    });
//}, 15000);
