'use strict';

var express = require('express');
var controller = require('./affiliates.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.get('/', auth.isAuthenticated(), controller.index);
router.get('/update-visit/:username/:uniqueid', controller.updateVisit);
router.get('/valid-referral', controller.findByTarget);
router.get('/affilate-banners', auth.isAuthenticated(), controller.getAffilateBanners);
router.get('/total-hits', auth.isAuthenticated(), controller.getTotalHits);
router.get('/:id', auth.isAuthenticated(), controller.show);
router.post('/', auth.isAuthenticated(), controller.create);
router.post('/default-affilate', auth.isAuthenticated(), controller.defaultAffilate);
router.post('/create-banner-promotion', auth.isAuthenticated(), controller.createBannerPromotion);
router.post('/create-banner', auth.hasRole('admin'), controller.createBanner);
router.put('/:id', auth.isAuthenticated(), controller.update);
router.patch('/:id', auth.isAuthenticated(), controller.update);
router.delete('/:id/remove-banner', auth.hasRole('admin'), controller.removeBanner);
router.delete('/:id', auth.isAuthenticated(), controller.destroy);

module.exports = router;
