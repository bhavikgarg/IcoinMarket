'use strict';

var mongoose = require('mongoose');
var passport = require('passport');
var config = require('../config/environment');
var jwt = require('jsonwebtoken');
var expressJwt = require('express-jwt');
var compose = require('composable-middleware');
var User = require('../api/user/user.model');
var validateJwt = expressJwt({ secret: config.secrets.session });
var Genealogy = require('./../api/genealogy/genealogy.model');
var SignupError = require('./../components/errors/SignupError');
var Affilate  = require('./../api/affiliates/affiliates.model');
var WSDL = require('./../components/wsdl/mapwsdl.service');
var EmailService = require('./../components/emails/email.service');
var https = require('https');
var querystring = require('querystring');

/**
 * Attaches the user object to the request if authenticated
 * Otherwise returns 403
 */
function isAuthenticated() {
  return compose()
    // Validate jwt
    .use(function(req, res, next) {
      // allow access_token to be passed through query parameter as well
      if(req.query && req.query.hasOwnProperty('access_token')) {
        req.headers.authorization = 'Bearer ' + req.query.access_token;
      }
      validateJwt(req, res, next);
    })
    // Attach user to request
    .use(function(req, res, next) {
      User.findById(req.user._id, function (err, user) {
        if (err) return next(err);
        if (!user) return res.status(401).send('Unauthorized');

        validateUnique(user, req, res, next);
      });
    });
}

/**
 * Checks if the user role meets the minimum requirements of the route
 */
function hasRole(roleRequired) {
  if (!roleRequired) throw new Error('Required role needs to be set');

  return compose()
    .use(isAuthenticated())
    .use(function meetsRequirements(req, res, next) {
      if (config.userRoles.indexOf(req.user.role) >= config.userRoles.indexOf(roleRequired)) {
        next();
      }
      else {
        res.status(403).send('Forbidden');
      }
    });
}

/**
 * Returns a jwt token signed by the app secret
 */
function signToken(user, deviceType) {
  var iat = parseInt((new Date()).getTime() / 1000);
  var jti = Math.random(2<<64).toString();
  // if desktop user, token expires in 5 hours else  for mobile / tablet user , token expires in 2 years
  var expireTime = ((null == deviceType) || (undefined === deviceType) || ("desktop" === deviceType)) ? 18000 : 63072000;
  return jwt.sign({
    iat: iat,
    jti: jti,
    _id: user._id,
    name: user.name,
    email: user.email
  }, config.secrets.session, { expiresIn: expireTime });
}

/**
 * Set token cookie directly for oAuth strategies
 */
function setTokenCookie(req, res) {
  if (!req.user) return res.status(404).json({ message: 'Something went wrong, please try again.'});
  var token = signToken(req.user);
  // var _domain = config.appDomain.split(':');
  // res.cookie('token', JSON.stringify(token), {domain: _domain[0]});
  // var userInfo = JSON.stringify({
  //   id: req.user._id,
  //   name: req.user.name,
  //   email: (req.user.email ? req.user.email : ''),
  //   mobile: (req.user.mobile ? req.user.mobile: ''),
  //   username: (req.user.username ? req.user.username: '')
  // });
  // //userInfo = (new Buffer(userInfo)).toString('base64');
  // res.cookie('uifo', userInfo);

  var _token = token.split('.'), validationKey = '';
  for(var idx = 0; idx < 3; idx++) {
    var charIdx = 15, charLen = 4;
    if(idx == 1) charIdx = 35;
    if(idx == 2) charIdx = 20;
    validationKey = validationKey+_token[idx].substr(charIdx, (charLen+idx));
  }
  res.redirect('http://'+config.appDomain + '/auth/authenticate?code='+token+'&_v='+validationKey);
}

function verifyAndPlaceUser (userId, referenceInfo, userInfo, countryInfo, reqOrigin, callback) {

  Genealogy.getMember({id: userId}, function(err, data) {

    if(err) {
      console.log('Error: when verify user in Tree: ', err);
    }

    if(data && data.length >= 1 && data[0].id == userId) {

      return callback(null, data[0]);
    }
    else {
      var userData = {
        ref: referenceInfo,
        user: {
          'id': userId,
          'name': userInfo.name,
          'role': 'user',
          'email': (!userInfo.email ? '' : userInfo.email),
          'ip': countryInfo.ip,
          'countryName': countryInfo.country_name,
          'countryCode': countryInfo.country_code,
          'username': userInfo.username
        }
      };

      Genealogy.create(userData, function (err, results) {
        if (err) {
          console.log(err.message);
          return callback(err, results);
        }
        else {

          // Update affilation for Referral signup count
          Affilate.findOne({target: referenceInfo[3]}, function(err, affilate) {
            if(!err && affilate) {
              affilate.update({registercount: (affilate.registercount + 1)}, function(_err, _resp) {
                console.log('Affilate Referral Singup Count Update: ', _err);
              });
            }
          });

          User.findById(userId+'', function (err, user) {
            if (!err) {
              // send emails
              var emailService = new EmailService();
              emailService.sendWelcomeEmail(user.email, user.name, reqOrigin);
              emailService.sendMailToSponsor(user, (referenceInfo[0] || config.sponsorId));

              user.update({
                'ip': countryInfo.ip,
                'countryName': countryInfo.country_name,
                'countryCode': countryInfo.country_code,
                'verified': true,
                'sponsor': (referenceInfo[0] || config.sponsorId)
              }, function(err, data) {
                return callback(err, data);
              });
            }
          });
        }
      });
    }
  });
}

function placeUserAndCookie(req, res) {

  var refToken = (req.body.refToken ? req.body.refToken.replace(/\"/g, "") : null),
      refUser  = (req.body.refUser ? req.body.refUser.replace(/\"/g, "") : null),
      signupId = req.body.userInfo,
      referenceUser = [],
      userData = {
        name: req.body.userName,
        email: req.body.userEmail,
        username: req.body.userUName
      },
      countryInfo = {'ip': '', 'country_name': '', 'country_code': ''},
      reqOrigin   = req.headers.origin;

  if(req.cookies.hasOwnProperty('country_info')) {
    countryInfo = new Buffer(req.cookies.country_info, 'base64').toString("ascii");
    countryInfo = JSON.parse(countryInfo);
  }

  if(refUser && typeof refUser != 'undefined' && refUser != '') {

    referenceUser = new Buffer(refUser, 'base64').toString("ascii");
    referenceUser = referenceUser.split('>');

    verifyAndPlaceUser(signupId, referenceUser, userData, countryInfo, reqOrigin, function(err, info) {
      return res.status(200).json({error: (err ? true : false), data: info});
    });

  }
  else if(refToken && typeof refToken != 'undefined' && refToken != '') {

    Affilate.findOne({target: refToken+''}, function(err, _resp) {
      if(!err && _resp) {
        User.findById(_resp.userid+'', function(_err, __resp) {

          if(!_err && __resp) {
            referenceUser = [__resp._id, __resp.username, __resp.userProfileId, refToken, __resp.username];
            verifyAndPlaceUser(signupId, referenceUser, userData, countryInfo, reqOrigin, function(err, info) {
              return res.status(200).json({error: (err ? true : false), data: info});
            });
          }
          else {
            return res.status(200).json({error: true, message: 'Unable to verify sponsor'});
          }
        });
      }
      else {
        return res.status(200).json({error: true, message: 'Unable to verify sponsor'});
      }
    });
  }
  else {

    return res.status(200).json({error: true, message: 'Unable to verify sponsor'});
  }
}

function validateUnique(user, req, res, next) {
  validRequest(req, function(err, _res) {

    if((user.email == null || user.mobile == null || user.username == null) && (_res === true || (typeof _res == 'object' && _res.length >= 1)) && req.url.indexOf('/user-info') < 0 && req.url.indexOf('/update-me') < 0) {
      req.user = user;
      // var userInfo = JSON.stringify({
      //   id: user._id,
      //   name: user.name,
      //   email: (user.email ? user.email : ''),
      //   mobile: (user.mobile ? user.mobile: ''),
      //   username: (user.username ? user.username: '')
      // });
      //
      // res.cookie('__userinfo', userInfo);
      // res.cookie('__userinfo', userInfo, {domain: config.appDomain});
      // userInfo = (new Buffer(userInfo)).toString('base64');
      var err = new SignupError('email_mobile_not_found', {
        message: 'User email address or mobile number or username not found'
      });

      next(err);
    }
    else {
      // Verify proxy user settings and pass proxy user session
      //if((user.role == 'admin' || user.role == 'finance' || user.role == 'watchuser') && req.cookies.cipxser && req.cookies.cipxser != '') {
      if((user.role == 'admin' || user.role == 'finance' || user.role == 'watchuser' || user.role == 'support') && user.currentcxview && user.currentcxview != '' && user.currentcxview != null && req.url.indexOf('cx-view-update') < 0) {
        User.findById(user.currentcxview+'', function(_err, __user) {
          if(_err || !__user) {
            req.user = user;
            next();
          }
          else {
            req.user = __user;
            next();
          }
        });
      }
      else {
        req.user = user;
        next();
      }
    }
  });
}

function validRequest(req, callback) {
  var isUpdateReq = (req.method == 'PUT' && req.url.indexOf('update-me') >= 0);

  if(isUpdateReq) {
    User.find({$or: [
      {email: req.body.email},
      {mobile: req.body.mobile},
      {username: req.body.username}
    ], email: {$ne: null}, mobile: {$ne: null}, username: {$ne: null}}, callback);
  }
  else {
    callback(null, !false);
  }
}

function validateCaptcha(responseCode, callback){
  var post_data = querystring.stringify({
    'secret' : config.captchaKey,
    'response': responseCode
  });

  var post_options = {
    host: 'www.google.com',
    port: '443',
    method: 'POST',
    path: '/recaptcha/api/siteverify',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(post_data)
    }
  };
  var req = https.request(post_options, function(resp) {
    var data = "";
    resp.on('data', function (chunk) {
      data += chunk.toString();
    });
    resp.on('end', function() {
      try {
        var parsedData = JSON.parse(data);
        console.log(parsedData);
        callback(parsedData.success);
      } catch (e) {
        console.log(e);
        callback(false);
      }
    });
  });
  req.write(post_data);
  req.end();
  req.on('error',function(err) {
    console.error(err);
    //callback(false);
  });
}

exports.isAuthenticated = isAuthenticated;
exports.hasRole = hasRole;
exports.signToken = signToken;
exports.setTokenCookie = setTokenCookie;
exports.placeUserAndCookie = placeUserAndCookie;
exports.validateCaptcha = validateCaptcha;
