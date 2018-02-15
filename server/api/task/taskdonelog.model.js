'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var TaskDoneLogSchema = new Schema({
  taskid: String,
  userid: String,
  exuserid: String,
  exusername: String,
  exposturl: String,
  createdat: { type: Date, 'default': Date.now },
  active: { type: Boolean, 'default': true }
});

module.exports = mongoose.model('TaskDoneLog', TaskDoneLogSchema);
