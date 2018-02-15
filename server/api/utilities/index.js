'use strict';

var express = require('express');
var controller = require('./utilities.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.get('/clientid/:site', controller.clientID );
router.get('/genre', controller.genre);
router.post('/export', auth.isAuthenticated(), controller.export);
router.get('/export/:file', controller.download);
router.post('/url', auth.isAuthenticated(), controller.getSignedUrl);
router.post('/verify-sponsor', controller.validSponsor);
router.get('/statistical', auth.isAuthenticated(), controller.getSignupStatistical);
router.get('/signup-report', auth.isAuthenticated(), controller.signupReport);
router.get('/latest-signups', auth.isAuthenticated(), controller.getLatestSignups);
router.get('/virtual-calculator', auth.isAuthenticated(), controller.getCalculatorInfo);
router.post('/save-image', auth.isAuthenticated(), controller.saveImage);
router.get('/landing-pages', auth.isAuthenticated(), controller.getLandingPages);
router.get('/default-sponsor', controller.getDefaultSponsor);
router.get('/isd-codes', controller.getISDCodes);
router.get('/list-countries', controller.getCountries);
//router.get('/graph-analytics', controller.getGraphAnalytics);
router.post('/max-directs', auth.isAuthenticated(), controller.getMaxDirects);
router.post('/max-team-size', auth.isAuthenticated(), controller.getMaxTeamSize);
router.post('/pack-info', auth.isAuthenticated(), controller.getPackInformation);
//router.post('/advcash-transaction', controller.getAdvCashTransactionInfo);
router.post('/stp-info-verify', auth.isAuthenticated(), controller.requireSTPInfo);
router.post('/register-sponsor', controller.registerSponsorSession)
router.get('/product-subtypes', auth.hasRole('admin'), controller.productSubTypes);
router.get('/static-content', controller.staticContent);
router.get('/sales-status', auth.isAuthenticated(), controller.salesStats);
router.get('/sales-list', auth.isAuthenticated(), controller.salesInfo);
router.get('/paypal-account', auth.isAuthenticated(), controller.getPaypalAccount);
router.get('/crypto-data/:limit', auth.isAuthenticated(), controller.getCryptoData);
router.get('/crypto-chart-data',auth.isAuthenticated(), controller.getCryptoChartData);
router.get('/time-zones', controller.getTimeZones);
//router.post('/url', controller.getSignedUrl);


module.exports = router;
