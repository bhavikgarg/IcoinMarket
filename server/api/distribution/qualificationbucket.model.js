'use strict';

var mongoose = require('mongoose');
require('mongoose-double')(mongoose);
var Schema = mongoose.Schema,
    SchemaTypes = Schema.Types;

var QualificationBucketSchema = new Schema({
  sponsorid: String,
  level: Number,
  amount: SchemaTypes.Double,
  createdat: {type: Date, default: Date.now}
});

module.exports = mongoose.model('QualificationBucket', QualificationBucketSchema);
