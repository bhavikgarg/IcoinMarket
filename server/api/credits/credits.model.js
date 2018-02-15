/**
 * credit model.
 * @module ci-server/credit-model
 */
 'use strict';

var mongoose = require('mongoose');
require('mongoose-double')(mongoose);
var Schema = mongoose.Schema,
    SchemaTypes = Schema.Types;

/**
CreditsSchema<br>
- adscash: Double,    // Current adscash amount of user
@var
*/
var CreditsSchema = new Schema({
  userid: { type : String},
  adscash : { type : SchemaTypes.Double, default : 0 },
  usd : { type : SchemaTypes.Double, default : 0 },
  adcpacks : { type : Number, default : 0 }
});

module.exports = mongoose.model('UserCredit', CreditsSchema);
