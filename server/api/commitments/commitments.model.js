'use strict';

var mongoose = require('mongoose');
require('mongoose-double')(mongoose);
var Schema = mongoose.Schema,
    SchemaTypes = Schema.Types;

var CommitmentsSchema = new Schema({
  userid: { type: Schema.ObjectId, ref: 'User' },
  packagename: String,
  amount:SchemaTypes.Double,
  description: String,
  status : String,
  cointype :String,
  profitwithdrawn :{ type : SchemaTypes.Double,default : 0.0 },
  profit :{ type : SchemaTypes.Double,default : 0.0 },
  maturityPeriod : String,
  maturitydate: {type: Date, default: Date.now},
  startdate: {type: Date, default: Date.now},
  createdat: {type: Date, default: Date.now},
  portfoliomanagerId : { type: Schema.ObjectId, ref: 'User' }
});

module.exports = mongoose.model('Commitment', CommitmentsSchema);
