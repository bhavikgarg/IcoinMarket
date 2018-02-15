'use strict';

var express = require('express');
var controller = require('./usermeta.controller');
var config = require('../../config/environment');
var auth = require('../../auth/auth.service');

var router = express.Router();

// For Authenticated Users
router.get('/get',  auth.isAuthenticated(), controller.index);
router.post('/uploads',  auth.isAuthenticated(), controller.uploadKycDocument); //Uploads the images for given user
router.post('/get-signed-url',  auth.isAuthenticated(), controller.getSignedKycUrl); //Generates signed url for the given file name
router.post('/save-govid',  auth.isAuthenticated(), controller.saveGovId); //Saves the Gov Id supplied by the client
router.post('/save-taxid',  auth.isAuthenticated(), controller.saveTaxId); //Saves the Tax Id supplied by the client
router.post('/save-kyc',  auth.isAuthenticated(), controller.saveKycandUpdateStatus); //Saves the KCY id and update status

// For Admin
router.post('/rejected-info', (auth.hasRole('admin') || auth.hasRole('moderator') || auth.hasRole('supervisor')), controller.getRejectedInfo);
router.post('/get-kyc-records', (auth.hasRole('admin') || auth.hasRole('moderator') || auth.hasRole('supervisor')), controller.getKycRecords );
router.post('/get-user-kyc', (auth.hasRole('admin') || auth.hasRole('moderator') || auth.hasRole('supervisor')), controller.getUserKycRecord);
router.post('/update-user-kyc', (auth.hasRole('admin') || auth.hasRole('moderator') || auth.hasRole('supervisor')), controller.updateUserKyc);


module.exports = router;
