'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var CallerLogSchema = new Schema({
  callerid: String,
  callername :String,
  userid: String,
  useremail: String,
  username: String,
  callStatus : String,
  createdat: { type: Date, "default": Date.now }
});

module.exports = mongoose.model('CallerLog', CallerLogSchema);
