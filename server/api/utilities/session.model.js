/**
 * This model is used to clear the expired
 * session from DB
 */
'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Sessions = new Schema({
  _id: {type: String},
  session: {type: String},
  expires: {type: Date}
});

module.exports = mongoose.model('Session', Sessions);
