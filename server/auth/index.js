'use strict';

var express = require('express');
var passport = require('passport');
var config = require('../config/environment');
var User = require('../api/user/user.model');
var Genealogy = require('../api/genealogy/genealogy.model');
var Sessions  = require('../api/utilities/session.model');

// Passport Configuration
require('./local/passport').setup(User, config);
require('./facebook/passport').setup(User, config, Genealogy, Sessions);
require('./google/passport').setup(User, config, Genealogy, Sessions);

var router = express.Router();

router.use('/local', require('./local'));
router.use('/facebook', require('./facebook'));
router.use('/google', require('./google'));
router.use('/authenticate', function(req, res) {

  if(req.query.code && req.query.code.trim() !== '') {

    var _token = req.query.code.split('.'), validationKey = '';
    for(var idx = 0; idx < 3; idx++) {
      var charIdx = 15, charLen = 4;
      if(idx == 1) charIdx = 35;
      if(idx == 2) charIdx = 20;
      validationKey = validationKey+_token[idx].substr(charIdx, (charLen+idx));
    }

    if(req.query._v === validationKey) {
      res.cookie('token', JSON.stringify(req.query.code));
      res.redirect('/dashboard');
    }
    else {
      res.redirect('/');
    }
  }
  else {
    res.redirect('/');
  }
})

module.exports = router;
