'use strict';

var express = require('express');
var passport = require('passport');
var auth = require('../auth.service');
var coinfig = require('../../config/environment');

var router = express.Router();

router
  .get('/', function(req, res, next) {
    var token = req.query.token;
    if(token && typeof token != 'undefined' && token != '') {
      req.session = req.session;
      req.session['referalToken'] = new Buffer(req.query.token, 'base64').toString("ascii");
    }

    next();
  }, passport.authenticate('google', {
    failureRedirect: 'http://' + coinfig.appDomain + '/signup',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email'
    ],
    session: true
  }))

  .get('/callback', passport.authenticate('google', {
    failureRedirect: 'http://' + coinfig.appDomain + '/signup',
    session: false
  }), auth.setTokenCookie);

module.exports = router;
