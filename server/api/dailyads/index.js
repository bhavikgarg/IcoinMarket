'use strict';

var express = require('express');
var controller = require('./dailyads.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.get('/dailyads-booked-dates', auth.isAuthenticated(), controller.getBookedDates)
router.get('/', auth.isAuthenticated(), controller.index);
router.get('/today-dailyad', auth.isAuthenticated(), controller.todaysAd);
router.get('/:id', auth.isAuthenticated(), controller.show);
router.post('/create', auth.isAuthenticated(), controller.create);
router.put('/:id', auth.hasRole('admin'), controller.update);
router.patch('/:id/dailyad-update', auth.isAuthenticated(), controller.updateContent);
router.post('/dailyad-content', auth.isAuthenticated(), controller.dailyAdContent);
router.post('/dailyad-brodcast-valid', auth.isAuthenticated(), controller.isBroadcastDateAvailable);
router.delete('/:id', auth.hasRole('admin'), controller.destroy);

module.exports = router;
