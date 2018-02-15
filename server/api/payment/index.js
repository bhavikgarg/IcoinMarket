'use strict';

var express = require('express');
var controller = require('./payment.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

//router.get('/success/return/:type', controller.returnSuccess);
//router.post('/success/return/:type', controller.returnSuccess);
//router.get('/cancel/return/:type', controller.returnCancel);
router.get('/gateways', auth.isAuthenticated(), controller.getGateways);
router.get('/total-getpackinfo/:viewas', auth.isAuthenticated(), controller.totalgetPackInfo);
router.get('/total-getsilverpackinfo/:viewas', auth.isAuthenticated(), controller.totalgetsilverPackInfo);
router.get('/order-history', auth.isAuthenticated(), controller.getOrderHistory);
router.get('/ci-gold-coins-balance', auth.isAuthenticated(), controller.getCIGoldCoins);
// router.get('/bitcodin/oauth/response/:__uuid/:code');
router.get('/bank-wire-invoice', auth.isAuthenticated(), controller.getBankWireInfo);
router.get('/bank-wire-finfo', (auth.hasRole('admin') || auth.hasRole('finance')), controller.getBankWireFInfo);
router.get('/transfer-fee-register', (auth.hasRole('admin') || auth.hasRole('finance')), controller.getTransferRegister);
router.get('/paypal-available', auth.isAuthenticated(), controller.canUsePaypal);
router.get('/payments-list', (auth.hasRole('admin') || auth.hasRole('finance')), controller.listAllPurchase);
router.get('/currency-rate', auth.isAuthenticated(), controller.getCurrencyRate);
router.get('/adscash-current-rate', auth.isAuthenticated(), controller.getAdsCashCurrentRate);
router.get('/:id/view', auth.isAuthenticated(), controller.viewByToken);
router.get('/available-credits', auth.isAuthenticated(), controller.creditsInfo);
router.get('/', auth.isAuthenticated(), controller.index);
router.get('/revenueshare', auth.isAuthenticated(), controller.revenueshare);
router.get('/exrevenueshare', auth.isAuthenticated(), controller.exrevenueshare);
router.get('/revenue-cutof', auth.hasRole('admin'), controller.getreveuecutof);
router.get('/paypal-finfo', (auth.hasRole('admin') || auth.hasRole('finance')), controller.getPayPalFInfo);
router.get('/paypal-invoice', auth.isAuthenticated(), controller.getPayPalInfo);
router.get('/test-blockio', controller.testBlockIO);
router.get('/:txnid/view-transaction', auth.isAuthenticated(), controller.viewTransaction);
router.get('/:txnid/view-transaction-status', auth.isAuthenticated(), (auth.hasRole('admin') || auth.hasRole('finance')), controller.viewTransactionStatus);
router.get('/export-purchase', auth.hasRole('admin'), controller.exportPurchase);
router.post('/total-circulation', auth.isAuthenticated(), controller.totalCirculation);
router.get('/current-circulation', auth.isAuthenticated(), controller.currentCirculation);
router.get('/commission-earned', auth.isAuthenticated(), controller.totalCommissionEarned);

router.get('/:id', auth.isAuthenticated(), controller.show);
router.post('/', auth.isAuthenticated(), controller.doPayment);

router.post('/resend-otp', auth.isAuthenticated(), controller.resendOtp);
router.post('/generate-and-send-otp', auth.isAuthenticated(), controller.generateAndSendOtp);
router.post('/product', auth.isAuthenticated(), controller.doProductPayment);
router.post('/packs-info', auth.isAuthenticated(), controller.packsInfo);
//router.post('/confirm/:token/:type', controller.payConfirm);
//router.post('/notify/:token/:type', controller.payNotify);
router.post('/notify-blockio-payment', controller.payNotifyBlockio);
router.post('/bank-wire-info', auth.isAuthenticated(), controller.bankWireInfo);
router.post('/update-bank-wire', (auth.hasRole('admin') || auth.hasRole('finance')), controller.updateBankWire);
router.post('/update-paypal', (auth.hasRole('admin') || auth.hasRole('finance')), controller.updatePayPal);
router.post('/paypal-info', auth.isAuthenticated(), controller.paypalInfo);
router.post('/cancel-transaction', auth.isAuthenticated(), controller.cancelTransaction);

// router.post('/cancel-paypal-transaction', auth.isAuthenticated(), controller.cancelPayPalTransaction);
router.post('/update-receipt-path', auth.isAuthenticated(), controller.updateReceiptPath);
router.post('/transfer-usd-coins', auth.isAuthenticated(), controller.transferUSDAmount);
router.post('/user-payments-info', auth.isAuthenticated(), controller.userPaymentsInfo);
router.post('/block-complete-payment', auth.isAuthenticated(), controller.markPaymentCompleteBlocked);
router.post('/mark-complete', auth.isAuthenticated(), controller.markPaymentCompleted);
//router.post('/payza-notify', controller.payzaNotify);
router.post('/update-cutof', auth.hasRole('admin'), controller.reveuecutofupdate);
router.post('/token', auth.isAuthenticated(), controller.purchaseToken);
router.post('/initialize-withdrawal', auth.isAuthenticated(), controller.initializeWithdrawal);
router.post('/eq-btc-adscash', auth.isAuthenticated(), controller.calculatedBTCAdsCash);

router.put('/update-currency-rate', auth.isAuthenticated(), auth.hasRole('admin'), controller.currencyRateUpdate);
router.post('/:token/verify-payment', auth.isAuthenticated(), controller.verifyPayment);
router.post('/approve-transaction', auth.isAuthenticated(), (auth.hasRole('admin') || auth.hasRole('finance')), controller.approvePayment);

module.exports = router;
