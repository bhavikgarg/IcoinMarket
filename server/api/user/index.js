'use strict';

var express = require('express');
var controller = require('./user.controller');
var config = require('../../config/environment');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.get('/xyz', controller.xyz);

router.get('/', auth.hasRole('admin'), controller.index);
router.get('/get-unverified-users', auth.hasRole('support'), controller.getNonVerifiedUsers);
router.post('/pick-user', auth.hasRole('support'), controller.pickUser);
router.post('/update-user-call-status', auth.hasRole('support'), controller.updateUserCallStatus);
router.get('/callers-report', auth.isAuthenticated(), controller.callersReport);
router.get('/profit-logs-report', auth.isAuthenticated(), controller.profitLogsReport);
router.get('/support-users-list', auth.isAuthenticated(), controller.supportUsersList);
router.get('/portfolio-managers-list', auth.isAuthenticated(), controller.portfolioManagersList);
router.get('/get-premium-users', auth.hasRole('admin'), controller.getPremiumUsers);
router.get('/get-top-commission-users', auth.hasRole('admin'), controller.getTopCommissionUsers);
router.get('/compoff-users', auth.hasRole('admin'), controller.listCompOffUsers);
router.get('/user-info', auth.isAuthenticated(), controller.getById);
router.get('/forget-pass-verify', controller.verifyForgetPassEmail);
router.get('/user-proxy', (auth.hasRole('admin') || auth.hasRole('finance')), controller.proxyUser);
router.get('/text-ad-expiry', auth.isAuthenticated(), controller.getExpiryTime);
router.get('/agent-log', auth.isAuthenticated(), controller.viewAgentLog);
router.get('/user-basic', auth.isAuthenticated(), controller.getUserById);
router.delete('/:id', auth.hasRole('admin'), controller.destroy);
router.get('/me', auth.isAuthenticated(), controller.me);
router.get('/get-business-roles', auth.hasRole('admin'), controller.getBusinessUserRoles);
router.get('/get-business-users', (auth.hasRole('admin') && auth.isAuthenticated()), controller.getBusinessUsers);
router.get('/get-portfolio-manager-roles', auth.hasRole('admin'), controller.getPortfolioManagerRoles);
router.get('/get-portfolio-managers', (auth.hasRole('admin') && auth.isAuthenticated()), controller.getPortfolioManagers);
router.put('/:id/password', auth.isAuthenticated(), controller.changePassword);
router.get('/:id', auth.isAuthenticated(), controller.show);
router.post('/', controller.create);
//router.post('/checkemail', controller.checkemail);
router.post('/verify-email', controller.verifyEmail);
router.put('/:id/update-me', auth.isAuthenticated(), controller.updateInfo);
//router.post('/verify-user-name', controller.verifyUserName);
router.post('/forget-password', controller.forgetPassword);
router.post('/resend-verification', controller.resendVerification);
router.post('/update-expiry', auth.isAuthenticated(), controller.updateExpiryTime);
router.post('/change-password', controller.forgetChangePassword);
router.post('/send-verification-link', controller.sendVerificationLink);
router.post('/change-email', controller.changeEmailAddress);
router.post('/find-user', auth.hasRole('admin'), controller.findUser);
router.post('/cx-view-update', (auth.hasRole('admin') && auth.isAuthenticated()), controller.clearCXView);
router.post('/map-referrals', controller.mapReferrals);
router.post('/confirm-sponsor', auth.isAuthenticated(), controller.confirmSponsorInfo);
router.post('/verify-user-sponsor', auth.isAuthenticated(), controller.verifySponsorInfo);
router.post('/sponsor-info', auth.isAuthenticated(), controller.getSponsorInfo);
router.post('/change-sponsor', auth.isAuthenticated(), controller.changeSponsor);
router.post('/verify-sponsor-email', controller.verifySponsorEmail);
router.post('/user-info', auth.isAuthenticated(), controller.getUserBasicInfo);
router.post('/add-compoff-user', auth.isAuthenticated(), controller.addUserToCompOff);
router.post('/update-compoff-status', auth.isAuthenticated(), controller.updateCompoffStatus);
router.post('/add-premium-user', auth.isAuthenticated(), controller.addUserToPremium);
router.post('/update-premium-status', auth.isAuthenticated(), controller.updatePremiumUserStatus);
router.post('/add-business-user', (auth.hasRole('admin') && auth.isAuthenticated()), controller.addBusinessUser);
router.post('/add-portfolio-manager', (auth.hasRole('admin') && auth.isAuthenticated()), controller.addPortfolioManager);
router.post('/set-password', controller.setBussinessUserPassword);
router.post('/set-portfolio-manager-password', controller.setPortfolioManagerPassword);
module.exports = router;
