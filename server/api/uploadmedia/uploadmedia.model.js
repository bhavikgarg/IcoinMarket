'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var UploadmediaSchema = new Schema({
  title: String,
  mediatype:String,
  mediauploadfor: String,
  fileurl: String,
  videotitle: String,
  videotitlelinkurl: String,
  landingPageDesc: String,
  defaultLink : Boolean,
  active: { type: Boolean, 'default': true },
  createdat: { type: Date, 'default': Date.now }
});

module.exports = mongoose.model('Uploadmedia', UploadmediaSchema);
