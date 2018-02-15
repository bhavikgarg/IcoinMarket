'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var autoInc   = require('mongoose-sequence')

var GenealogyTree = new Schema({
  refererid: String,
  signupat: { type: Date, "default": Date.now }
});

GenealogyTree.plugin(autoInc, {id: 'treePId_inc', inc_field: 'treesponsor'});
module.exports = mongoose.model('generationtree', GenealogyTree);
