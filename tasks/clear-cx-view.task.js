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


var Users = require('./../server/api/user/user.model');

var ClearCxView = function() {

  var _self = this;

  _self.execute = function(cb) {

    Users.update({'role': {"$ne": 'user'}}, {"$set": {"currentcxview": null}}, {multi: true}, function(err, data) {
      return cb(err, data);
    })
  }

  return {
    execute: _self.execute
  }
}

module.exports = ClearCxView
