'use strict';

var Notifications = require('./notification.model');
var LatestSignup = require('../../api/utilities/latestsignups.model');
var config = require('../../config/environment');

module.exports = function() {
  var notificationService = {

    create: function (data, callback) {
      return Notifications.create({
        type: data.type,
        name: data.name,
        country: data.country,
        createdat: new Date()
      }, callback);
    },

    createSignupNotification: function (data, callback) {
        return LatestSignup.create({userid : data.userid, name : data.name, country : data.countryCode }, callback);
    },

    getSignupNotificationsData: function (callback) {
        var date = new Date();
        var tensecondsago = date - 10*1000;
        LatestSignup.find({ 'createdat': {$lt: date, $gt: tensecondsago} }, 'userid name country createdat', function(err, notifications) {
            if (!err) {
                var data = [];
                notifications.forEach(function(info) {
                  data.push({
                    "id" : info._id,
                    "name": info.name,
                    "country": info.country,
                    "flag": config.flagUrl.replace('FLAG_COUNTRY_CODE', (info.country == null ? 'oth' : info.country.toLowerCase())),
                    "signupDate": info.createdat
                  });
                });
                callback(false, data);
            } else {
                callback(true, err);
            }
        });
    },

    getNotificationData: function (callback) {
        var date = new Date();
        var tensecondsago = date - 10*1000;
        Notifications.find({ 'createdat': {$lt: date, $gt: tensecondsago} }, 'type name country createdat', function(err, notifications) {
            if (!err) {
                callback(false, {
                    date: date,
                    notifications: notifications
                });
            } else {
                callback(true, err);
            }
        });
    }

  }

  return notificationService;
}