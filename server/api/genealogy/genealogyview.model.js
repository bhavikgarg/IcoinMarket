'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var GenealogyTreeInfoSchema = new Schema({
  memberid: String,
  membername: String,
  memberemail: String,
  membergenlevel: Number,
  sponsorid: String,
  sponsorname: String,
  sponsorprofileid: Number,
  sponsorgenlevel: Number,
  genlevelrefsponsorid: String,
  genelevelrefmemberlevel: Number,
  memberjoinat: { type: Date },
  membercountry: String,
  usercount: Number
});

module.exports = mongoose.model('GenealogyTreeInfo', GenealogyTreeInfoSchema);
