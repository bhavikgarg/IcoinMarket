/**
 * Push Notifications Service
 */

'use strict';

var NotificationService = require('./notification.service');

module.exports = function(server) {

    var io = require('socket.io').listen(server,  {'transports': ['websocket']});

    var notificationService = new NotificationService();
    setInterval(function() {
        notificationService.getSignupNotificationsData(function (err, notifications) {
            if (!err) {
                if (notifications && notifications.length != 0) {
                    console.log('******* notifications data : ', notifications.length);
                    io.sockets.emit('notification', notifications);
                }
            } else {
                console.error('Error while getting notification data :', err);
            }
        })
    }, 10000);

    io.sockets.on('connection', function () {
        console.log('%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% New User Connected');
    });

    io.sockets.on('disconnect', function () {
        console.log('%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% User disconnected');
    });
};