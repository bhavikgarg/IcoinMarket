/**
 * This model is used to save those user's id
 * which have made purchase either silver or
 * gold packs. We use this info to update the
 * Neo4J (in order to update the Gold and Active
 * Silver Packs information) through task named
 * genealogy-packs.task.js

 * We insert values in this model through purchase
 * controller
 */

'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var GenealogyPurchaseSchema = new Schema({
  userid: String,
}, {timestamps: true});

module.exports = mongoose.model('GenealogyPurchase', GenealogyPurchaseSchema);
