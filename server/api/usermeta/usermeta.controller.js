'use strict';

var _ = require('lodash');
var Usermeta = require('./usermeta.model');
var config = require('../../config/environment');
var KycComponents = require('./utils.component.js');
var Promise = require('promise');


exports.index = function(req, res) {
  KycComponents.getSingleUserRecord( req.user._id, function( data ) {
    return res.status(200).json( data );
  });
};


exports.uploadKycDocument = function(req, res) {
  KycComponents.uploadUserKyc( req, function( data ) {
      return res.status(200).json( data );
  });
};



exports.getSignedKycUrl = function(req, res){
  KycComponents.generateSignedUrl( req.body.url, function( data ){
    return res.status(200).json( data );
  });
};


exports.saveGovId = function(req, res){
  KycComponents.saveUserGovId( req.user._id , (req.body.govId).toUpperCase(), function( data ){
    return res.status(200).json( data );
  });
};


exports.saveTaxId = function(req, res){
  KycComponents.saveUserTaxId( req.user._id , (req.body.taxId).toUpperCase(), function( data ){
    return res.status(200).json( data );
  });
};


exports.saveKycandUpdateStatus = function(req, res){
  KycComponents.saveKycandUpdateStatus( req.user._id, req.body , function( data ){
    return res.status(200).json( data );
  });
};


/**
 * Get list of users for kyc verification
 * restriction: 'admin'
 */
exports.getKycRecords = function(req, res) {
  if ( req.body.searchParam == null ) {
    KycComponents.getUserListByStatus( req.body.flag , req.body.page, req.body.limit, null, function( data ){
      return res.status(200).json( data );
    });
  } else {
    KycComponents.getUserListByStatus( req.body.flag , req.body.page, req.body.limit, req.body.searchParam , function( data ){
      return res.status(200).json( data );
    });
  }

};


exports.getUserKycRecord = function( req, res ){
  KycComponents.getUserKycRecord( req.body.id , function( data ){
    return res.status(200).json( data );
  });
};


exports.updateUserKyc = function( req, res ) {
  if(req.user.role == 'admin') {
    console.log('Super Admin Approval >>> ');
    KycComponents.updateUserKyc( req.user._id, req.user.name, req.body.userId, 'moderator', 'VERIFIED', req.body.comments, req.body,  function(data){
      console.log('Moderator Approval >>> ');
      KycComponents.updateUserKyc( req.user._id, req.user.name, req.body.userId , 'supervisor' , req.body.status, req.body.comments, req.body, function( data ) {
        console.log('Supervisor Approval >>> ');
        if(req.body.status === 'REJECTED') {
          KycComponents.addToRejectionLog(req.body.userId, req.user._id, req.user.name, function(_data) {
            return res.status(200).json( data );
          });
        }
        else {
          return res.status(200).json( data );
        }
      });
    });
  }
  else {
    KycComponents.updateUserKyc( req.user._id, req.user.name, req.body.userId , req.user.role , req.body.status, req.body.comments, req.body, function( data ){
      if(req.body.status === 'REJECTED') {
        KycComponents.addToRejectionLog(req.body.userId, req.user._id, req.user.name, function(_data) {
          return res.status(200).json( data );
        });
      }
      else {
        return res.status(200).json( data );
      }
    });
  }
};


exports.getRejectedInfo = function( req, res ) {
  console.log(' >>> ', req.body);
  KycComponents.getRejectedMetaInfo(req.body.metaid, function( data ) {
    return res.status(200).json(data);
  });
}
