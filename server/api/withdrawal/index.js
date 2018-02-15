'use strict';

var express = require('express');
var controller = require('./withdrawal.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

//router.get('/stp/notify', controller.withdrawalStpNotify);
router.get('/', (auth.hasRole('admin') || auth.hasRole('finance')), controller.index);
router.get('/:id', (auth.hasRole('admin') || auth.hasRole('finance')), controller.show);
router.post('/', auth.isAuthenticated(), controller.create);
router.put('/:id', (auth.hasRole('admin') || auth.hasRole('finance')), controller.update);
router.patch('/:id', (auth.hasRole('admin') || auth.hasRole('finance')), controller.update);
router.delete('/:id', (auth.hasRole('admin') || auth.hasRole('finance')), controller.cancelWithdrawal);
router.post('/cancel-usdwithdrawal', auth.isAuthenticated(), controller.cancelUSDWithdrawal);
router.post('/return', (auth.hasRole('admin') || auth.hasRole('finance')), controller.returnWithdrawal);
router.post('/wdinfo', auth.isAuthenticated(), controller.showByTransactionId);
router.post('/admin-fee', auth.isAuthenticated(), controller.adminFee);
router.post('/wdtransfer', (auth.hasRole('admin') || auth.hasRole('finance')), controller.doInstantTransfer);
//router.post('/stp/notify', controller.withdrawalStpNotify);

module.exports = router;
