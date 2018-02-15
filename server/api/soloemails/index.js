'use strict';

var express = require('express');
var controller = require('./soloemails.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.get('/soloemail-blocked-dates', auth.isAuthenticated(), controller.getBlockedDates);
router.get('/', auth.isAuthenticated(), controller.index);
router.get('/:id', auth.isAuthenticated(), controller.show);
router.post('/create', auth.isAuthenticated(), controller.create);
router.put('/:id', auth.hasRole('admin'), controller.update);
router.patch('/:id/soloemail-update', auth.isAuthenticated(), controller.updateContent);
router.post('/soloemail-content', auth.isAuthenticated(), controller.emailContent);
router.post('/soloemail-brodcast-valid', auth.isAuthenticated(), controller.isBroadcastDateAvailable);
router.delete('/:id', auth.hasRole('admin'), controller.destroy);

module.exports = router;
