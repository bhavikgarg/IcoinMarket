'use strict';

var express = require('express');
var controller = require('./commitments.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();
router.get('/', auth.isAuthenticated(), controller.getAllCommitments);
router.post('/place-commitment', auth.hasRole('user'), controller.placeCommitment);
router.get('/commitments-list', auth.isAuthenticated(), controller.commitmentsList);
router.post('/withdraw-commitment', auth.hasRole('user'), controller.withdrawCommitment);
router.get('/export-commitment', auth.hasRole('admin'), controller.exportCommitment);
router.get('/get-per-day-investment', controller.getPerDayInvestment);
// router.post('/distributeCommissions', controller.distributeCommissions);
router.get('/unpicked-amount-detail', controller.unPickedAmountDetail);
router.get('/unpicked-commiment-list', controller.unPickedCommimentList);
router.post('/pick-commiments', auth.hasRole('manager'), controller.pickCommiments);
router.get('/picked-commiment-list', controller.pickedCommimentList);
router.get('/latest-investment-list', controller.latestInvestmentList);
router.get('/picked-commiment-listByPM',auth.isAuthenticated(), controller.pickedCommimentListByPM);
router.get('/get-commitments-data', controller.getCommitmentsData);
router.get('/commited-amount-list', controller.commitedAmountList);
router.get('/packages-profit-list', controller.packagesProfitList);
router.post('/update-profit', auth.hasRole('manager'), controller.updateProfit);
router.get('/profit-log-list', controller.profitLogList);
router.post('/cancel-commitment',auth.hasRole('admin'), controller.cancelCommitment);
router.get('/commitment-withdrawal-info', auth.hasRole('user'), controller.commitmentWithdrawalInfo);

module.exports = router;
