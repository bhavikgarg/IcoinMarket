'use strict';

var express = require('express');
var controller = require('./task.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.get('/user-tasks', auth.isAuthenticated(), controller.getUserTasks)
router.get('/', auth.isAuthenticated(), controller.index);
router.get('/:id', auth.isAuthenticated(), controller.show);
router.post('/create', auth.isAuthenticated(), controller.create);
router.put('/:id', auth.isAuthenticated(), controller.update);
router.patch('/:id', auth.isAuthenticated(), controller.update);
router.delete('/:id', auth.isAuthenticated(), controller.destroy);
router.post('/user-task', auth.isAuthenticated(), controller.userDoTask);

module.exports = router;
