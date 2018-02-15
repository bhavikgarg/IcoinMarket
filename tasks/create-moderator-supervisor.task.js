'use strict';

var mongoose         = require('mongoose');
var config           = require('./../server/config/environment');

mongoose.connect(config.mongo.uri, config.mongo.options);
mongoose.connection.on('error', function(err) {
	console.error('MongoDB connection error: ' + err);
	process.exit(-1);
	}
);


var Users = require('./../server/api/user/user.model');

var CreateUsers = function() {

  var _self   = this;
  _self.users = [
    {role: 'moderator', totalUsers: 10, suffix: '#@', esuffix: '@clickintensity.us'},
    {role: 'supervisor', totalUsers: 10, suffix: '!^#', esuffix: '@clickintensity.us'}
  ];
  _self.userObj = {
    "userProfileId": 0,
    "role": '',
    "provider": 'local',
    "password": '',
    "countryCode": 'US',
    "countryName": 'United States',
    "username": '',
    "name": '',
    "verified": true,
    "email": "",
    "mobile": "+1-1234567890",
    "sponsor": "569764a66110ef9f6810c2ea",
  };

  _self._createUser = function(start, len, data, callback) {

    if(start < len) {
      var name = data.role + '' + (start  + 1);
      _self.userObj.role = data.role;
      _self.userObj.password = name + data.suffix;
      _self.userObj.name = name;
      _self.userObj.email = name + data.esuffix;
      _self.userObj.username = name;

      console.log('>>> [info]', JSON.stringify(_self.userObj));
      Users.create(_self.userObj, function(err, obj) {

        console.log('[info] ', err);
        return _self._createUser((start+1), len, data, callback);
      });
    }
    else {
      callback(false, len + ' Users created with role ' + data.role);
    }
  }

  _self.startProcess = function(start, len, info, callback) {

    if(start < len) {
      var idx = start;
      return _self._createUser(0, info[idx].totalUsers, info[idx], function(error, status) {
        console.log(error, status, 'Move Next...');
        _self.startProcess((start + 1), len, info, callback);
      })
    }
    else {
      return callback(false, 'All Done...');
    }
  }

  _self.createUsers = function() {

    return _self.startProcess(0, _self.users.length, _self.users, function(err, info) {
      console.log(err, info);
      process.exit(0);
    })
  }

  return {
    execute: _self.createUsers
  }
}

var obj = new CreateUsers();
obj.execute();
