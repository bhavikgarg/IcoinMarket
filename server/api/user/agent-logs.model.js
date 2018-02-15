'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var AgentLogSchema = new Schema({
  agentid: String,
  userid: String,
  useremail: String,
  username: String,
  createdat: { type: Date, "default": Date.now }
});

module.exports = mongoose.model('AgentLog', AgentLogSchema);
