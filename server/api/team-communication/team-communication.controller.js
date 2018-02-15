'use strict';

var _ = require('lodash');
var async = require('async');
let co = require('co');
//let request = require('co-request');

var config = require('./../../config/environment');
var TeamCommunication = require('./team-communication.model');
var User = require('./../user/user.model');
var Messages = require('./message.model');

// Get list of team-communications
exports.index = function(req, res) {
  var _query = {}, _subject = null, _userQuery = {},
      _limit = parseInt(config.minPaginationLimit);
      _limit = ((!isNaN(_limit) && _limit > 0) ? _limit : config.minPaginationLimit);
  var qsubject = _query.subject;

  if(qsubject && typeof qsubject != 'undefined' && qsubject != '' && qsubject != null && req.query.type != 'spam') {
    _subject = new RegExp(qsubject, 'i');
    _query.subject = _subject;
  }

  switch (req.query.type) {
    case 'inbox':
      _query.isspam = false;
      _query.receiverid = req.user._id;
      _query.active = true;
      break;
    case 'spam':
      _query.isspam = true;
      _query.receiverid = req.user._id;
      _query.active = true;
      break;
    case 'sent':
      _query.senderid = req.user._id;
      _query.active = true;
      break;
  }

  if(req.query.isView) {
    _query.isview = req.query.isView;
  }

  _userQuery = {"_id": {"$in": []}}
  if(req.query.search) {
    if(req.query.type != 'sent') {
      _query["$or"] = [
        {"senderinfo.name": {"$regex": req.query.search, "$options": "i"}},
        {"subject": {"$regex": req.query.search, "$options": "i"}}
      ];
    }
    _userQuery["$or"] = [
      {"name": {"$regex": req.query.search, "$options": "i"}},
      {"username": {"$regex": req.query.search, "$options": "i"}}
    ];
  }

  TeamCommunication.find(_query).sort({id: -1, createdat: -1})
  .skip((req.query.skip > 0 ? ((req.query.skip - 1) * _limit) : 0))
  .limit(_limit).exec(function (err, teamCommunications) {
    if(err) { return handleError(res, err); }

    teamCommunications = (teamCommunications ? teamCommunications : []);
    var users = [], messages  = [];
    var _defaultSentReceiver  = {"name": '', "email": '', "username": ''};
    var _defaultOtherReceiver = {"name": req.user.name, "email": req.user.email, "username": req.user.username};

    if(req.query.type == 'sent') {
      teamCommunications.forEach(function(d) {
        users.push(d.receiverid+'');
      });

      _userQuery["_id"]["$in"] = users;
      User.find(_userQuery, 'name email username' ,function(_err, _usr) {
        teamCommunications.forEach(function(d) {
          var _user = _.find(_usr, function(o) { return o._id == d.receiverid });
          if(_user) {
            messages.push({
              senderInfo: d.senderinfo,
              receiver: (_user ? _user : _defaultSentReceiver),
              messageId: d._id,
              subject: d.subject,
              isViewed: d.isview,
              isSpam: d.isspam,
              impMessage: d.impmessage,
              receiverId: d.receiverid,
              msgDate: d.createdat
            });
          }
        });
        TeamCommunication.count(_query, function(err, data) {
          return res.status(200).json({messages: messages, total: data, limit: _limit});
        });
      });
    }
    else {

      teamCommunications.forEach(function(d) {
        messages.push({
          senderInfo: d.senderinfo,
          receiver: _defaultOtherReceiver,
          messageId: d._id,
          subject: d.subject,
          isViewed: d.isview,
          isSpam: d.isspam,
          impMessage: d.impmessage,
          receiverId: d.receiverid,
          msgDate: d.createdat
        });
      });

      TeamCommunication.count(_query, function(err, data) {
        return res.status(200).json({messages: messages, total: data, limit: _limit});
      });
    }
  });
};

// Get a single team-communication
exports.show = function(req, res) {
  TeamCommunication.findById(req.params.id+'', function (err, teamCommunication) {
    if(err) { return handleError(res, err); }
    if(!teamCommunication) { return res.status(404).send('Not Found'); }

    Messages.findById(teamCommunication.messageid+'', function(_err, message) {
      var _response = {
        senderInfo: teamCommunication.senderinfo,
        senderId: teamCommunication.senderid,
        messageId: teamCommunication._id,
        subject: teamCommunication.subject,
        isViewed: teamCommunication.isview,
        isSpam: teamCommunication.isspam,
        impMessage: teamCommunication.impmessage,
        receiverId: teamCommunication.receiverid,
        msgDate: teamCommunication.createdat,
        msgContent: teamCommunication.subject
      };

      if(!_err && message) {
        _response['msgContent'] = ((!message.description || message.description == '') ? teamCommunication.subject : message.description);
      }

      User.findById(teamCommunication.receiverid, '-_id name username email', function(_e, _u) {
        if(!_e && _u) {
          _response['receiverInfo'] = _u;
        }

        return res.json(_response);
      });
    });
  });
};

// Creates a new team-communication in the DB.
exports.create = function(req, res) {
  var messageInfo = {
    description: req.body.message,
    subject: req.body.msgsubject
  };

  var currentTime = new Date(),
      minTime     = new Date();
      minTime.setDate(minTime.getDate() - 1);

  TeamCommunication.count({
    senderid: req.user._id+'',
    createdat: {$gte: minTime, "$lt": currentTime},
    replyof: null,
  }, function(e, _d) {

    if(_d && _d > 0 && !req.body.replyId) {
      return res.status(200).json({error: true, status: 'Only one message can be sent in 24 hours'});
    }

    Messages.create(messageInfo, function(err, message) {
      if(err) { return handleError(res, err); }

      var receivers = req.body.sendto || [];
      var msgCollection = [];

      receivers.forEach(function(receiver) {

        msgCollection.push({
          senderid: req.user._id,
          receiverid: receiver,
          messageid: message._id,
          isview: false,
          impmessage: false,
          active: true,
          isspam: false,
          subject: messageInfo.subject,
          senderinfo: {
            name: req.user.name,
            email: req.user.email
          },
          replyof: req.body.replyId
        });
      });

      if(msgCollection.length > 0) {
        TeamCommunication.create(msgCollection, function(err, teamCommunication) {
          if(err) { return handleError(res, err); }
        });
      }

      return res.status(201).json({token: message._id, status: 'Message send successfully'});
    });
  });
};

// Creates a new team-communication in the DB for all sub users.
exports.createForAll = function(req, res) {
	  co(function*() {
      var messageInfo = {
        description: req.body.message,
        subject: req.body.msgsubject
      };

      var currentTime = new Date(),
      minTime     = new Date();
      minTime.setDate(minTime.getDate() - 1);
      var sponsorId = req.user._id + '';

    if (sponsorId) {
        TeamCommunication.count({
            senderid: sponsorId,
            createdat: { $gte: minTime, "$lt": currentTime },
            replyof: null,
          }, function (e, _d) {
            if (_d && _d > 0 && !req.body.replyId) {
                return res.status(200).json({ error: true, status: 'Only one message can be sent in 24 hours' });
            }
                //var allMembers = yield User.find({role: 'user', sponsor: sponsorId});
                //if (allMembers) { }
                User.find({ role: 'user', sponsor: sponsorId }, function (error, allMembers) {

                    if(allMembers && allMembers.length > 0){
                        //Add team message
                        Messages.create(messageInfo, function (err, message) {
                            if (err) { return handleError(res, err); }
                        
                        //Add team communications
                            var msgCollection = [];
                            allMembers.forEach(function (receiver) {
                                msgCollection.push({
                                    senderid: sponsorId,
                                    receiverid: receiver.id,
                                    messageid: message._id,
                                    isview: false,
                                    impmessage: false,
                                    active: true,
                                    isspam: false,
                                    subject: messageInfo.subject,
                                    senderinfo: {
                                        name: req.user.name,
                                        email: req.user.email
                                    },
                                    replyof: req.body.replyId
                                });
                            });

                            if (msgCollection.length > 0) {
                                TeamCommunication.create(msgCollection, function (err, teamCommunication) {
                                    if (!err) { 
                                      return res.status(201).json({error: false, token: message._id, status: 'Message has been sent successfully to all users.' });
                                    }
                                    else{
                                       Messages.remove({"_id": message._id}, function(er, dd){});
                                        return handleError(res, err); 
                                    }
                                });
                            }
                            //return res.status(201).json({ token: message._id, status: 'Message sent successfully' });
                        });
                    }
                });
            });
          }
          else {
            return res.status(200).json({ error: true, status: 'Sponsor id is not idefined.' });
          }
    }).catch(function(err) {
          return res.status(500).json({ error: true, status: 'Error occurred while sending message to all user.' });
  });
};

// Updates an existing team-communication in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  TeamCommunication.findById(req.params.id, function (err, teamCommunication) {
    if (err) { return handleError(res, err); }
    if(!teamCommunication) { return res.status(404).send('Not Found'); }
    var updated = _.merge(teamCommunication, req.body);
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.status(200).json({'error': null, 'message': 'Updated successfully'});
    });
  });
};

// Deletes a team-communication from the DB.
exports.destroy = function(req, res) {
  TeamCommunication.findById(req.params.id, function (err, teamCommunication) {
    if(err) { return handleError(res, err); }
    if(!teamCommunication) { return res.status(404).send('Not Found'); }
    teamCommunication.update({active: false}, function(err) {
      if(err) { return handleError(res, err); }
      return res.status(204).send('No Content');
    });
  });
};

function handleError(res, err) {
  return res.status(500).send(err);
}
