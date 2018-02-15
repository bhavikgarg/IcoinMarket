'use strict';

var express = require('express');
var controller = require('./cryptomarket.controller')
var auth = require('../../auth/auth.service');
var router = express.Router();


router.get('/crypto-currency-data/:limit', auth.isAuthenticated(), controller.getCryptoCurrencyData);
router.get('/crypto-currency-chart-data/', auth.isAuthenticated(), controller.getCryptoCurrencyChartData);

module.exports = router;