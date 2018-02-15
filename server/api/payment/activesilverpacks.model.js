/**
 * ActiveSilverPack model.
 * @module ci-server/activesilverpack-model
 */
'use strict';

var mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

/**
ActiveSilverPack Schema<br>
- userid: String (User's "_id" from users collections, User who purchased the silver packs)<br>
- packs: Number (Number of silver packs user purchased)<br>
- createdat: { type: Date, "default": Date.now } (When user purchased the silver packs)<br>
- isactive: Boolean, (Silver pack is active or not (i.e. TRUE means USD 25 is not become USD 30))<br>
- totalpacks: Number (Identical to packs field)<br>
- totalearning: Number (Total coins user earned against this purchase (i.e. Total Earned coins through Revenue Share against this purchase))<br>
- calculatedshare: Number, (Revenue share distributed in previous cycle, currently "Not In Use")<br>
- cutofshare: Number, (Max coins distributed when Revenue Share Cycle run. Currently this filed has no impact on Revenue share calculation)<br>
- revenueamount: Number (Not In Use)<br>
- revenuecoins: Number (Not In Use)<br>
- revenuecloseamount: Number (Number of max coins user will received through Revenue Share, currently its value is 30 for all. Also "Not In Use")<br>
- expirydate: { type: Date, "default": Date.now } (Date when packs is expired)<br>
- runcycles: Number (Total cycles run to mark purchased pack as expiry, "Not In Use")<br>
- previouscycle: Number (Previously run revenue cycle number, "Not In Use")<br>
@var
*/
var ActiveSilverPacksSchema = new Schema({
  userid: String,
  packs: Number,
  createdat: { type: Date, "default": Date.now },
  isactive: Boolean,
  totalpacks: Number,
  totalearning: Number,
  calculatedshare: Number,
  cutofshare: Number,
  revenueamount: Number,
  revenuecoins: Number,
  revenuecloseamount: Number, //$ 30
  expirydate: { type: Date, "default": Date.now },
  runcycles: Number,
  previouscycle: Number,

  isactive1: Boolean,
  expirydate1: { type: Date, "default": Date.now },
  runcycles1: {type: Number, "default": 0},
  totalearning1: {type: Number, "default": 0},

  isactive2: Boolean,
  expirydate2: { type: Date, "default": Date.now },
  runcycles2: {type: Number, "default": 0},
  totalearning2: {type: Number, "default": 0},

  isactive3: Boolean,
  expirydate3: { type: Date, "default": Date.now },
  runcycles3: {type: Number, "default": 0},
  totalearning3: {type: Number, "default": 0},

  oldexpirydate: { type: Date, "default": Date.now },

  isactivef: Boolean,
  expirydatef: { type: Date, "default": Date.now },
  runcyclesf: {type: Number, "default": 0},
  totalearningf: {type: Number, "default": 0},

  isactivef1: Boolean,
  expirydatef1: { type: Date, "default": Date.now },
  runcyclesf1: {type: Number, "default": 0},
  totalearningf1: {type: Number, "default": 0},

  isactivef2: Boolean,
  expirydatef2: { type: Date, "default": Date.now },
  runcyclesf2: {type: Number, "default": 0},
  totalearningf2: {type: Number, "default": 0},
});

module.exports = mongoose.model('ActiveSilverPack', ActiveSilverPacksSchema);
