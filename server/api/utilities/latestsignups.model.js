'use strict';

var mongoose  = require('mongoose');
var Schema    = mongoose.Schema;

var LatestSignup = new Schema({
  userid : String,
  name: String,
  country: String,
  createdat: { type: Date, "default": Date.now }
},
{ capped: {size: 5024, max: 20, autoIndexId: true } });


module.exports = mongoose.model('LatestSignup', LatestSignup);
