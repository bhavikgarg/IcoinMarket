'use strict';

var express = require('express');
var passport = require('passport');
var auth = require('../auth.service');
var config = require('../../config/environment');

var router = express.Router();

router
  .get('/', function(req, res, next) {
    var token = req.query.token;
    if(token && typeof token != 'undefined' && token != '') {
      req.session = req.session;
      req.session['referalToken'] = new Buffer(req.query.token, 'base64').toString("ascii");
    }
    next();
  }, passport.authenticate('facebook', {
    scope: ['email', 'user_about_me'],
    failureRedirect: 'http://' + config.appDomain + '/signup',
    session: false
  }))

  .get('/callback', passport.authenticate('facebook', {
    failureRedirect: 'http://' + config.appDomain + '/signup',
    session: false
  }), auth.setTokenCookie);

module.exports = router;
