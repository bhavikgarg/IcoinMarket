'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var GenealogyTreeWorkerSchema = new Schema({
  startafter: Number,
  starttime: { type: Date },
  status: String,
  lastprocessedat: { type: Date }
});

module.exports = mongoose.model('GenealogyTreeWorkerData', GenealogyTreeWorkerSchema);
