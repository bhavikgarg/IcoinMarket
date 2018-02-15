'use strict';

var mongoose  = require('mongoose');
var Schema    = mongoose.Schema;

var Countries = new Schema({
  name: String,
  code: String,
  dial_code: String
});

module.exports = mongoose.model('Countries', Countries);
