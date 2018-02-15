'use strict';

var mongoose    = require('mongoose');
var Schema      = mongoose.Schema,
    SchemaTypes = Schema.Types;

var UserMetaRejectionLog = new Schema({
  usermetaid: String,
  rejectedat: { type: Date, "default": Date.now },
  rejectById: String,
  rejectByName: String,
  rejectReason: String,
  s3asset: {
    selfie: { type: String, 'default': '' },
    id_1: { type: String, 'default': '' },
    id_2: { type: String, 'default': '' },
    id_3:  { type: String, 'default': '' },
    id_4:  { type: String, 'default': '' }
  },
  doctypes: {
    selfie: { type: String },
    id_1: { type: String },
    id_2: { type: String },
    id_3:  { type: String },
    id_4:  { type: String }
  },
  assetsStatus: {
    selfie: { type: String, 'default': '' },
    id_1: { type: String, 'default': '' },
    id_2: { type: String, 'default': '' },
    id_3:  { type: String, 'default': '' },
    id_4:  { type: String, 'default': '' }
  }
});

module.exports = mongoose.model('UserMetaRejectionLog', UserMetaRejectionLog);
