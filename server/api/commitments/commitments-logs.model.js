'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema,
    SchemaTypes = Schema.Types;

var CommitmentLogsSchema = new Schema({
  commitmentid: { type: Schema.ObjectId, ref: 'Commitments' },
  description: String,
  status : String,
  createdat: {type: Date, default: Date.now},
  createdby : { type: Schema.ObjectId, ref: 'User' }
});

module.exports = mongoose.model('CommitmentLogs', CommitmentLogsSchema);
