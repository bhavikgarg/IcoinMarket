'use strict';

var mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

var CirculationSchema = new Schema({
  lastappreciation : Number,
  totaladscashcirculation : Number,
  nextappreciation : Number,
  active: { type : Boolean, default: false},
  cp : Number, /*Current price*/
  np : Number, /*Next price*/
  updatedat: {type: Date},
  createdat: {type: Date, default: Date.now}
});

module.exports = mongoose.model('Circulation', CirculationSchema);
