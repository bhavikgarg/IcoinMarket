'use strict';

var express = require('express');
var controller = require('./team-communication.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.get('/', auth.isAuthenticated(), controller.index);
router.get('/:id', auth.isAuthenticated(), controller.show);
router.post('/create', auth.isAuthenticated(), controller.create);
router.post('/createForAll', auth.isAuthenticated(), controller.createForAll);
router.put('/:id', auth.isAuthenticated(), controller.update);
//router.patch('/:id', controller.update);
router.delete('/:id', auth.isAuthenticated(), controller.destroy);

module.exports = router;
