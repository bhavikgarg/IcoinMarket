'use strict';

var mongoose  = require('mongoose');
var autoInc   = require('mongoose-sequence');
var Schema    = mongoose.Schema;
var config    = require('./../../config/environment/');
var _         = require('lodash');
var User      = require('../user/user.model');

/**
 * Usermeta mongo db schema
 */
var userMetaSchema = new Schema({

  user : {
    id: { type: String, "default": '' },
    name: { type: String, "default": '' },
    email: { type: String, lowercase: true, "default": '' },
    mobile: { type: String, "default": '' },
    govid: { type: String, "default": '' },
    taxid: { type: String, "default": '' }
  },

  kyc_flag: { type: String, "default": config.kycFlags.kycUnverifiedFlag.status },

  moderator: {
    id: { type: String, "default": '' },
    name: { type: String, "default": '' },
    flag:  { type: String, "default": config.kycFlags.kycUnverifiedFlag.status },
    timestamp: { type: Date, "default": Date.now },
    comments: { type: String, "default": '' },
    viewed: { type: Boolean, 'default': false },
    rejectReason: { type: String, "default": '' },
  },

  admin: {
    id: { type: String, "default": '' },
    name: { type: String, "default": '' },
    flag :  { type: String, "default": config.kycFlags.kycUnverifiedFlag.status },
    viewed: { type: Boolean, 'default': false },
    timestamp: { type: Date, "default": Date.now },
    comments: { type: String, "default": '' },
    rejectReason: { type: String, "default": '' }
  },

  s3asset: {
    selfie: { type: String, 'default': '' },
    id_1: { type: String, 'default': '' },
    id_2: { type: String, 'default': '' },
    id_3:  { type: String, 'default': '' },
    id_4:  { type: String, 'default': '' }
  },

  doctypes: {
    selfie: { type: String, 'default': config.kycAllowedDocs.NA.key },
    id_1: { type: String, 'default': config.kycAllowedDocs.NA.key },
    id_2: { type: String, 'default': config.kycAllowedDocs.NA.key },
    id_3:  { type: String, 'default': config.kycAllowedDocs.NA.key },
    id_4:  { type: String, 'default': config.kycAllowedDocs.NA.key }
  },

  uniqueKycId: { type: Number, 'default': 0 },

  assetsStatus: {
    selfie: { type: String, 'default': '' },
    id_1: { type: String, 'default': '' },
    id_2: { type: String, 'default': '' },
    id_3:  { type: String, 'default': '' },
    id_4:  { type: String, 'default': '' }
  },

  has_multiple_ids: { type: Boolean, 'default': false }

}, { timestamps: { createdAt: 'created_at' } } );

//----------------------------------------------------------------------------------------------------------------------
// USER META METHODS
//----------------------------------------------------------------------------------------------------------------------

/**
 * Tells whether the document uploaded by the user have been verified by both Moderator and Admin
 * @returns {boolean}
 */
userMetaSchema.methods.isUserKycVerified = function() {
  if ( ( this.kyc_flag == config.kycFlags.kycApprovedFlag.status ) && ( this.moderator.viewed == true ) && ( this.moderator.flag == config.kycFlags.kycVerifiedFlag.status ) && ( this.admin.viewed == true) && ( this.admin.flag == config.kycFlags.kycApprovedFlag.status ) ) { //Check if its verified by admin and Moderator
          return config.kycFlags.kycApprovedFlag.approvalStatus;
  }
  return false;
};


/**
 * Returns the Users Kyc Status Flag
 * @returns {string} PENDING | UNVERIFIED | ONHOLD | REJECTED | APPROVED | VERIFIED
 */
userMetaSchema.methods.getUserKycStatus = function() {
  return this.kyc_flag;
};


/**
 * Checks if the user has already been moderated by moderator
 * @returns {boolean}
 */
userMetaSchema.methods.isUserKycViewedByModerator = function() {
  return this.moderator.viewed;
};


/**
 * Checks if the user has already been moderated by admin
 * @returns {boolean}
 */
userMetaSchema.methods.isUserKycViewedByAdmin = function() {
  return this.admin.viewed;
};


/**
 * Returns a json contains s3 assets urls for Kyc Uploaded by user
 * @returns {json} S3 keys for selfie, id_1, id_2, id_3, id_4
 */
userMetaSchema.methods.getS3AssetsUrl = function() {
  return this.s3asset;
};





//======================================================================================================================
// EXPORT THE Usermeta Model
//======================================================================================================================
userMetaSchema.plugin(autoInc, {id: 'uniqueKycId_inc', inc_field: 'uniqueKycId'});
var Usermeta = mongoose.model('UserMeta', userMetaSchema);
module.exports = Usermeta;








//======================================================================================================================
// Data Validators for Usermeta
//======================================================================================================================


// /**
//  * Allows to save only validated status flags
//  */
// Usermeta.schema.path('kyc_flag').validate( function (value) {
//   return  (_.includes( config.kycFlagsList, value ) );
// }, 'Invalid Status Flag');
//
// Usermeta.schema.path('moderator.flag').validate( function (value) {
//   return (_.includes( config.kycFlagsList, value ) );
// }, 'Invalid Status Flag');
//
// Usermeta.schema.path('admin.flag').validate( function (value) {
//   return (_.includes( config.kycFlagsList, value ) );
// }, 'Invalid Status Flag');
//
//
//
// /**
//  * Allows to save those user ids, which exists in the system
//  */
// userMetaSchema.path('user.id').validate( function (value) {
//
//   // Check if the user id is authentic or exists in the system
//   User.findOne({ _id: (""+value) }).exec( function (err, user) {
//     if (err) {
//       console.log( err );
//       return false;
//     }
//     if(user) {
//       return false;
//     }
//   });
//
//
//   // Check for duplicate entry
//   Usermeta.findOne({ "user.id": (""+value) }).exec(function (err, userMeta) {
//     if (err) {
//       console.log( err );
//       return false;
//     }
//     if(userMeta) {
//         return false;
//     }
//   });
//
//   return true;
// }, 'Invalid User Id or Duplicate Entry');
//
//
//
// /**
//  * Allows to save only unique and validated Government Id
//  */
// Usermeta.schema.path('user.govid').validate( function (value) {
//
//   if ( !KycComponents.isUserKycGovIdValid( value ) ){
//     return false;
//   }
//
//   Usermeta.findOne({ user : { govid: value } }, function (err, user) {
//     if(user) {
//       return false;
//     } else{
//       return true;
//     }
//   });
// }, 'Invalid Government Id or This Government Id is already in use');
//
//
// /**
//  * Allows to save only unique and validated Tax Id
//  */
// Usermeta.schema.path('user.taxid').validate( function (value) {
//
//   if ( !KycComponents.isUserKycTaxIdValid( value ) ){
//     return false;
//   }
//
//   Usermeta.findOne({ user : { taxid: value } }, function (err, user) {
//     if(user) {
//       return false;
//     } else{
//       return true;
//     }
//   });
// }, 'Invalid Tax Id or This Tax Id is already in use');
