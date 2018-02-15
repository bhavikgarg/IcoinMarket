'use strict';

var express = require('express');
var controller = require('./uploadmedia.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();
router.post('/save-media', auth.hasRole('admin'), controller.savemedia);
router.get('/media', auth.isAuthenticated(), controller.getsaveMedia);
router.post('/delete-media', auth.hasRole('admin'), controller.deletemedia);
router.put('/update-media-sequence', auth.hasRole('admin'), controller.updateMediaSequence);

module.exports = router;
