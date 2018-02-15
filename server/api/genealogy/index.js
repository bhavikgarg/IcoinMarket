'use strict';

var express = require('express');
var controller = require('./genealogy.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

//router.post('/create', controller.create);
router.get('/list-view/:level/:sponsor/:page/:viewas/:dir/:dd/:from/:to/:minusers/:maxusers/:rank/:mingoldpacks/:maxgoldpacks/:minsilverpacks/:maxsilverpacks/:searchfield/:search', auth.isAuthenticated(), controller.listMembers);
router.get('/level-view/:level/:sponsor/:page/:viewas/:dir/:dd/:from/:to/:minusers/:maxusers/:rank/:mingoldpacks/:maxgoldpacks/:minsilverpacks/:maxsilverpacks/:searchfield/:search', auth.isAuthenticated(), controller.levelMembers);
router.get('/total-signups/:viewas', auth.isAuthenticated(), controller.getMySignups);
router.post('/list-directs', auth.isAuthenticated(), controller.leaderBoardDirects);
router.post('/list-all-members', auth.isAuthenticated(), controller.leaderBoardAllDirects);
router.post('/export-members', auth.isAuthenticated(), controller.exportListMembers);
router.get('/signup-counts', auth.isAuthenticated(), controller.timeBasedSignupCounts);
router.get('/all-members-list', auth.isAuthenticated(), controller.getlistAllUserUpto7Level);

module.exports = router;
