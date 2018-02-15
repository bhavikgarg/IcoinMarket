'use strict';
var co = require('co');
var config = require('./../../config/environment');
var User = require('../../api/user/user.model');

module.exports = function () {
  var userService = {
    checkIpLimit : function (ip,callback) {
      User.count({ip: ip}, function(err, count){
        console.log('From service' +count);
        //return count > 10 ? true : false;
        callback(err, count > 100);
      });
    },
    getBusinessUserRoles : function (cb) {
      var roles = config.businessRoles;
      if(roles && roles.length > 0){
        cb(false, roles);
      } else {
        cb(true, null);
      }
    },
    getPortfolioManagerRoles : function (cb) {
      var roles = config.porfolioManagerRoles;
      if(roles && roles.length > 0){
        cb(false, roles);
      } else {
        cb(true, null);
      }
    }
  }
  return userService;
}
