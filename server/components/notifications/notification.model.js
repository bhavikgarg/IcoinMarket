'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var NotificationSchema = new Schema({
    type: String,
    name: String,
    country: String,
    createdat: {type: Date, "default": Date.now}
},
{ capped: {size: 5024, max: 50, autoIndexId: true } });

module.exports = mongoose.model('Notification', NotificationSchema);