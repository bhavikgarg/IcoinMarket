'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var TaskSchema = new Schema({
  title: String,
  description: String,
  tasksteps: String,
  tasklink: String,
  active: { type: Boolean, 'default': true },
  createdat: { type: Date, 'default': Date.now }
});

module.exports = mongoose.model('Task', TaskSchema);
