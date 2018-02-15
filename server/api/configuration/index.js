'use strict';

var express = require('express');
var controller = require('./configuration.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();
router.get('/get-config', auth.isAuthenticated(), controller.getConfig);
router.post('/update-config', auth.hasRole('support'), controller.updateConfig);

module.exports = router;
