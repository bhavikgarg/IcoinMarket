'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var TeamCommunicationSchema = new Schema({
  senderid: String,
  senderinfo: {},
  receiverid: String,
  subject: String,
  messageid: String,
  isview: Boolean,
  impmessage: Boolean,
  isspam: Boolean,
  active: Boolean,
  replyof: String,
  createdat: { type: Date, "default": Date.now },
});

module.exports = mongoose.model('TeamCommunication', TeamCommunicationSchema);
