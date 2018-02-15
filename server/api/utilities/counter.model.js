'use strict';

var mongoose  = require('mongoose');
var Schema    = mongoose.Schema;

var Counter = new Schema({
  id : String,
  seq: Number
});

module.exports = mongoose.model('Counter', Counter);
