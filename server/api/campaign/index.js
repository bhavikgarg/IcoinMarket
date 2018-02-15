'use strict';

var express = require('express');
var controller = require('./campaign.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.get('/', auth.isAuthenticated(), controller.index);
router.get('/valid-content-url', auth.isAuthenticated(), controller.validateIframeLoading);
router.get('/list', auth.isAuthenticated(), controller.showByType);
router.get('/credit-info', auth.isAuthenticated(), controller.remainingCredits);
router.get('/wallet-info', auth.isAuthenticated(), controller.walletInfo);
router.get('/total-commission', auth.isAuthenticated(), controller.totalCommissionInfo);
router.get('/withdrawal-info', auth.isAuthenticated(), controller.withdrawalInfo);
router.get('/commission-info', auth.isAuthenticated(), controller.commissionInfo);
router.get('/earned-info-gold', auth.isAuthenticated(), controller.earnedInfoGold);
router.get('/revenue-info', auth.isAuthenticated(), controller.revenueInfo);
router.get('/silver-wallet-info', auth.isAuthenticated(), controller.silverWalletInfo);
router.get('/usd-info', auth.isAuthenticated(), controller.usdTransactionsInfo);
router.get('/silver-wallet-text-ads', auth.isAuthenticated(), controller.silverEarnedCoins);
router.get('/silver-text-ads-create', auth.isAuthenticated(), controller.silverTextAdsCreateInfo);
//router.get('/show-add/:adsid', controller.showAdd);
router.get('/last-view-time', auth.isAuthenticated(), controller.lastViewTime);
router.get('/:id', auth.isAuthenticated(), controller.show);
router.get('/:id/views', auth.isAuthenticated(), controller.views);
router.post('/create', auth.isAuthenticated(), controller.create);
router.put('/:id/update', auth.isAuthenticated(), controller.update);
router.put('/:id/update-view', auth.isAuthenticated(), controller.updateView);
router.patch('/:id', auth.isAuthenticated(), controller.update);
router.delete('/:id', auth.hasRole('admin'), controller.destroy);

module.exports = router;
