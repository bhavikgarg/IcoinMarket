'use strict';

var _ = require('lodash');
var co = require('co');
var User = require('./user.model');
var CallerLog = require('./callers-logs.model');
var Payment = require('../payment/payment.model');
var CreditLogs = require('../credits/credit-logs.model.js');
var Credits = require('../credits/credits.model.js');
var Withdrawal = require('../withdrawal/withdrawal.model');
var EmailVeirfy = require('./emailverify.model');
var passport = require('passport');
var config = require('../../config/environment');
var jwt = require('jsonwebtoken');
var EmailService = require('../../components/emails/email.service');
var WSDL = require('../../components/wsdl/mapwsdl.service');
var CreditService = require('../../components/credits/credits.service');
var requestAweber = require('request');
var Genealogy = require('./../genealogy/genealogy.model');
var Countries = require('./../utilities/countries.model');
var LatestSignup = require('./../utilities/latestsignups.model');
var AgentLogs = require('./agent-logs.model');
var auth = require('../../auth/auth.service');
var Affiliates = require('./../affiliates/affiliates.model');
var moment = require('moment');
var uuid       = require('uuid');
var Sessions   = require('./../utilities/session.model');
var UserService = require('../../components/user/user.service');
var CompOffUsers = require('./compoff-user.model');
var CommissionLogs = require('./../credits/commission-log.model');
var PremiumUser = require('./premiumusers.model.js');
var NotificationService = require('../../components/notifications/notification.service');
var crypto = require('../../auth/crypto.helper');
var AWS = require('aws-sdk');
var Commitmentprofitlog = require('../commitments/commitmentsprofit-logs.model');
AWS.config.region = 'us-east-1';
AWS.config.update({ accessKeyId: config.aws.accessKeyId, secretAccessKey: config.aws.secretAccessKey });

var validationError = function(res, err) {
  return res.status(422).json(err);
};

exports.xyz = function (req, res) {
    var name = Math.random().toString(36).substring(16);
    var notificationService = new NotificationService();
    notificationService.createSignupNotification({
        userid: uuid.v1(),
        name: name,
        countryCode: 'IN'
    }, function (err, data) {
        if (!err) {
            return res.status(200).json(data);
        } else {
            return res.status(200).json(err);
        }
    });
}
/**
 * Get list of users
 * restriction: 'admin'
 */
exports.index = function (req, res) {
  var conditions = {}, limit = parseInt(req.query.limit || 50), anchorId = req.query.anchorId;
  var pageId = req.query.pageId || 1;
  var PAGE_SIZE = 25;
  var result = {},
    adcpacks = 0,
    level = -1;

  if (req.query.anchorId && req.query.anchorId > 0) {
    conditions.userProfileId = { $lt: anchorId };
  }

  if (req.query.dataFilter && req.query.dataFilter != '') {
    conditions['$or'] = [
      { username: req.query.dataFilter },
      { email: req.query.dataFilter },
      { name: { '$regex': req.query.dataFilter.toLowerCase(), '$options': 'i' } }
    ];
  }

  User.find(conditions, '-salt -hashedPassword -google -facebook -twitter -github -ip -username1 -__v -expiryTime').limit(limit).sort({
    userProfileId: -1
  }).exec(function (err, users) {
    if (err) {
      return res.status(500).send(err);
    } else {
      if (users && users.length) {
        // result.documents = users;
        // if compoff user, only one entry will come
        if (null != req.query.type && undefined != req.query.type) {
          // get credits of user and set level
          Credits.findOne({ userid: users[0]._id }, function (_e, credit) {
            //console.log(_e, credit);
            if (_e) {
              return res.status(500).send(_e);
            }
            if (!credit || credit == null) {
              return res.status(200).json([{ error: true, message: 'Sorry, No records found!!' }]);
            }
            var USD = credit.usd;
            console.log("USD : " + USD);
            console.log(config.apiConstants.L1_QUALIFIED);
            if (USD > 0 && USD <= config.apiConstants.L1_QUALIFIED) {
              level = 1;
            } else if (USD > config.apiConstants.L1_QUALIFIED && USD <= config.apiConstants.L2_QUALIFIED) {
              level = 2;
            } else if (USD > config.apiConstants.L2_QUALIFIED && (USD <= config.apiConstants.L3_QUALIFIED || USD >= config.apiConstants.L3_QUALIFIED)) {
              level = 3;
            }
            result.level = level;
            result.documents = users;
            return res.status(200).json([result]);

          })
        } else {
          result.documents = users;
          User.count({}, function (err, count) {
            var totalPages = count;
            result.totalPages = totalPages;
            // if (limit) result.totalPages = Math.ceil(totalPages / limit);
            // else result.totalPages = 1;

            if (result.totalPages > 1) {
              result.prevAnchorId = (anchorId || 0);
              result.nextAnchorId = users[users.length - 1].userProfileId;
            }
            res.status(200).json([result]);
          })
        }
      } else {
        result.documents = [];
        result.totalPages = 0;
        console.log(result);
        res.status(200).json([result]);
      }
    }
  })
};


/**
 * Gets list of users who haven't been contacted by Support admin yet.
 */
exports.getNonVerifiedUsers = function(req, res) {
    var conditions = {};
    var limit = parseInt(req.query.limit || 25);
    var result = {};
    var pageId = req.query.pageId || 1;
    var PAGE_SIZE = 25;

    if(req.query.text && req.query.text != '') {
      conditions['$or'] = [
        {username: req.query.text},
        {email: req.query.text},
        {name: {'$regex': req.query.text.toLowerCase(), '$options': 'i'}}
      ];
    }
    conditions["callStatus"] = "submitted";
    conditions["role"] = "user";
    conditions["isBlocked"] = false;
    conditions["verified"] = true;
    conditions["createdat"] = {
      $gte: new Date(config.ICM_PRE_LAUNCH_TIME)
    }
    if (req.query.countryCode && req.query.countryCode != '') {
        conditions["countryCode"] = req.query.countryCode;
    }
    if ((req.query.contactTimeFrom && req.query.contactTimeFrom != '')) {
        conditions["preferredContactTimeEnd"] = {
            "$gte": parseInt(req.query.contactTimeFrom)
        }
    }
    if ((req.query.contactTimeTill && req.query.contactTimeTill != '')) {
        conditions["preferredContactTimeStart"] = {
            "$lte": parseInt(req.query.contactTimeTill)
        }
    }

    User.find(conditions, '-salt -hashedPassword -google -facebook -twitter -github -ip -username1 -__v -expiryTime -categories').limit(limit).skip((pageId-1) * PAGE_SIZE).sort({
        preferredContactTimeStart: -1,
        preferredContactTimeEnd: -1,
        userProfileId: -1
    }).exec(function(err, users) {
        if (err) {
            return res.status(500).send(err);
        } else {
            if (users.length) {
                var usersData= [];
                users.forEach(function (user) {
                    usersData.push({
                        _id: user._id,
                        name: user.name,
                        flag: config.flagUrl.replace('FLAG_COUNTRY_CODE', (user.countryCode == null ? 'oth' : user.countryCode.toLowerCase())),
                        skype: user.skypeName,
                        mobile: user.mobile,
                        secondaryMobile: user.secondaryMobile,
                        timezone: user.timeZone,
                        preferredContactTimeStart: user.preferredContactTimeStart,
                        preferredContactTimeEnd: user.preferredContactTimeEnd,
                        callStatus: user.callStatus,
                        userOffset: user.userOffset,
                        avatar: user.avatar
                    });
                });
                result.documents = usersData;
                User.count(conditions, function(err, count) {
                  result.totalPages = count;
                  res.status(200).json(result);
                })
            } else {
              result.documents = [];
              result.totalPages = 0;
              res.status(200).json(result);
            }
        }
    });
};


/*
 * Picks a non verified user. The picked user cannot be picked by any another support admin.
 */
exports.pickUser = function (req, res, next) {
    co(function*() {
        let adminUser = yield User.findById(req.user.id + '');
        if (!adminUser) {
            return res.json({error: true,message: 'adminUser not found from id ' + (req.user.id + ''), freezeUser: false});
        } else {
            if (adminUser.assignedUser != null) {
                return res.json({error: true,message: 'A user has already been assigned to you.', freezeUser: false});
            }
        }

        let _user = yield User.findById(req.body.userid);
        if (!_user) {
            return res.json({error: true,message: 'User not found from id ' + req.body.userid, freezeUser: true});
        }

        if (_user.callStatus == 'submitted') {
            try {
                yield User.update({_id: Object(_user._id)}, {$set: {callStatus: 'inprogress', statusLastUpdatedAt: new Date()}});
            } catch (err) {
                console.log('User Call Status Update Error', err);
                return res.status(200).json({success: false,message: 'Unable to pick this user. Kindly verify user details.', freezeUser: false});
            }

            try {
                yield User.update({_id: Object(adminUser._id)}, {$set: {assignedUser: _user._id + ''}});
            } catch (err) {
                console.log('User Assign Error', err);
                return res.status(200).json({success: false,message: 'Unable to pick user', freezeUser: true});
            }

            return res.status(200).json({
                success: true,
                data: {
                    _id: _user._id,
                    name: _user.name,
                    flagUrl: config.flagUrl.replace('FLAG_COUNTRY_CODE', (_user.countryCode == null ? 'oth' : _user.countryCode.toLowerCase())),
                    skype: _user.skypeName,
                    mobile: _user.mobile,
                    secondaryMobile: _user.secondaryMobile,
                    timezone: _user.timeZone,
                    preferredContactTimeStart: _user.preferredContactTimeStart,
                    preferredContactTimeEnd: _user.preferredContactTimeEnd,
                    userOffset: _user.userOffset,
                    callStatus: _user.callStatus
                }
            });
        } else {
            return res.json({error: true,message: 'This user is not available for picking up now.', freezeUser: true});
        }

    }).catch(function(err) {
      return res.status(200).json({success: false, message : err.toString()});
    });
};


exports.updateUserCallStatus = function (req, res, next) {
    co(function*() {
        let adminUser = yield User.findById(req.user.id + '');
        if (!adminUser) {
            return res.json({error: true,message: 'adminUser not found from id' + 'req.user.id'});
        };

        let user = yield User.findById(req.body.userid);
        if (!user) {
            return res.json({error: true,message: 'User not found from id' + 'req.body.id'});
        }

        if (user.callStatus == 'inprogress') {
            try {
                yield User.update({_id: Object(user._id)}, {$set: {callStatus: req.body.callStatus, statusLastUpdatedAt: new Date()}});
            } catch (err) {
                return res.status(200).json({success: false,message: 'Unable to update current user status. Please try again.'});
            }

            //Callers Logs
            CallerLog.create({
              callerid: req.user.id,
              callername :req.user.username,
              userid: req.body.userid,
              useremail: user.email,
              username: user.username,
              callStatus: req.body.callStatus
            }, function(err, _agu) {
              if(_agu) {}
            });
        }

        try {
            yield User.update({_id: Object(adminUser._id)}, {$set: {assignedUser: null}});
          var emailService = new EmailService();
          if (req.body.callStatus == 'Wrong Number') {
              emailService.sendWrongNumberCallStatusMail({
                  mailTo: user.email,
                  name: user.name
              });
          } else if (req.body.callStatus == 'Not Answering') {
              emailService.sendUnavailableCallStatusMail({
                  mailTo: user.email,
                  kname: user.name
              });
          }
          res.status(200).json({ success: true, message: 'Status updated.'});
        } catch(e) {
          return res.json({
              success: false,
              message: 'Unable to unpick the current user. Please try again.'
          });
        }
    }).catch(function(err) {
      return res.status(200).json({success: false, message : err.toString()});
    })
};


exports.callersReport = function(req, res, next){
    var conditions = {};
    var query       = {};
    var viewLimit   =  parseInt(req.query.limit || 25);
    var currentPage = (req.query.page ? req.query.page : 1);
    var skipRows    = (viewLimit * (currentPage - 1));
    var callstatus     = req.query.callstatus;
    var callerId     = req.query.callerId;
    var excel = req.query.excel;
    if(callstatus){
        conditions.callStatus  = callstatus;
    }
    if(callerId){
        conditions.callerid  = callerId;
    }
    var tillDate = req.query.tillDate;
    var fromDate = req.query.fromDate;
    if(tillDate && fromDate){
        fromDate = new Date(new Date(new Date(new Date(fromDate).setHours(0)).setMinutes(0)).setSeconds(0));
        tillDate = new Date(new Date(new Date(new Date(tillDate).setHours(23)).setMinutes(59)).setSeconds(59));
        conditions.createdat = {"$gte":fromDate, "$lte":tillDate};
    }

  CallerLog.find(conditions).limit(viewLimit).skip(skipRows).sort({
       createdat: -1
    }).exec(function (err, data) {
    if (err) {
                res.status(200).json({message: 'No History Found.'});
            }
            else{
               CallerLog.count(conditions, function (err, count) {
               return res.status(200).json({error : false ,result : data,totalPages : count});
             });
            }
      });
}

exports.profitLogsReport = function(req, res, next){
    var conditions = {};
    var query       = {};
    var viewLimit   =  parseInt(req.query.limit || 25);
    var currentPage = (req.query.page ? req.query.page : 1);
    var skipRows    = (viewLimit * (currentPage - 1));
    var portfolioManagerId     = req.query.portfolioManagerId;
    var excel = req.query.excel;

    if(portfolioManagerId){
        conditions.updatedby  = portfolioManagerId;
    }
    var tillDate = req.query.tillDate;
    var fromDate = req.query.fromDate;
    if(tillDate && fromDate){
        /*fromDate = new Date(new Date(new Date(new Date(fromDate).setHours(0)).setMinutes(0)).setSeconds(0));
        tillDate = new Date(new Date(new Date(new Date(tillDate).setHours(23)).setMinutes(59)).setSeconds(59));*/
        conditions.createdat = {"$gte":fromDate, "$lte":tillDate};
    }

    var populateQuery = [{
        path: 'updatedby',
        select: 'name'
    }];
    Commitmentprofitlog.find(conditions).populate(populateQuery).limit(viewLimit).skip(skipRows).sort({
        createdat: -1
     }).exec(function(err, data) {
        if (err) {
            console.log('Error: While fetching commitment profit logs list', err);
            res.status(200).json({profitloglist: []});
        }
        else{
          Commitmentprofitlog.count(conditions, function (err, count) {
               return res.status(200).json({error : false ,result : data,totalPages : count});
             });
        }
    });

  // Commitmentprofitlog.find(conditions).limit(viewLimit).skip(skipRows).sort({
  //      createdat: -1
  //   }).exec(function (err, data) {
  //   if (err) {
  //               res.status(200).json({message: 'No History Found.'});
  //           }
  //           else{
  //              Commitmentprofitlog.count(conditions, function (err, count) {
  //              return res.status(200).json({error : false ,result : data,totalPages : count});
  //            });
  //           }
  //     });
}

exports.supportUsersList = function(req, res, next){
   User.find({role : 'support'}, '_id name', function(err, supportUsers) {
      if(err){
        res.status(200).json({message: 'No History Found.'});
      }
    else{
      return res.status(200).json({error : false ,result : supportUsers});
    }
   });
}

exports.portfolioManagersList = function(req, res, next){
   User.find({role : 'manager'}, '_id name', function(err, portfolioManagers) {
      if(err){
        res.status(200).json({message: 'No History Found.'});
      }
    else{
      return res.status(200).json({error : false ,result : portfolioManagers});
    }
   });
}



/**
 * Creates a new user
 */
exports.create = function(req, res, next) {
  console.log(req.body);
  if(req.body && req.body.key){
    auth.validateCaptcha(req.body.key, function(status){
        if(status){
          req.body.password = crypto.decrypt(req.body.password);
          req.body.email = crypto.decrypt(req.body.email);
          var newUser = new User(req.body);

          newUser.provider  = 'local';
          newUser.role      = 'user';
          newUser.useragent = req.headers;
          /* block user from blocked ips*/
          var blockedIds = config.blockedIds ? config.blockedIds : [];
          if(!newUser.ip || blockedIds.indexOf(newUser.ip) >=0)
          {
            return res.status(200).json({error: true, message: 'Something went wrong.'});
          }
          else if(!newUser.password || (newUser.password && newUser.password.trim() == '')) {
            return res.status(200).json({error: true, message: 'Required informations are missing'});
          }
          else{
            var userService = new UserService();
            userService.checkIpLimit(newUser.ip, function(err, isValid){
              if(err || isValid){
                  return res.status(200).json({error: true, message: 'Maximum registration limit reached from your IP'});
              }
              else {
                User.findOne({
                  "$or": [
                    {email: {'$regex': newUser.email, '$options': 'i'}},
                    {username: {'$regex': newUser.username, '$options': 'i'}}
                  ]
                }, function(error, _user) {
                  if(error) { console.log(error); return res.status(200).json({error: true, message: 'Unable to add user'}); }

                  if(_user) {
                    if(_user.email.toLowerCase() == newUser.email.toLowerCase()) {
                      return res.status(200).json({error: true, message: 'Please use different email address'});
                    }
                    if(_user.username.toLowerCase() == newUser.username.toLowerCase()) {
                      return res.status(200).json({error: true, message: 'Please choose different username.'});
                    }
                  }

                  Sessions.findById(req.cookies.refby, function(err, data) {
                    if(!data || err) { return validationError(res, {message: 'Sponsor info not found'}); }

                    var _data = JSON.parse(data.session);
                    User.findOne({username: _data.sponsorId}, function(error, sponsor) {

                      if(error || !sponsor) { return res.status(200).json({error: true, message: 'Unable to verify sponsor'}); }

                      newUser.sponsor  = sponsor._id+'';
                      newUser.verified = false;

                      // Email is verified now user can signup
                      newUser.save(function(err, user) {
                        console.log(err, user);
                        if (err) return validationError(res, err);

                        /* add document to user credits */
                        Credits.create({userid : user._id, adscash: 0, usd: 0}, function(err, ucredit){
                            if(!err && ucredit){
                              console.log("User credits created."+ucredit);
                              console.log(config.signupBonus);
                              if(config.signupBonus && config.signupBonus.usd)
                              {
                                var _Credits = new CreditService();
                                _Credits.addCreditTransferLog(user._id, {
                                  amount: config.signupBonus.usd,
                                  description: config.signupBonus.description,
                                  type: 'usd',
                                  subtype: 'P',
                                  cointype: 'PROMOTION-SIGNUP',
                                  createdat: (new Date())
                                }, function(err, data) {
                                  console.log('Credit Log Info: ', err, data._id);
                                  _Credits.updateCredits(user._id, {
                                    adscash: 0,
                                    usd : config.signupBonus.usd,
                                    adcpacks : 0
                                  }, function(err, _data) {
                                    console.log('Credits Info signup bonus added: ', err, _data);
                                  });
                                });
                              }
                            }
                        });
                        // Map user and his referral
                        Genealogy.create({
                          user: user,
                          ref: [
                            sponsor._id+'',
                            _data.sponsorName,
                            sponsor.userProfileId,
                            (_data.sponsorTarget ? _data.sponsorTarget : ''),
                            _data.sponsorId
                          ]
                        }, function(gerror, ginfo) {
                          if(gerror || !ginfo) {
                            user.remove(function(e) { console.log('unable to create genealogy'); });
                          }
                          LatestSignup.create({userid : user._id, name : user.name, country : user.countryCode }, function(err, ltsp){
                            console.log('Latest Signup added:'+err);
                          });

                          // Update affilation for Referral signup count
                          if(_data.sponsorTarget){
                            Affiliates.findOne({target: _data.sponsorTarget}, function(err, affilate) {
                              console.log("Affilate Error:"+err );
                              if(!err && affilate) {
                                affilate.update({registercount: (affilate.registercount + 1)}, function(_err, _resp) {
                                  console.log('Affilate Referral Singup Count Update: ', _err);
                                });
                              }
                            });
                          }

                          var urlOrigin  = req.headers.origin;
                          // var startPoint = Math.floor(Math.random() * (16 - 8 + 1) + 8);
                          // var bufferBase = new Buffer(user._id + '');
                          // bufferBase = bufferBase.toString('hex').substr(startPoint, 8);
                          var everify = new EmailVeirfy({userId: user._id, customText: '-'});
                          everify.save(function(err, uverify) {

                            var emailService = new EmailService();
                            emailService.sendAccountVerifyEmail(urlOrigin, uverify, user, null);

                            if ((!user.countryCode || user.countryCode == '') && user.countryName) {
                              Countries.findOne({
                                name: new RegExp('^' + user.countryName + '$', 'i')
                              }, function(err, d) {
                                var countryCode = (d ? d.code : user.countryCode);
                                var countryName = (d ? d.name : user.countryName);

                                user.update({
                                  countryCode: countryCode,
                                  countryName: countryName
                                }, function(err, data) {
                                  console.log('[info] user update country code and name ', err);
                                })
                              });
                            }

                            var token = jwt.sign({_id: user._id}, config.secrets.session, {expiresIn:'5h'});
                            res.json({token: token});
                          });
                        });
                      });
                    });
                  });
                });
              }
            });
          }
        }
        else{
          res.status(200).json({error: true, message: 'Invalid Key.' });
        }
    });
  }
  else{
    res.status(200).json({error: true, message: 'Missing params.' });
  }
};

/**
 * Get a single user
 */
exports.show = function(req, res, next) {
  var userId = req.params.id;
  var showFull = ((req.query && req.query.all) ? (req.query.all == 1) : false);

  if(req.user.role != 'admin' && userId != req.user._id) {
    return res.status(401).send('Unauthorized');
  }

  User.findOne({
    "_id": userId,
    "$or": [{"isBlocked": false}, {"isBlocked": null}],
    "verified": true
  }, '-salt -hashedPassword -google -facebook -twitter -github -ip -isBlocked -username1 -__v -expiryTime -verified', function(err, user) {
    if (err) return next(err);
    if (!user || user.isBlocked) return res.status(401).send('Unauthorized');
    res.json((showFull ? user : user.profile));
  });
};


/**
 * check email and username exists
 */
exports.checkemail = function(req, res, next) {
  var query = {email: req.body.email};
  if(req.body.uid) {
    query['_id'] = {"$nin": [(new Object(req.body.uid))]};
  }

  User.findOne(query, function(err, user) {
    if (err){
      res.json({ user: false});
    }
    else if(user){
      res.json({ user : true });
    } else {
      res.json({ user: false});
    }
  });
};


/**
 * Update single user
 */
exports.updateInfo = function(req, res, next) {
  var userId = req.user._id;
  var query = {};
  if (userId == req.body._id || req.user.role == 'admin') {

    if (req.user.role == 'admin') {
      userId = req.body._id;
    }

    if(req.user.role != 'admin' && req.user._id != userId) {
      return res.status(401).send('Unauthorized');
    }

    if(req.body.provider && req.body.provider === 'facebook') {
      query = {_id : userId}; //, verified : false
    } else {
      query = {_id : userId, verified : true};
    }

    User.findOne(query, '-salt -hashedPassword -google -facebook -twitter -git', function(err, user) {

      if (err) return next(err);
      if (!user) return res.status(401).send('Unauthorized');
      if(user && (user.isBlocked == true || user.verified == false && user.provider !== 'facebook')) {
        return res.status(401).send('unauthorized')
      }

      if(req.body.provider == 'facebook') {
        user.username = req.body.username;
      }

      User.findOne({
        "$or": [
          {email: req.body.email.toLowerCase(),  _id: {$ne: req.body._id.toString()}},
          {username: req.body.username.toLowerCase(), _id: {$ne: req.body._id.toString()}}
        ]
      }, function(error, _user) {
        if(!error && _user && _user._id.toString() != req.user._id.toString()){
          if(_user.email.toLowerCase() == req.body.email.toLowerCase()) {
            return res.status(200).json({error: true, message: 'Please use different email address'});
          }
          else if(_user.username.toLowerCase() == req.body.username.toLowerCase()) {
            return res.status(200).json({error: true, message: 'Please choose different username.'});
          }
          else{
            return res.status(200).json({error: true, message: 'Duplicate information.'});
          }
        }
        else{
                var updateData = {
                  name: req.body.name || user.name,
                  email: (user.email ? user.email : req.body.email),
                  countryName: req.body.countryName || user.countryName,
                  countryCode: req.body.countryCode || user.countryCode,
                  mobile: req.body.mobile || user.mobile,
                  address: req.body.address || user.address,
                  city: req.body.city || user.city,
                  state: req.body.state || user.state,
                  pincode: req.body.pincode || user.pincode,
                  accountname: req.body.accountname || user.accountname,
                  accountno: req.body.accountno || user.accountno,
                  bankname: req.body.bankname || user.bankname,
                  branch: req.body.branch || user.branch,
                  code: req.body.code || user.code,
                  // categories: req.body.categories || user.categories,
                  govidtaxid: req.body.govidtaxid || user.govidtaxid,
                  quickypay: req.body.quickypay || user.quickypay,
                  payza: req.body.payza || user.payza,
                  paypal: req.body.paypal || user.paypal,
                  avatar: req.body.avatar || user.avatar,
                  username: (user.username ? user.username : req.body.username),
                  personaldoc: ((req.body.personaldoc && req.body.personaldoc != '') ? (req.body.personaldoc) : user.personaldoc),
                  photoid: ((req.body.photoid && req.body.photoid != '') ? (req.body.photoid) : user.photoid),
                  bitcoin: ((req.body.bitcoin && req.body.bitcoin != '' && (!user.hasOwnProperty('bitcoinedit') || user.bitcoinedit)) ? (req.body.bitcoin) : user.bitcoin),
                  bitcoinscreenshot: ((req.body.bitcoinscreenshot && req.body.bitcoinscreenshot != '') ? (req.body.bitcoinscreenshot) : user.bitcoinscreenshot),
                  advcash: ((!user.hasOwnProperty('advcashedit') || user.advcashedit) ? req.body.advcash : user.advcash),
                  advcashedit: ((!user.hasOwnProperty('advcashedit') || user.advcashedit) ? req.body.advcashedit : user.advcashedit),
                  bitcoinedit: ((!user.hasOwnProperty('bitcoinedit') || user.bitcoinedit) ? req.body.bitcoinedit : user.bitcoinedit),
                  payzaedit: ((!user.hasOwnProperty('payzaedit') || user.payzaedit) ? req.body.payzaedit : user.payzaedit),
                  stp: ((!user.hasOwnProperty('stpedit') || user.stpedit) ? req.body.stp : user.stp),
                  stpedit: ((!user.hasOwnProperty('stpedit') || user.stpedit) ? req.body.stp : user.stpedit),
                  //added by Prshant
                  /*secondaryMobile : req.body.secondaryMobile,
                  timeZone : req.body.timeZone,
                  timeZoneCountry : req.body.timeZoneCountry,
                  preferredContactTimeStart: req.body.preferredContactTimeStart,
                  preferredContactTimeEnd : req.body.preferredContactTimeEnd,*/
                  /*contactTimeStart : req.body.contactTimeStart || user.contactTimeStart,
                  contactTimeEnd : req.body.contactTimeEnd || user.contactTimeEnd,*/
                  //skypeName : req.body.skypeName,
                  callStatus: (user.callStatus == 'inprogress' ? user.callStatus :  (req.body.callStatus || user.callStatus)),
                  //userOffset : req.body.userOffset
                }

                if(req.body.userOffset)
                    updateData.userOffset = req.body.userOffset;
                if(req.body.preferredContactTimeStart)
                    updateData.preferredContactTimeStart = req.body.preferredContactTimeStart;
                if(req.body.preferredContactTimeEnd)
                    updateData.preferredContactTimeEnd = req.body.preferredContactTimeEnd;
                if(req.body.secondaryMobile)
                    updateData.secondaryMobile = req.body.secondaryMobile
                if(req.body.timeZone)
                    updateData.timeZone = req.body.timeZone;
                if(req.body.timeZoneCountry)
                    updateData.timeZoneCountry = req.body.timeZoneCountry;
                if(req.body.skypeName)
                    updateData.skypeName = req.body.skypeName;

                User.findByIdAndUpdate(req.body._id, updateData, {new: true}, function(err, user) {

                // user.update(updateData , {new : true}, function(err, _usr) {
                  if (err) return next(err);

                  if (req.user.role == 'admin' && req.body.password && req.body.password != '') {
                    user.password = req.body.password;
                    user.save(function(err) {
                      if (err) console.log('Admin: Unable to change user password');
                    });
                  }

                  Countries.findOne({
                    name: new RegExp('^' + (req.body.countryName || user.countryName) + '$', 'i')
                  }, function(err, d) {
                    var countryCode = (d ? d.code : user.countryCode);
                    var countryName = (d ? d.name : (req.body.countryName || user.countryName));

                    Genealogy.updateMember({
                      id: user._id,
                      countryCode: countryCode,
                      countryName: countryName,
                      email: (req.body.email || user.email),
                      name: (req.body.name || user.name)
                    }, function(data) {
                      console.log('Tree is updated');
                    });

                  });

                  if(req.body.provider && req.body.provider === 'facebook') {
                    var urlOrigin  = req.headers.origin;
                    var everify = new EmailVeirfy({userId: user._id, customText: '-'});
                    everify.save(function(err, uverify) {
                      var emailService = new EmailService();
                      // console.log("Sending verify email : "+urlOrigin, JSON.stringify(uverify), JSON.stringify(_usr));
                      emailService.sendAccountVerifyEmail(urlOrigin, uverify, {name : req.body.name || user.name , email : (user.email ? user.email : req.body.email)}, null);
                    });
                  }

                  res.json(user);
                });
        }
      });
    });
  }
  else {
    res.status(401).json('Unauthorized update request');
  }
}

/**
 * Deletes a user
 * restriction: 'admin'
 */
exports.destroy = function(req, res) {
  User.findById(req.params.id, function(err, user) {
    if (err) return res.status(500).send(err);
    if (user && user.role == 'admin') {
      var _err = new Error('Admin user can\'t be deleted');
      return res.status(500).send(_err);
    }

    /* User.findByIdAndRemove(req.params.id, function(err, user) {
      if(err) return res.status(500).send(err);
      return res.status(204).send('No Content');
    }); */

    user.update({
      isBlocked: req.query.blocked
    }, function(err, user) {
      if (err) return res.status(500).send(err);
      return res.status(204).send('No Content');
    })
  });
};

/**
 * Change a users password
 */
exports.changePassword = function(req, res, next) {
  var userId = req.user._id;
  var oldPass = String(crypto.decrypt(req.body.oldPassword));
  var newPass = String(crypto.decrypt(req.body.newPassword));

  User.findOne({
    "_id": userId,
    "$or": [{"isBlocked": false}, {"isBlocked": null}],
    "verified": true
  }, '-mobile -username -email', function(err, user) {
    if (user.authenticate(oldPass)) {
      user.password = newPass;
      user.save(function(err) {
        if (err) return validationError(res, err);
        res.status(200).send('OK');
      });
    } else {
      res.status(403).send('Forbidden');
    }
  });
};

/**
 * Change a users password
 */
exports.forgetChangePassword = function(req, res, next) {
  var userId = String(req.body.token);
  var pass = crypto.decrypt(String(req.body.password));
  var cpass = crypto.decrypt(String(req.body.cpassword));
  var urlOrigin = (req.headers.origin || config.email.defaultOriginUrl);
  var splitIds = userId.split(':');

  if((splitIds.length != 2) || (pass !== cpass) || (/^(?=.*[a-zA-Z])(?=.*[0-9]).+$/.test(pass) !== true)) {
    return res.status(200).send({
      isValid: false
    });
  }

  EmailVeirfy.findOne({
    "_id": splitIds[0]+'',
    customText: splitIds[1]
  }, function(e, ev) {

    if(e || !ev) {
      return res.status(200).send({
        isValid: false
      });
    }
    else {

      ev.remove(function(err) {
        console.log(err);
      });

      User.findOne({"_id": ev.userId+''}, '-mobile -username -email', function(err, user) {

        if (!err && user) {

          user.password = pass;
          user.save(function(err) {
            if (err) return validationError(res, err);

            var startPoint = Math.floor(Math.random() * (16 - 8 + 1) + 8);
            var bufferBase = new Buffer(user._id + '');
            bufferBase = bufferBase.toString('hex').substr(startPoint, 8);
            var everify = new EmailVeirfy({
              userId: user._id,
              customText: bufferBase
            });

            everify.save(function(err, uverify) {
              var subject = 'iCoin: Change Password';
              var _verifyLink = urlOrigin + '/change-password/' + uverify._id;
             // var message = '<h4>Hi! ' + user.name + ',</h4><p>You have received this email because someone or you may change your password with us.</p><p>If you have not do this, please click on below link to change your password again or if you did this; please simply ignore this email.</p><p><a href="' + _verifyLink + '">Click here</a> to change your password with iCoin.</p><p>If above link is not working, please copy and paste "' + _verifyLink + '" at your browser\'s address bar.</p><p>Thank you,</p><br><h5>iCoin Team</h5>';
             // Forgot password template
              var message = '<div style="max-width: 600px; color: #f90; border-radius:10px; text-align: center; min-height: 300; font-family: arial; text-align: center; margin: auto; padding: 20px; overflow: hidden; box-shadow: 2px 2px 2px 2px #f2f2f2; border:1px solid #ccc;"> <img src="' + config.emailDomain + '/assets/images/91063c67.icmlogo.png" width=200><br/><br/><br/> <h3>In Case you are Missing your Password</h3><div style="text-align:left;color:black"> <div style="text-align:center;font-size:12px"><h2 style="background: #083983; color: #fff; padding: 10px; border-radius: 60px;"> Click on the <b>'+_verifyLink+'</b> link<br/> and Generate a Fresh Password!</h2></div><br/>Thanks And Regards,<br/><strong>Team Icoin Market</strong></p></div><p style="color: #f90;">In case you are seeing this email by mistake,<br/>Please get the support informed! <br/><hr/>Drop an email at <b>support@icoinmarket.com </b> for instant replies.<br/></</div><hr/><table align="center" style="margin: 0 auto;padding-top:10px"><tr><td style="text-align: center; color:#000;font-size: 12px;" colspan="2"><p style="padding-bottom:5px">Don\'t have an account at <span style="color: #f90;"> iCoin</span>?</p></td></tr><tr><td style="padding-left: 18px;text-align:center;" colspan="2"><a href="#"><img src="' + config.emailDomain + '/assets/images/learn-button.png" alt="learn"></a></td></tr><tr><td style="text-align: center;padding-top: 6px;padding-right: 21px;" colspan="2"> <a href="#"> <img src="' + config.emailDomain + '/assets/images/twitter.png" alt="twitter"></a> <a href="https://www.youtube.com/channel/UCjG1qbP7T8oqxPK7brWdbVw"><img src="' + config.emailDomain + '/assets/images/youtube.png" alt="youtube"></a> <a href="https://www.facebook.com/groups/icoinmarket"> <img src="' + config.emailDomain + '/assets/images/facebook.png" alt="facebook"></a><a href="http://support.icoinmarket.com/"><img src="' + config.emailDomain + '/assets/images/live-chat-button.png" alt="live chat"></a></td></tr><tr><td style="text-align: center;color:#4A99BC;padding-bottom:13px;font-size:12px" colspan="2">Manage your subscriptions | <a href="' + config.emailDomain + '/terms-of-service" style="color: #4A99BC; text-decoration: blink;">Privacy Policy</a></td></tr><tr><td style="text-align: center; color:#FFFFFF;font-size:12px" colspan="2">&nbsp;</td></tr></table> </td></tr></table> </td></tr></table>';

              // Email content-----as forgot password
             /* var message =  '<div style="max-width: 600px; color: #f90; border-radius:10px; text-align: center; min-height: 300; font-family: arial; text-align: center; margin: auto; padding: 20px; overflow: hidden; box-shadow: 2px 2px 2px 2px #f2f2f2; border:1px solid #ccc;"><img src="icmlogo.png" width=200><br/><br/><br/> <h1 style="font-size: 40px;"><b>Hey There!!! </b></h1> <p style=" padding: 10px; background: #fbfbfb; border:1px solid #e2e2e2; color: #525252; padding-top: 10px; border-radius: 5px;"> <b>Its sad you lost your password! We are more happy to help you hare. Click on the following link to reset your password.</b> &lt;link&gt;</p> <p style="color: #f90;">In case you are seeing this email by mistake,<br/>Please get the support informed! <br/><br/><hr/>Drop an email at <b>support@icoinmarket.com </b> for instant replies.</p> </div>'*/

              var emailService = new EmailService();
              emailService.sendEmail(user.email, config.email.mailFrom, subject, message,null, function(error, info) {
                if (error) {
                  console.log(error, message);
                } else {
                  console.log('Message sent: ' + info.response, message);
                };
              });
            });

            res.status(200).json({
              isValid: true
            });
          });
        } else {
          res.status(200).send({
            isValid: false
          });
        }
      });
    }

  });
};

exports.verifyForgetPassEmail = function(req, res, next) {
  EmailVeirfy.findOne({
    _id: req.query.token + ''
  }, function(err, data) {

    if (err || !data) {
      res.status(200).json({
        isValid: false
      });
    } else {
      data.remove(function(err) {
        console.log(err);
      });

      var token = uuid.v1();

      EmailVeirfy.create({
        userId: data.userId,
        customText: token
      }, function(_err, _d) {

        if(_err || !_d) {
          return res.status(200).json({
            isValid: false,
          });
        }

        return res.status(200).json({
          isValid: true,
          token: _d._id+':'+token
        });
      });
    }
  })
};

/**
 * Get my info
 */
exports.me = function(req, res, next) {
  var userId = req.user._id;

  User.findOne({
    "_id": userId,
    "$or": [{"isBlocked": false}, {"isBlocked": null}],
    "verified": true
  }, '-salt -hashedPassword -google -facebook -twitter -github -ip -isBlocked -username1 -__v -verified', function(err, user) { // don't ever give out the password or salt
    if (err) return next(err);
    if (!user || user.isBlocked) return res.status(401).send('Unauthorized');

    var userInfo =_.clone(user);
        userInfo = userInfo._doc;
        userInfo.currentTime = new Date();
    res.json(userInfo);
  });
};


exports.verifyEmail = function(req, res, next) {
  var urlOrigin = req.headers.origin;
  EmailVeirfy.findOne({
    _id: req.body.token //,
      //customText: req.body.code
  }, function(err, data) {

    if (err) return next(err);
    if (!data) return res.status(401).send('Invalid request: To verify user email address');

    User.findOne({
      _id: data.userId
    }, function(err, _user) {

      if (err) return next(err);
      if (!_user) return res.status(401).send('Invalid request: User not found');

      _user.update({
        'verified': true
      }, function(err) {
        data.remove(function(err) {
          console.log(err);
        });

        // Send Welcome Email On Successfull Signup
        var emailService = new EmailService();
        emailService.sendWelcomeEmail(_user.email, _user.name, urlOrigin);
        emailService.sendMailToSponsor(_user, (_user.sponsor || config.sponsorId));
      });

      res.json(data);
    });

  });
};


exports.getById = function(req, res, next) {
  var query = {"_id": req.query.reference+''};

  if(req.user.role != 'admin' && req.user.role != 'support') {
    if((req.query.reference != req.user._id) && (req.user.sponsor != req.query.reference)) {
      return res.status(200).json({error: true, message: 'Invalid Request'});
    }

    if(req.user.sponsor != req.query.reference) {
      query["$or"]      = [{"isBlocked": false}, {"isBlocked": null}];
      query["verified"] = true;
    }
  }

  User.findOne(query, 'name username userProfileId avatar email countryCode countryName mobile skypeName preferredContactTimeStart preferredContactTimeEnd timeZone secondaryMobile userOffset callStatus',
  function(err, _user) {
    if (err) { return res.status(200).json({error: true, message: 'Invalid Request'}); }

    if (!_user || _user.isBlocked) {
      return res.status(200).send({
        message: 'Invalid request: User not found: '
      });
    }

    res.json({
      _id:_user._id,
      name: (_user.name || _user.username),
      profile: _user.userProfileId,
      email: _user.email,
      username: _user.username,
      country: _user.countryName,
      expiryTime: _user.expiryTime,
      rank: 0,
      mobile: (_user.mobile || '-'),
      advcash: (_user.advcash || '-'),
      bitcoin: (_user.bitcoin || '-'),
      payza: (_user.payza || '-'),
      stp: (_user.stp || '-'),
      bitcoinscreenshot: (_user.bitcoinscreenshot || ''),
      flagUrl: config.flagUrl.replace('FLAG_COUNTRY_CODE', (_user.countryCode == null ? 'oth' : _user.countryCode.toLowerCase())),
      skype: _user.skypeName,
      secondaryMobile: _user.secondaryMobile,
      timezone: _user.timeZone,
      avatar: _user.avatar,
      preferredContactTimeStart: _user.preferredContactTimeStart,
      preferredContactTimeEnd: _user.preferredContactTimeEnd,
      userOffset: _user.userOffset,
      callStatus: _user.callStatus,
      skypeName: _user.skypeName
    })
  });
};

exports.verifyUserName = function(req, res, next) {
  User.findOne({
    username: req.body.username
  }, function(err, _user) {
    if (err) return next(err);

    res.status(200).json({
      'isValid': (!_user)
    });
  })
}

exports.forgetPassword = function(req, res, next) {
  //var urlOrigin = req.headers.origin;
  var urlOrigin = config.email.defaultOriginUrl;
  User.findOne({
    email: req.body.email.toLowerCase(),
    "$or": [{"isBlocked": false}, {"isBlocked": null}],
    "verified": true
  }, function(err, _user) {
    if (err || !_user) {
      return res.status(200).json({
        'isValid': false
      });
    } else {

      var startPoint = Math.floor(Math.random() * (16 - 8 + 1) + 8);
      var bufferBase = new Buffer(_user._id + '');
      bufferBase = bufferBase.toString('hex').substr(startPoint, 8);
      var everify = new EmailVeirfy({
        userId: _user._id,
        customText: bufferBase
      });

      everify.save(function(err, uverify) {
        var subject = 'iCoin: Forget Password';
        var _verifyLink = urlOrigin + '/change-password/' + uverify._id;
        //var message = '<h4>Hi! ' + _user.name + ',</h4><p>You have received this email because someone or you may have requested for new password.</p><p>If you have not done this simply ignore this email or if you need to change your password go ahead.</p><p><a href="' + _verifyLink + '">Click here</a> to change your password with iCoin.</p><p>If above link is not working, please copy and paste "' + _verifyLink + '" at your browser\'s address bar.</p><p>Thank you,</p><br><h5>iCoin Team</h5>';
        // Forgot password template
        var message = '<div style="max-width: 600px; color: #f90; border-radius:10px; text-align: center; min-height: 300; font-family: arial; text-align: center; margin: auto; padding: 20px; overflow: hidden; box-shadow: 2px 2px 2px 2px #f2f2f2; border:1px solid #ccc;"> <img src="' + config.emailDomain + '/assets/images/91063c67.icmlogo.png" width=200> <br/> <br/> <br/> <h3>In Case you are Missing your Password</h3> <div style="text-align:left;color:black"> <div style="text-align:center;font-size:12px"> <h2 style="background: #083983; color: #fff; padding: 10px; border-radius: 60px;"> Click on the <b>'+_verifyLink+'</b> link <br/> and Generate a Fresh Password! </h2> </div><br/>Thanks And Regards, <br/> <strong>Team Icoin Market</strong> </p></div><p style="color: #f90;"> In case you are seeing this email by mistake, <br/>Please get the support informed! <br/> <hr/>Drop an email at <b>support@icoinmarket.com </b> for instant replies. <br/> </p><hr/> <table align="center" style="margin: 0 auto;padding-top:10px"> <tr> <td style="text-align: center; color:#000;font-size: 12px;" colspan="2"> <p style="padding-bottom:5px"> Do not have an account at <span style="color: #f90;"> iCoin</span>? </p></td></tr><tr> <td style="padding-left: 18px;text-align:center;" colspan="2"> <a href="#"> <img src="' + config.emailDomain + '/assets/images/learn-button.png" alt="learn"> </a> </td></tr><tr> <td style="text-align: center;padding-top: 6px;padding-right: 21px;" colspan="2"> <a href="#"> <img src="' + config.emailDomain + '/assets/images/twitter.png" alt="twitter"> </a> <a href="https://www.youtube.com/channel/UCjG1qbP7T8oqxPK7brWdbVw"> <img src="' + config.emailDomain + '/assets/images/youtube.png" alt="youtube"> </a> <a href="https://www.facebook.com/groups/icoinmarket"> <img src="' + config.emailDomain + '/assets/images/facebook.png" alt="facebook"> </a> <a href="http://support.icoinmarket.com/"> <img src="' + config.emailDomain + '/assets/images/live-chat-button.png" alt="live chat"> </a> </td></tr><tr> <td style="text-align: center;color:#4A99BC;padding-bottom:13px;font-size:12px" colspan="2"> Manage your subscriptions | <a href="' + config.emailDomain + '/terms-of-service" style="color: #4A99BC; text-decoration: blink;">Privacy Policy</a> </td></tr><tr> <td style="text-align: center; color:#FFFFFF;font-size:12px" colspan="2">&nbsp;</td></tr></table></div>';

        // Email content-----as forgot password
       /* var message =  '<div style="max-width: 600px; color: #f90; border-radius:10px; text-align: center; min-height: 300; font-family: arial; text-align: center; margin: auto; padding: 20px; overflow: hidden; box-shadow: 2px 2px 2px 2px #f2f2f2; border:1px solid #ccc;"><img src="icmlogo.png" width=200><br/><br/><br/> <h1 style="font-size: 40px;"><b>Hey There!!! </b></h1> <p style=" padding: 10px; background: #fbfbfb; border:1px solid #e2e2e2; color: #525252; padding-top: 10px; border-radius: 5px;"> <b>Its sad you lost your password! We are more happy to help you hare. Click on the following link to reset your password.</b> &lt;link&gt;</p> <p style="color: #f90;">In case you are seeing this email by mistake,<br/>Please get the support informed! <br/><br/><hr/>Drop an email at <b>support@icoinmarket.com </b> for instant replies.</p> </div>'*/

        var emailService = new EmailService();
        emailService.sendEmail(_user.email, config.email.mailFrom, subject, message, null, function(error, info) {
          if (error) {
            console.log(error, message);
          } else {
            console.log('Message sent: ' + info.response, message);
          };
        });

        res.status(200).json({
          'isValid': true
        });
      });
    }
  });
}


exports.resendVerification = function(req, res, next) {
  var urlOrigin = req.headers.origin;
  User.findOne({
    email: req.body.email.toLowerCase(),
    "$or": [{"isBlocked": false}, {"isBlocked": null}],
  }, function(err, _user) {
    if (err || !_user) {
      return res.status(200).json({
        error: 'This email is not registered with us. Please check your provided email address'
      });
    } else if (!err && _user && _user.verified == true) {
      return res.status(200).json({
        error: 'Your account is already verified with us'
      });
    } else {
      EmailVeirfy.findOne({
        userId: _user._id + ''
      }, function(eev, ev) {

        if (eev || !ev) {
          var startPoint = Math.floor(Math.random() * (16 - 8 + 1) + 8);
          var bufferBase = new Buffer(_user._id + '');
          bufferBase = bufferBase.toString('hex').substr(startPoint, 8);
          var everify = new EmailVeirfy({
            userId: _user._id,
            customText: bufferBase
          });

          everify.save(function(err, uverify) {
            var emailService = new EmailService();
            emailService.sendAccountVerifyEmail(urlOrigin, uverify, _user, res)
          });

        } else {

          var emailService = new EmailService();
          emailService.sendAccountVerifyEmail(urlOrigin, ev, _user, res);
        }

      });

    }
  });
}

exports.sendVerificationLink = function(req, res, next) {
  var urlOrigin = req.headers.origin;

  User.findOne({
    username: req.body.uname.toLowerCase(),
    email: req.body.uemail.toLowerCase(),
    "$or": [{"isBlocked": false}, {"isBlocked": null}]
  }, function(err, _user) {

    if (!err && _user && _user.verified) {
      return res.status(200).json({
        error: 'You have already verified your account with us',
        message: true,
        send: false
      });
    }

    if (err || !_user) {
      console.log("Error:"+err, _user);
      return res.status(200).json({
        error: 'Something went wrong, please contact support system',
        send: false
      });
    }

    EmailVeirfy.findOne({
      userId: _user._id + ''
    }, function(eev, ev) {

      if (eev || !ev) {
        console.log("Error:"+eev, ev);
        return res.status(200).json({
          error: 'Something went wrong, please contact support system',
          send: false
        });
      }

      var emailService = new EmailService();
      emailService.sendAccountVerifyEmail(urlOrigin, ev, _user, res);
    });
  });
}

exports.changeEmailAddress = function(req, res, next) {

  User.findOne({
    username: req.body.uname.toLowerCase(),
    email: req.body.uemail.toLowerCase(),
    "$or": [{"isBlocked": false}, {"isBlocked": null}],
    verified: false
  }, function(err, _user) {

    if (err || !_user) {
      return res.status(200).json({
        error: 'Something went wrong, please contact support system',
        update: false
      });
    }

    // Re-Validate either user is valid or not by checking
    // its email verifiction link exists or not
    EmailVeirfy.findOne({userId: _user._id+''}, function(error, evuser) {

      if(error || !evuser) { return res.status(200).json({error: 'Invalid Request.'}) }

      User.findOne({
        email: req.body.nemail
      }, function(err, _emailUser) {

        if (_emailUser) {
          return res.status(200).json({
            error: 'Sorry ! please provide different email address. This email is already register with us',
            update: false,
            message: true
          });
        }

        if (!_emailUser) {
          _user.update({
            email: req.body.nemail
          }, function(err, _u) {

            if (!err) {
              Genealogy.updateMember({
                id: _user._id,
                countryCode: _user.countryCode,
                countryName: _user.countryName,
                email: (req.body.nemail || _user.email),
                name: _user.name
              }, function(data) {
                console.log('Tree is updated');
              });

              res.status(200).json({
                error: '',
                update: true
              });
            } else {

              res.status(200).json({
                error: 'Sorry ! unable to update your email addresss',
                message: true,
                update: false
              });
            }
          });
        }
      });

    });

  });
}

exports.findUser = function(req, res, next) {

  User.findOne({
    $or: [{
      email: req.body.data
    }, {
      username: req.body.data
    }]
  }, '-salt -hashedPassword -avatar -google -facebook -twitter -github -isBlocked -__v -verified', function(err, _user) {

    if (err || !_user) {
      return res.status(200).json({
        error: 'Something went wrong, please contact support system',
        update: false
      });
    }

    return res.status(200).json(_user);
  });
},

exports.proxyUser = function(req, res, next) {
  var userIds = new Buffer(req.query.proxyId, 'base64');
      userIds = userIds.toString().split('-');

  if(userIds.length != 2) {

    return res.status(200).send('Invalid Request');
  }
  else {
    User.findById(userIds[1]+'', function(err, _user) {

      if(_user && (_user.role == 'admin' || _user.role == 'finance' || _user.role == 'watchuser' || _user.role == 'support')) {

        User.findById(userIds[0]+'', function(err, __user) {

          if(__user) {

            AgentLogs.create({
              agentid: _user._id,
              userid: __user._id,
              useremail: __user.email,
              username: __user.username
            }, function(err, _agu) {

              if(_agu) {
                // Proxy User Settings
                _user.update({currentcxview: __user._id}, function(err, up) { console.log('CX: View'); });
                // res.cookie('cipxser', __user._id);
                // res.cookie('cipxser', __user._id, {domain: config.appDomain});
                // req.user = _user;
                // return auth.setTokenCookie(req, res);
                return res.redirect(config.emailDomain+'/dashboard');
              }
              else {
                return res.status(200).send('Unable to validate your request.');
              }
            });
          }
          else {
            return res.status(200).send('Unable to validate your request.');
          }
        })
      }
      else {
        return res.status(200).send('Invalid Request');
      }
    });
  }
};

exports.viewAgentLog = function(req, res, next) {

  var query = {agentid: req.user._id};
  var viewLimit   = config.minPaginationLimit;
  var currentPage = (req.query.page ? req.query.page : 1);
  var skipRows    = (viewLimit * (currentPage - 1));

  AgentLogs.find(query).sort({"_id": -1}).limit(viewLimit).skip(skipRows).exec(function(err, data) {

    if(err) {
      return res.status(500).send(err);
    }

    AgentLogs.count(query, function(err, rows) {

      return res.status(200).json({data: data, limit: viewLimit, rows: rows });
    });
  });
};

exports.changeSponsor = function(req, res, next) {
  var userid       = req.body.userid;
  var useremail    = req.body.userEmail;
  var sponsoremail = req.body.email;

  if((req.user._id+'' != userid && req.user.role != 'admin') || userid == config.sponsorId) {
    return res.status(200).json({error: true, message: 'Invalid Request'});
  }

  if(useremail != sponsoremail) {

    User.find({email: {"$in": [useremail, sponsoremail]}}, function(err, _user) {

      if(err) { return res.status(200).json({error: true, message: 'Unable find user or sponsor info'}); }

      if(_user && _user.length == 2) {
        var _userinfo    = _.find(_user, function(o) { return o.email == useremail });
        var _sponsorinfo = _.find(_user, function(o) { return o.email == sponsoremail });

        if(req.user.role != 'user' && _userinfo && _userinfo.sponsor && _userinfo.sponsor != config.sponsorId) {
          return res.status(200).json({
            error: true,
            message: 'Only change sponsor for those user which are under iCoinCompany.'
          });
        }

        Genealogy.verifyByIds([_userinfo._id+'', _sponsorinfo._id+''], function(gerr, _data) {

          if(gerr) { return res.status(200).json({error: true, message: 'Unable find user or sponsor info.'}); }

          var graphUserInfo    = _.find(_data, function(o) { return o.c.properties.email == useremail });
          var graphSponsorInfo = _.find(_data, function(o) { return o.c.properties.email == sponsoremail });

          // Run if user not exists in Neo4J
          if(!graphUserInfo && graphSponsorInfo) {

            Genealogy.create({
              ref: [_sponsorinfo._id, '', _sponsorinfo.userProfileId, ''],
              user: {
                name: _userinfo.name,
                id: _userinfo._id,
                ip: (_userinfo.ip ? _userinfo.ip : ''),
                email: _userinfo.email,
                countryName: _userinfo.countryName,
                countryCode: _userinfo.countryCode,
                joinAt: _userinfo.createdat
              }
            }, function(gcerr, gcinfo) {

              if(gcerr) { return res.status(200).json({error: true, message: 'Unable to update user sponsor.'}); }

              _userinfo.update({sponsor: _sponsorinfo._id}, function(userr, d) {
                console.log(userr, d, gcerr, gcinfo);

                return res.status(200).json({error: false, message: 'Updated...'});
              });
            });
          }

          // Run if user exists in Neo4J
          if(graphUserInfo && graphSponsorInfo) {

            var oldSponsor = _userinfo.sponsor || config.sponsorId;

            if(req.user.role == 'user' && _userinfo && _userinfo.sponsor && ((_userinfo.sponsor != config.sponsorId) || (_userinfo.sponsor == _sponsorinfo._id))) {
              return res.status(200).json({
                error: true,
                message: 'Only change sponsor for those user which are under iCoinCompany.'
              });
            }

            _userinfo.update({sponsor: _sponsorinfo._id, confirmSponsor: true}, function(userr, d) {
              Genealogy.updateRelationAndSponsor({
                oldSponsorId: oldSponsor,
                userId: _userinfo._id,
                newSponsorId: _sponsorinfo._id,
                sponsorUsername: _sponsorinfo.username,
                sponsorProfileId: _sponsorinfo.userProfileId,
                userNewHpos: parseInt(graphSponsorInfo.c.properties.hpos) + 1,
              }, function(guraserr, guras) {
                if(guraserr) {
                  console.log('[err]', guraserr, _sponsorinfo);
                  return res.status(200).json({error: true, message: 'Unable to change sponsor.'});
                }

                return res.status(200).json({error: false, message: 'Updated...'});
              });
            });
          }

          // Run if user and sponsor both not exists in Neo4J
          if(!graphUserInfo && !graphSponsorInfo) {
            return res.status(200).json({error: true, message: 'Both user and sponsor not found'});
          }
          if(graphUserInfo && !graphSponsorInfo) {
            return res.status(200).json({error: true, message: 'Sponsor info not found'});
          }

        });
      }
      else {
        return res.status(200).json({error: true, message: 'Unexcepted error occour'});
      }
    });
  }
  else {
    return res.status(200).json({error:true, message: 'User and Sponsor could not be same'});
  }
};


exports.verifySponsorEmail = function(req, res, next) {
  User.findOne({
    email: req.body.email + '',
    "$or": [{"isBlocked": false}, {"isBlocked": null}],
    verified: true
  }, function(err, _user) {
    if (err || !_user) { return res.status(200).json({'isValid': false}); }
    return res.status(200).json({isValid:(!!_user),'user':{
        name: _user.name,
        email: _user.email,
        username: _user.username,
        userProfileId: _user.userProfileId,
        useremail: _user.email,
        userid: _user._id,
        mobile : _user.mobile,
        countryName: _user.countryName
      }});
  })
};

/**
 * Authentication callback
 */
exports.authCallback = function(req, res, next) {
  res.redirect('/');
};

exports.clearCXView = function(req, res, next) {
   User.findById(req.user._id + '', function(err, cxuser) {
      if (cxuser) {
         cxuser.update({ currentcxview: null }, function(err, update) {
            console.log('[info] Clear CX VIEW: ', err, update);
            req.session.regenerate(function(error) {
               // var _domain = config.appDomain.split(':');
               // res.clearCookie('token', {domain: _domain[0]});
               return res.status(200).json({ message: 'Updated' });
            });
         });
      } else {
         return res.status(500).json(err);
      }
   });
};

exports.updateExpiryTime = function(req, res, next) {
  var cTime = moment(new Date());
      cTime.add(24, 'hours');
  return User.update({_id: Object(req.user._id)}, {$set: {expiryTime: cTime}}, function(err, _data){
   if (err) { return res.status(200).json({error: true, message: 'Invalid Request'}); };
    return res.status(200).json({message: "Expiry Time Updated", success:1, info:_data});
  });
}

exports.mapReferrals = function(req, res, next) {

  var signupId  = req.body.userInfo,
      reqOrigin = req.headers.origin;

  User.findOne({
    '_id': signupId,
    'name': req.body.userName,
    'email': req.body.userEmail
  }, function(error, user) {

    if(error || !user) {
      return res.status(200).json({error: false, data: 'Unable to notify sponsor'});
    }

    var emailService = new EmailService();
    if(user.email){
      emailService.sendWelcomeEmail(user.email, user.name, reqOrigin);
      emailService.sendMailToSponsor(user, (user.sponsor || config.sponsorId));
    }

    return res.status(200).json({error: false, data: 'Sponsor notified'});
  });

  //auth.placeUserAndCookie(req, res);
}


exports.verifySponsorInfo = function(req, res, next) {
  User.findById(req.user._id+'', 'name email sponsor mobile createdat counteryCode countryName username confirmSponsor', function(err, _user) {
    if(!err) {

      Genealogy.findMemberById({id: req.user._id+''}, function(_err, _guser) {
        if(!_err) {

          if(_user && !_user.sponsor && _guser && _guser.length > 0 && _guser[0].c.properties.sponsor == config.sponsorId) {
            return res.status(200).json({error: false, type: 1, user: _user, guser: _guser[0].c.properties});
          }
          else if(_user && !_user.sponsor && _guser && _guser.length == 0) {
            return res.status(200).json({error: false, type: 2, user: _user, guser: null});
          }
          else if(_user && _user.sponsor && _guser && _guser.length == 0) {
            return res.status(200).json({error: false, type: 3, user: _user, guser: null});
          }
          else if(_user && _user.sponsor && _guser && _guser.length > 0 && _user.sponsor != _guser[0].c.properties.sponsor) {
            return res.status(200).json({error: false, type: 4, user: _user, guser: _guser[0].c.properties});
          }
          else {
            return res.status(200).json({error: false, type: 0, user: _user, guser: _guser[0].c.properties});
          }
        }
        else {
          return res.status(200).json({error: true, message: 'Unable to verify user info'});
        }
      })
    }
    else {
      return res.status(200).json({error: true, message: 'Unable to verify user info'});
    }
  })
}

exports.getSponsorInfo = function(req, res, next) {
  if(req.body.email && req.body.email != '') {
    return User.findOne({email: req.body.email+''}, 'name email username userPofileId', function(err, _user) {
      if(err || !_user) { return res.status(200).json({error: true, message: 'Unable to verify sponsor info'})};
      return res.status(200).json({error: false, user: {
        name: _user.name,
        email: _user.email,
        username: _user.username,
        userProfileId: _user.userProfileId,
        useremail: req.user.email,
        userid: req.user._id
      }});
    });
  }
  else if(req.body.username && req.body.username != '') {
    return User.findOne({username: req.body.username+''}, 'name email username userPofileId', function(err, _user) {
      if(err || !_user) { return res.status(200).json({error: true, message: 'Unable to verify sponsor info'})};
      return res.status(200).json({error: false, user: {
        name: _user.name,
        email: _user.email,
        username: _user.username,
        userProfileId: _user.userProfileId,
        useremail: req.user.email,
        userid: req.user._id
      }});
    });
  }
  else {
    return res.status(200).json({error: true, message: 'Unable to verify sponsor info'});
  }
}

// Confirmed the Sponsor
exports.confirmSponsorInfo = function(req, res, next){
  return User.update({_id: Object(req.user._id)}, {$set: {confirmSponsor: true}}, function(err, _data){
    if (err) { return res.status(200).json({error: true, message: 'Invalid Request'}); };
    return res.json({message: "Verified Sponsor Succesfully", success:1});
  })
}

exports.updateExpiryTime = function(req, res, next) {
  var cTime = moment(new Date());
      cTime.add(24, 'hours');
  return User.update({_id: Object(req.user._id)}, {$set: {expiryTime: cTime}}, function(err, _data){
   if (err) { return res.status(200).json({error: true, message: 'Invalid Request'}); };
    return res.json({message: "Expiry Time Updated", success:1, info:_data});
  });
}

// Get All User Activity
exports.getUserActivity = function(req, res) {
  var limit = 25;
  var userInfo = [];
  var paymentInfo = [];
  var withdrawalInfo = [];
  var creditsInfo = [];
  User.find({}).limit(limit).sort({userProfileId: -1}).exec(function(err, _userInfo) {
    if(err) {
      return res.status(200).json({error:true, message: 'Invalid Request'});
    }else{
      userInfo.push(_userInfo);
    }
  });
  Payment.find({}).limit(limit).sort({orderId: -1}).exec(function(err, _paymentInfo) {
    if(err) {
      return res.status(200).json({error:true, message: 'Invalid Request'});
    }else{
      paymentInfo =  _paymentInfo;
    }
  });
  Withdrawal.find({}).limit(limit).sort({createdat: -1}).exec(function(err, _withdrawalInfo) {
    if(err) {
      return res.status(200).json({error:true, message: 'Invalid Request'});
    }else{
      withdrawalInfo =  _withdrawalInfo;
    }
  });
  CreditLogs.find({}).limit(limit).sort({createdat: -1}).exec(function(err, _creditsInfo) {
    if(err) {
      return res.status(200).json({error:true, message: 'Invalid Request'});
    }else{
      creditsInfo =  _creditsInfo;
    }
  });

  var userActivitiy = [];
  userActivitiy = _.union(creditsInfo, withdrawalInfo);
  if(userActivitiy){
    return res.status(200).json({error:false, activityInfo: userInfo});
  }
}

exports.getUserBasicInfo = function(req, res, next) {

  return User.findById(req.user._id, function(e, u) {
    if(e || !u) {return validationError(res, err);}
    return res.status(200).json({
      id: u._id,
      name: u.name,
      email: u.email,
      username: u.username,
      mobile: u.mobile,
      address : u.address,
      provider : u.provider,
      countryName : u.countryName
    });
  })
}

exports.getUserById = function(req, res){
  return User.findById(req.query._id, function(err, user){
    if(err || !user) {return validationError(res, err); }

    return res.status(200).json({
      id : user._id,
      name: user.name,
      email: user.email,
      username: user.username,
      mobile: user.mobile,
      address : user.address
    })
  })
}

exports.getExpiryTime = function(req, res, next) {

  return User.findById(req.user._id, function(e, u) {
    if(e || !u) {return res.status(200).json({expiryTime: (new Date()), currentTime: (new Date())}); }

    return res.status(200).json({
      expiryTime: u.expiryTime,
      currentTime: (new Date())
    });
  });
}

exports.listCompOffUsers = function(req, res) {
  var conditions = {},
      viewLimit = 25,
      currentPage = (req.query.page ? req.query.page : 1),
      skipRows = (currentPage - 1) * viewLimit;

  conditions = {isDeleted: false};

  if(req.query.dataFilter && req.query.dataFilter != '') {
    conditions['$or'] = [
      {username: req.query.dataFilter},
      {email: req.query.dataFilter},
      {name: {'$regex': req.query.dataFilter.toLowerCase(), '$options': 'i'}}
    ];
  }

  CompOffUsers.find(conditions).limit(viewLimit).skip(skipRows).sort({
    _id: -1
  }).exec(function(err, compOffUsers) {
    if (err) {
      return res.status(500).send(err);
    } else {
      var result = {}
      if (compOffUsers.length) {
        result.documents = compOffUsers;

        CompOffUsers.count({}, function(err, count) {
          var totalPages = count;
          result.totalPages = totalPages;
          // if (limit) result.totalPages = Math.ceil(totalPages / limit);
          // else result.totalPages = 1;

          // if (result.totalPages > 1) {
          //   result.prevAnchorId = (anchorId || 0);
          //   result.nextAnchorId = users[users.length - 1].userProfileId;
          // }
          res.status(200).json(result);
        })
      } else {
        result.documents = [];
        result.totalPages = 0;
        res.status(200).json(result);
      }
    }
  })
}

exports.addUserToCompOff = function (req, res) {
  var userid = req.body.userid,
    level = req.body.level;
  if (userid) {
    User.findOne({ _id: userid }, 'name username role email verified isBlocked sponsor mobile countryName countryCode', function (err, user) {
      if (err) {
        return res.status(200).json({ error: true, message: 'User details not found' });
      }
      CompOffUsers.findOne({ userid: user._id, isDeleted :false}, function (__e, compOffUser) {
        if (__e) { return res.status(200).json({ error: true, message: 'Error in adding user to compoff list' }); }
        if (compOffUser && undefined != compOffUser && null != compOffUser) {
          return res.status(200).json({ error: true, message: 'This user already exists in comp off list' });
        } else {
          CompOffUsers.create({
            userid: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            username: user.username,
            mobile: user.mobile,
            countryCode: user.countryCode,
            countryName: user.countryName,
            isEnabled: false,
            sponsor: user.sponsor,
            level: level
          }, function (_err, compOffUser) {
            if (_err) {
              return res.status(200).json({ error: true, message: JSON.stringify(_err) });
            }
            return res.status(200).json({ error: false, message: 'User added to compoff list', data: compOffUser });
          })
        }
      })
    })
  } else {
    return res.status(200).json({ error: true, message: 'Please provide appropriate input' });
  }
}

exports.updateCompoffStatus = function(req, res) {
  var userid = req.body.userid;
  var query = {};
  if(req.body.isEnabled)
    query = {isEnabled:req.body.isEnabled};
   else if(req.body.level)
    query = {level : req.body.level};
  else  if (req.body.isDeleted)
    query = {isDeleted: req.body.isDeleted};

  if(userid) {
    CompOffUsers.findOne({userid: userid}, function(err, compOffUser) {
      if(err) {
        return res.status(200).json({error: true, message : 'User details not found'});
      }
      compOffUser.update(query, function(_e, updatedUser) {
        if(_e) {
          return res.status(200).json({error: true, message : JSON.stringify(_e)});
        }
        return res.status(200).json({error: false, message: 'Updated successfully'});
      })
    })
  } else {
    return res.status(200).json({error: true, message : 'Provide appropriate inputs'});
  }
}



exports.getTopCommissionUsers = function(req, res) {
  var conditions = {},
      viewLimit = 25;

  conditions['$group'] = [
    {_id: "$userid"},
    {total: {$sum: '$coins'}}
  ];

  //CommissionLogs.aggregate(conditions).limit(viewLimit).sort({total : -1 })
    CreditLogs.aggregate([{$match : {subtype: "C", type: "usd"}}, {$group: {_id: "$userid", total: {$sum: "$coins"}}}, { $sort : {total : -1 } }, {$limit : viewLimit}]).exec(function(err, data) {
  // CommissionLogs.aggregate([{$group: {_id: "$userid", total: {$sum: "$coins"}}}, { $sort : {total : -1 } }, {$limit : viewLimit}]).exec(function(err, data) {
    if (err) {
      return res.status(500).json({error: true, message : 'Unable to get data from db'});
    } else {
      User.populate(data, {path: '_id', select: 'username email name'}, function(uerr, udata){
        if (err) {
          return res.status(500).json({error: true, message : 'Unable to populate aggregated data'});
        } else {
          return res.status(200).json({error: false, data : udata});
        }
      });
    }
  });
}


exports.getPremiumUsers = function(req, res) {
  var conditions = {},
      viewLimit = 25,
      currentPage = (req.query.page ? req.query.page : 1),
      skipRows = (currentPage - 1) * viewLimit,
      result = {};

  if(req.query.dataFilter && req.query.dataFilter != '') {
    conditions['$or'] = [
      {username: req.query.dataFilter},
      {email: req.query.dataFilter},
      {name: {'$regex': req.query.dataFilter.toLowerCase(), '$options': 'i'}}
    ];
  }

  PremiumUser.find(conditions).limit(viewLimit).skip(skipRows).sort({
    _id: -1
  }).exec(function(err, premiumUsers) {
    if (err) {
      return res.status(200).json({error: true, message: err});
    } else {
      if (premiumUsers.length) {
        result.documents = premiumUsers;

        PremiumUser.count(conditions, function(err, count) {
          result.totalPages = count;
          return res.status(200).json({error : false, message: count+' records fetched', data: result});
        })
      } else {
        result.documents = [];
        result.totalPages = 0;
        return res.status(200).json({error: true, message: 'No records found', data: []});
      }
    }
  })
}

exports.addUserToPremium = function(req, res) {
  let userid = req.body.userid;
  if(!userid) {
    return res.status(200).json({error: true, message : 'Please provide appropriate inputs'});
  } else {
    User.findOne({_id: userid.toString()}, {email : 1, username : 1, name : 1}, function(err, user) {
      if(err || !user){
        console.log("[Err] Error in getting user information", err);
      } else {
        PremiumUser.findOne({userid: userid.toString()}, function(_e, data) {
          if(_e) {
            return res.status(200).json({error: true, message: _e});
          } else if(data){
            return res.status(200).json({error: true, message: "This user already exists in this list"});
          } else if(!data && !_e) {
            PremiumUser.create({
              userid : userid.toString(),
              email : user.email,
              name : user.name,
              username : user.username,
              createdat : new Date(),
              isActive : true
            }, function(e, data) {
              if(e) {
                return res.status(200).json({error: true, message: e});
              } else {
                return res.status(200).json({error: false, message : 'User added to premium users list'});
              }
            })
          }
        })
      }
    })
  }
}

exports.updatePremiumUserStatus = function(req, res) {
  var userid = req.body.userid,
      isActive = req.body.isActive;
  if(userid) {
    PremiumUser.findOne({userid: userid}, function(err, premiumUser) {
      if(err) {
        return res.status(200).json({error: true, message : 'User details not found'});
      }
      premiumUser.update({isActive: isActive}, function(_e, updatedUser) {
        if(_e) {
          return res.status(200).json({error: true, message : JSON.stringify(_e)});
        }
        return res.status(200).json({error: false, message: 'Updated successfully'});
      })
    })
  } else {
    return res.status(200).json({error: true, message : 'Provide appropriate inputs'});
  }
}

exports.getBusinessUserRoles = function(req, res) {
  if(req.user.role != 'admin') {
    return res.status(200).json({error: true, message: 'Not Authorized', data: null});
  } else {
    var userService = new UserService();
    userService.getBusinessUserRoles(function(err, response) {
      if(err) {
        return res.status(200).json({error: true, message: 'User roles not set in configuration', data: null});
      }
      return res.status(200).json({error: false, message: 'User roles fetched', data: response});
    })
  }
}

exports.addBusinessUser = function(req, res) {
  let email = req.body.email,
      uploadDoc = req.body.uploadDoc,
      fname = req.body.firstName,
      lname = req.body.lastName,
      country = req.body.country,
      countryCode = req.body.countryCode,
      mobile = req.body.fullmobile,
      commission = parseFloat(req.body.commission),
      userType = req.body.userType,
      password = fname+'@123',
      // hashedPassword = 'hEJGJYfCQ0hWY8dwy2dcb15okOdsW+MwBwe5aHeUDnge8X7AMdgq5QpflqId+Pmyt92lHzWlitSxx64fuknwMw==',
      // salt = 'e3Imti0UY3EF9Ng4Y87rHQ==',
      docPath = '',
      access = req.body.access || 'public-read',
      urlOrigin = req.headers.origin || config.email.defaultOriginUrl;

  if(!commission || isNaN(commission) || commission <= 0) {
    return res.status(200).json({error : true, message : 'Please specify commission %'});
  }

  if(!uploadDoc) {
    return res.status(200).json({error : true, message : 'Scanned copy of form is required'});
  }

  if(email.trim()) {
    User.findOne({email : req.body.email}, function(err, user) {
      if(err) {
        return res.status(200).json({error : true, message : 'Unexpected error occurred..try again'});
      }
      else if(user && config.businessRoles.indexOf(user.role) == -1) {
        return res.status(200).json({error : true, message : 'This user is registered with iCoin and cannot be registered as '+req.body.userType});
      }
      else if(user && config.businessRoles.indexOf(user.role) != -1) {
        return res.status(200).json({error : true, message : 'This user is already registered as '+user.role.toUpperCase()});
      }
      else if(!user) {
        var matches    = uploadDoc.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        var response   = {};
        if (matches.length !== 3)
        {
          var _err = new Error('Invalid input string');
          return res.status(200).json({error: true, message: _err});
        }
        response.type = matches[1];
        response.data = new Buffer(matches[2], 'base64');
        response.ext  = matches[1].split('/');

        var _file    = uuid.v1() + '.' + response.ext[1];
        var filename = userType + '/' + _file;
        var s3 = new AWS.S3({params: {Bucket: config.aws.bucket}});
        s3.upload({
          Key: filename,
          Body: response.data,
          ContentType : response.type,
          ACL: access
        }, function(err, data){
          if(err){
            res.status(200).json({ error: true, message : err })
          }
          if(data) {
            console.log("sponserid:" + config.sponsorId);
            console.log(data);
            docPath = data.Location;
            let userInfo = {
              name : fname + " " + lname,
              email : email,
              countryName : country,
              countryCode : countryCode,
              // hashedPassword : hashedPassword,
              // salt : salt,
              password : password,
              isBlocked : false,
              verified : false,
              role : userType,
              provider : 'local',
              mobile : mobile,
              personaldoc : docPath,
              commission : commission,
              confirmSponsor : true,
              sponsor: config.sponsorId
            };

            userInfo = new User(userInfo);
            console.log(userInfo);
            userInfo.save(function(err, userObj) {
              if(err) {
                return res.status(200).json({error: true, message: err});
              }
              if(userObj) {
                Credits.create({userid : userObj._id, adscash: 0, usd: 0, adcpacks : 0}, function(err, ucredit){
                  console.log('Added business user credits:', err, ucredit);
                });

                User.findById(config.sponsorId, function(sperr, csponsor){
                  Genealogy.create({
                    user: userObj,
                    ref: [
                      config.sponsorId+'',
                      csponsor.username,
                      csponsor.userProfileId,
                      '',
                      config.sponsorId
                    ]
                  }, function(gerror, ginfo) {
                    if(gerror || !ginfo) {
                      userObj.remove(function(e) { console.log('unable to create genealogy'); });
                      return res.status(200).json({error : true, message: "Unable to add user in geonology tree"});
                    }
                    else{
                      var _pwdLink = urlOrigin + "/set-password/" + userObj._id;
                      var emailService = new EmailService();
                      emailService.sendPasswordMailToPortfolioManagers({
                        mailTo : email,
                        name : fname + " " + lname,
                        role : capitalizeWord(userType),
                        link : _pwdLink
                      });
                      return res.status(200).json({error : false, message: "User has been successfully added"});
                    }
                  });
                });
              }
            })
          }
        });
      }
    })
  } else {
    return res.status(200).json({error : true, message : 'Please provide appropriate information'});
  }
}

exports.getBusinessUsers = function(req, res) {
  var conditions = {role : {'$in' : config.businessRoles}}, limit = parseInt(req.query.limit || 25), anchorId = req.query.anchorId;
  var result = {};

  if(req.query.anchorId && req.query.anchorId > 0) {
    conditions.userProfileId = {$lt: anchorId};
  }

  if(req.query.dataFilter && req.query.dataFilter != '') {
    conditions['$or'] = [
      {email: req.query.dataFilter},
      {name: {'$regex': req.query.dataFilter.toLowerCase(), '$options': 'i'}}
    ];
  }
  console.log(conditions);

  User.find(conditions, '-salt -hashedPassword').limit(limit).sort({
    userProfileId: -1
  }).exec(function(err, users) {
    if (err) {
      return res.status(200).json({error: true, message : err});
    } else {
      if (users.length) {
        result.documents = users;
        User.count(conditions, function(err, count) {
          var totalPages = count;

          if (limit) result.totalPages = Math.ceil(totalPages / limit);
          else result.totalPages = 1;

          if (result.totalPages > 1) {
            result.prevAnchorId = (anchorId || 0);
            result.nextAnchorId = users[users.length - 1].userProfileId;
          }
          res.status(200).json(result);
        })
      } else {
        result.documents = [];
        result.totalPages = 0;
        res.status(200).json(result);
      }
    }
  })
}

exports.setBussinessUserPassword = function(req, res) {
  if(req.body.password) {
    var password = req.body.password,
        userid = req.body.userid;

    User.findOne({_id: userid.toString(), role : {'$in': config.businessRoles}, isBlocked: false}, '-mobile -email', function(_e, user) {
      if(_e) { return res.status(200).json({error : true, message: _e }); }
      else if(!user) {
        return res.status(200).json({error : true, message: 'User record not found' });
      }
      else if(user && user.isBlocked) {
        return res.status(200).json({error : true, message: 'You have been blocked by the system. Contact iCoin support'});
      }
      else if(user && user.verified) {
        return res.status(200).json({error : true, message: 'You have already set your password'});
      }
      else if(user && !user.verified && !user.isBlocked) {
        user.password = password;
        user.verified = true;
        user.save(function(err) {
          if (err) return validationError(res, err);
          res.status(200).json({error: false, message : 'Password has been successfully set'});
        });
      }
    })

  } else {
    return res.status(200).json({error: true, message: 'Please provide appropriate inputs'});
  }
}

exports.addPortfolioManager = function(req, res) {
  let email = req.body.email,
      uploadDoc = req.body.uploadDoc,
      fname = req.body.firstName,
      lname = req.body.lastName,
      totalInvestment = parseFloat(req.body.totalInvestment),
      totalReturn = parseFloat(req.body.totalReturn),
      maxEarningSource = req.body.maxEarningSource,
      totalCommission = parseFloat(req.body.totalCommission),
      userType = req.body.role, ///config.porfolioManagerRoles[0],
      password = fname + '@123',
      // hashedPassword = 'hEJGJYfCQ0hWY8dwy2dcb15okOdsW+MwBwe5aHeUDnge8X7AMdgq5QpflqId+Pmyt92lHzWlitSxx64fuknwMw==',
      // salt = 'e3Imti0UY3EF9Ng4Y87rHQ==',
      docPath = '',
      access = req.body.access || 'public-read',
      urlOrigin = req.headers.origin || config.email.defaultOriginUrl,
      supportAdminManager = req.body.supportAdminManager;

    if(req.body.role==config.porfolioManagerRoles[0])
      {
          if(!totalInvestment || isNaN(totalInvestment) || totalInvestment <= 0) {
            return res.status(200).json({error : true, message : 'Please specify total investment'});
          }

          if(!totalReturn || isNaN(totalReturn) || totalReturn <= 0) {
            return res.status(200).json({error : true, message : 'Please specify total return'});
          }

          if(!maxEarningSource || maxEarningSource == null || maxEarningSource == '') {
            return res.status(200).json({error : true, message : 'Please specify maximum earning source'});
          }

          if(!totalCommission || isNaN(totalCommission) || totalCommission <= 0) {
            return res.status(200).json({error : true, message : 'Please specify total commission'});
          }

          if(!uploadDoc) {
            return res.status(200).json({error : true, message : 'Scanned copy of document is required'});
          }
      }

  if(email.trim()) {
    User.findOne({email : req.body.email}, function(err, user) {
      if(err) {
        return res.status(200).json({error : true, message : 'Unexpected error occurred..try again'});
      }
      else if(user && config.porfolioManagerRoles.indexOf(user.role) == -1) {
        return res.status(200).json({error : true, message : 'This user is registered with iCoin and cannot be registered as '+ userType});
      }
      else if(user && config.porfolioManagerRoles.indexOf(user.role) != -1) {
        return res.status(200).json({error : true, message : 'This user is already registered as '+ user.role.toUpperCase()});
      }
      else if(!user && req.body.role==config.porfolioManagerRoles[0]) {
        var matches    = uploadDoc.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        var response   = {};
        if (matches.length !== 3)
        {
          var _err = new Error('Invalid input string');
          return res.status(200).json({error: true, message: _err});
        }
        response.type = matches[1];
        response.data = new Buffer(matches[2], 'base64');
        response.ext  = matches[1].split('/');

        var _file    = uuid.v1() + '.' + response.ext[1];
        var filename = userType + '/' + _file;
        var s3 = new AWS.S3({params: {Bucket: config.aws.bucket}});
        s3.upload({
          Key: filename,
          Body: response.data,
          ContentType : response.type,
          ACL: access
        }, function(err, data){
          if(err){
            res.status(200).json({ error: true, message : err })
          }
          if(data) {
            console.log("sponserid:" + config.sponsorId);
            console.log(data);
            docPath = data.Location;
            let userInfo = {
              name : fname + " " + lname,
              email : email,
              password : password,
              isBlocked : false,
              verified : false,
              role : userType,
              provider : 'local',
              personaldoc : docPath,
              totalInvestment: totalInvestment,
              totalReturn: totalReturn,
              maximumEarningSource: maxEarningSource,
              totalCommission: totalCommission,
              confirmSponsor : true,
              sponsor: config.sponsorId
            };
            userInfo = new User(userInfo);
            console.log(userInfo);
            userInfo.save(function(err, userObj) {
              if(err) {
                return res.status(200).json({error: true, message: err});
              }
              if(userObj) {
                Credits.create({userid : userObj._id, adscash: 0, usd: 0, adcpacks : 0}, function(err, ucredit){
                  console.log('Added portfolio manager credits:', err, ucredit);
                });

                User.findById(config.sponsorId, function(sperr, csponsor){
                  Genealogy.create({
                    user: userObj,
                    ref: [
                      config.sponsorId+'',
                      csponsor.username,
                      csponsor.userProfileId,
                      '',
                      config.sponsorId
                    ]
                  }, function(gerror, ginfo) {
                    if(gerror || !ginfo) {
                      userObj.remove(function(e) { console.log('unable to create genealogy'); });
                      return res.status(200).json({error : true, message: "Unable to add user in geonology tree"});
                    }
                    else{
                      var _pwdLink = urlOrigin + "/set-portfolio-manager-password/" + userObj._id;
                      var emailService = new EmailService();
                      emailService.sendPasswordMailToBusinessUsers({
                        mailTo : email,
                        name : fname + " " + lname,
                        role : capitalizeWord(userType),
                        link : _pwdLink
                      });
                      return res.status(200).json({error : false, message: "User has been successfully added"});
                    }
                  });
                });
              }
            })
          }
        });
      }
      else if(!user && req.body.role==config.porfolioManagerRoles[1]) {
            let userInfo = {
              name : fname + " " + lname,
              email : email,
              password : password,
              isBlocked : false,
              verified : false,
              role : userType,
              provider : 'local',
              confirmSponsor : true,
              sponsor: config.sponsorId,
              isSupportAdminManager: supportAdminManager
            };
            userInfo = new User(userInfo);
            console.log(userInfo);
            userInfo.save(function(err, userObj) {
              if(err) {
                return res.status(200).json({error: true, message: err});
              }
              if(userObj) {
                Credits.create({userid : userObj._id, adscash: 0, usd: 0, adcpacks : 0}, function(err, ucredit){
                  console.log('Added Chat Support credits:', err, ucredit);
                });

                User.findById(config.sponsorId, function(sperr, csponsor){
                  Genealogy.create({
                    user: userObj,
                    ref: [
                      config.sponsorId+'',
                      csponsor.username,
                      csponsor.userProfileId,
                      '',
                      config.sponsorId
                    ]
                  }, function(gerror, ginfo) {
                    if(gerror || !ginfo) {
                      userObj.remove(function(e) { console.log('unable to create genealogy'); });
                      return res.status(200).json({error : true, message: "Unable to add user in geonology tree"});
                    }
                    else{
                      var _pwdLink = urlOrigin + "/set-portfolio-manager-password/" + userObj._id;
                      var emailService = new EmailService();
                      emailService.sendPasswordMailToBusinessUsers({
                        mailTo : email,
                        name : fname + " " + lname,
                        role : capitalizeWord(userType),
                        link : _pwdLink
                      });
                      return res.status(200).json({error : false, message: "User has been successfully added"});
                    }
                  });
                });
              }
            })
          }
      else if(!user && req.body.role==config.porfolioManagerRoles[2]) {
            let userInfo = {
              name : fname + " " + lname,
              email : email,
              password : password,
              isBlocked : false,
              verified : false,
              role : userType,
              provider : 'local',
              confirmSponsor : true,
              sponsor: config.sponsorId
            };
            userInfo = new User(userInfo);
            console.log(userInfo);
            userInfo.save(function(err, userObj) {
              if(err) {
                return res.status(200).json({error: true, message: err});
              }
              if(userObj) {
                Credits.create({userid : userObj._id, adscash: 0, usd: 0, adcpacks : 0}, function(err, ucredit){
                  console.log('Added Chat Support credits:', err, ucredit);
                });

                User.findById(config.sponsorId, function(sperr, csponsor){
                  Genealogy.create({
                    user: userObj,
                    ref: [
                      config.sponsorId+'',
                      csponsor.username,
                      csponsor.userProfileId,
                      '',
                      config.sponsorId
                    ]
                  }, function(gerror, ginfo) {
                    if(gerror || !ginfo) {
                      userObj.remove(function(e) { console.log('unable to create genealogy'); });
                      return res.status(200).json({error : true, message: "Unable to add user in geonology tree"});
                    }
                    else{
                      var _pwdLink = urlOrigin + "/set-portfolio-manager-password/" + userObj._id;
                      var emailService = new EmailService();
                      emailService.sendPasswordMailToBusinessUsers({
                        mailTo : email,
                        name : fname + " " + lname,
                        role : capitalizeWord(userType),
                        link : _pwdLink
                      });
                      return res.status(200).json({error : false, message: "User has been successfully added"});
                    }
                  });
                });
              }
            })
          }

     else {
      return res.status(200).json({error : true, message : 'Please provide appropriate information'});
      }
    });
  }
}

exports.getPortfolioManagerRoles = function(req, res) {
  if(req.user.role != 'admin') {
    return res.status(200).json({error: true, message: 'Not Authorized', data: null});
  } else {
    var userService = new UserService();
    userService.getPortfolioManagerRoles(function(err, response) {
      if(err) {
        return res.status(200).json({error: true, message: 'User roles not set in configuration', data: null});
      }
      return res.status(200).json({error: false, message: 'User roles fetched', data: response});
    })
  }
}

exports.getPortfolioManagers = function(req, res) {
  var conditions = {role : {'$in' : req.query.role}}, limit = parseInt(req.query.limit || 25), anchorId = req.query.anchorId;
  var result = {};

  if(req.query.anchorId && req.query.anchorId > 0) {
    conditions.userProfileId = {$lt: anchorId};
  }

  if(req.query.dataFilter && req.query.dataFilter != '') {
    conditions['$or'] = [
      {email: req.query.dataFilter},
      {name: {'$regex': req.query.dataFilter.toLowerCase(), '$options': 'i'}}
    ];
  }
  console.log(conditions);

  User.find(conditions, '-salt -hashedPassword').limit(limit).sort({
    userProfileId: -1
  }).exec(function(err, users) {
    if (err) {
      return res.status(200).json({error: true, message : err});
    } else {
      if (users.length) {
        result.documents = users;
        User.count(conditions, function(err, count) {
          var totalPages = count;

          if (limit) result.totalPages = Math.ceil(totalPages / limit);
          else result.totalPages = 1;

          if (result.totalPages > 1) {
            result.prevAnchorId = (anchorId || 0);
            result.nextAnchorId = users[users.length - 1].userProfileId;
          }
          res.status(200).json(result);
        })
      } else {
        result.documents = [];
        result.totalPages = 0;
        res.status(200).json(result);
      }
    }
  })
}

exports.setPortfolioManagerPassword = function(req, res) {
  if(req.body.password) {
    var password = req.body.password,
        userid = req.body.userid;

    User.findOne({_id: userid.toString(), role : {'$in': config.porfolioManagerRoles}, isBlocked: false}, '-mobile -email', function(_e, user) {
      if(_e) { return res.status(200).json({error : true, message: _e }); }
      else if(!user) {
        return res.status(200).json({error : true, message: 'User record not found' });
      }
      else if(user && user.isBlocked) {
        return res.status(200).json({error : true, message: 'You have been blocked by the system. Contact iCoin support'});
      }
      else if(user && user.verified) {
        return res.status(200).json({error : true, message: 'You have already set your password'});
      }
      else if(user && !user.verified && !user.isBlocked) {
        user.password = password;
        user.verified = true;
        user.save(function(err) {
          if (err) return validationError(res, err);
          res.status(200).json({error: false, message : 'Password has been successfully set'});
        });
      }
    })

  } else {
    return res.status(200).json({error: true, message: 'Please provide appropriate inputs'});
  }
}

function capitalizeWord(input) {
  return input.charAt(0).toUpperCase() + input.slice(1).toLowerCase();
}
