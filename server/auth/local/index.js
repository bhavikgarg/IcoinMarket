'use strict';

var express = require('express');
var passport = require('passport');
var auth = require('../auth.service');
var router = express.Router();
var device = require('express-device');

router.post('/', function(req, res, next) {
  var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  console.log("RequestIp:",ip);

  passport.authenticate('local', function (err, user, info) {
    var error = err || info;
    if (error) return res.status(401).json(error);
    if (!user) return res.status(404).json({message: 'Something went wrong, please try again.'});
    var deviceType = req.device.type;
    var token = auth.signToken(user, deviceType);
    res.json({token: token});
  })(req, res, next)

  // if(req.body && req.body.key){
  //   auth.validateCaptcha(req.body.key, function(status){
  //       if(status){
  //         passport.authenticate('local', function (err, user, info) {
  //           var error = err || info;
  //           if (error) return res.status(401).json(error);
  //           if (!user) return res.status(404).json({message: 'Something went wrong, please try again.'});
  //           var deviceType = req.device.type;
  //           var token = auth.signToken(user, deviceType);
  //           res.json({token: token});
  //         })(req, res, next)
  //       }
  //       else{
  //         res.json({ message: 'Invalid Key.' });
  //       }
  //   });
  // }
  // else{
  //   res.json({ message: 'Missing params.' });
  // }
});

module.exports = router;
