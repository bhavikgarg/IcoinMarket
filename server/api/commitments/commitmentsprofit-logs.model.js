'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema,
    SchemaTypes = Schema.Types;

var CommitmentprofitLog = new Schema({
    packages: Object,
  createdat: {type: Date, default: Date.now},
  updatedby : { type: Schema.ObjectId, ref: 'User' }
});

module.exports = mongoose.model('Commitmentprofitlog', CommitmentprofitLog);