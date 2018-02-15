'use strict'

var mongoose = require('mongoose');
var config   = require('./../server/config/environment');

// Connect to database
mongoose.connect(config.mongo.uri, config.mongo.options);
mongoose.connection.on('error', function(err) {
	console.error('MongoDB connection error: ' + err);
	process.exit(-1);
	}
);


var Withdrawal = require('./../server/api/withdrawal/withdrawal.model');

var RemoveOldInitiatedWithdrawal = function() {
  var _self = this;
  _self.execute = function(cb) {
    let dt = new Date();
        console.log("Time : ",dt);
        dt.setMinutes(dt.getMinutes() - 15);
        Withdrawal.remove({"createdat": {"$lte": dt }, status : 'INITIATED'}, cb);
  }

  return {
    execute: _self.execute
  }
}

module.exports = RemoveOldInitiatedWithdrawal
