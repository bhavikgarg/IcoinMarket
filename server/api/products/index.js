'use strict';

var express = require('express');
var controller = require('./products.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.get('/', auth.isAuthenticated(), controller.index);
router.get('/producttypes', auth.isAuthenticated(), controller.producttypes);
router.get('/:id/show', auth.isAuthenticated(), controller.show);
router.get('/:id', auth.isAuthenticated(), controller.show);
router.post('/create', auth.hasRole('admin'), controller.create);
router.put('/:id/update', auth.hasRole('admin'), controller.update);
router.patch('/:id', auth.hasRole('admin'), controller.update);
router.delete('/:id/remove', auth.hasRole('admin'), controller.destroy);

module.exports = router;
