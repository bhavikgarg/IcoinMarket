'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema,
    SchemaTypes = Schema.Types;

var Commitmentprofit = new Schema({
    packages: Object,
    updatedon: {type: Date, default: Date.now},
    updatedby : { type: Schema.ObjectId, ref: 'User' }
});

module.exports = mongoose.model('Commitmentprofit', Commitmentprofit);