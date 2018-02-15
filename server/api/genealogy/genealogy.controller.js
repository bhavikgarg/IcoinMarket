'use strict';

var _ = require('lodash');
var async = require('async');
var Genealogy = require('./genealogy.model');
var Affilate  = require('./../affiliates/affiliates.model');
var User = require('./../user/user.model');
var jwt = require('jsonwebtoken');
var config = require('./../../config/environment');
var GenealogyTree = require('./genealogyview.model');
var Credits = require('../../components/credits/credits.service');
var fs = require('fs');
var json2xls = require('json2xls');
var uuid = require('uuid');
var moment = require('moment');


var _createUser = function(data, req, res) {

  // Validate User Existance
  Genealogy.isUnique(data.user.email, function(err, uinfo) {

    if(err || (uinfo && uinfo[0] && uinfo[0].isUnique > 0)){
      return res.status(200).json({message: 'Unable to create user'});
    }

    // If user not exists create user
    Genealogy.create(data, function (err, results) {
      if (err) {
        console.log(err.message);
        return res.status(200).json({message: err.message});
      }
      else {
        var result = results[0];
        if (!result) {
          console.log('No user found.');
        } else {
          var user = result['u'];
          console.log(JSON.stringify(user, null, 4));
        }

        // Update affilation for Referral signup count
        Affilate.findOne({target: req.body.ref[3]}, function(err, affilate) {
          console.log(req.body.ref[3]);
          console.log("Affilate Error:"+err );
          if(!err && affilate) {
            affilate.update({registercount: (affilate.registercount + 1)}, function(_err, _resp) {
              console.log('Affilate Referral Singup Count Update: ', _err);
            });
          }
        });

        User.findById(data.user.id, function(err, _user) {
          if(!err) {
            _user.update({sponsor: req.body.ref[0]}, function(err, data) {
              console.log('User updated for sponsor id: if not see error info', err);
            })
          }
        });

        return res.status(200).json({message: 'User created successfully'});
      }
    });
  });

}

exports.create = function(req, res) {

  var data = req.body, _decode = jwt.decode;

  if ( req.headers.refuid && req.headers.refuser ){
    var sponsorData = new Buffer(req.headers.refuser, 'base64');
    sponsorData = sponsorData.toString();
    data.ref = sponsorData.split('>');
    console.log('Referral User ==',req.headers.refuid, req.headers.refuser, data.ref);
  } else{
    data.ref = [config.sponsorId, '', '', config.sponsorUn];
    console.log('CI User ==',config.sponsorId, config.sponsorUn);
  }

  if(typeof data.user.tokenVal != 'undefined' && typeof data.user.id == 'undefined') {
    var decoded = data.user.tokenVal+'';
        decoded = _decode(decoded);

    data.user.id = decoded._id;
  }
  console.log('Inside Genealogy = ');
  _createUser(data, req, res);

  // if(data.ref.length == 0 && data.user.customSponsor) {
  //   console.log('No Reference Found: ', data.user.customSponsor);
  //   User.findOne({username: data.user.customSponsor+''}, function(err, _us) {
  //     if(!err && _us) {
  //       data.ref = [_us._id, '', '', data.user.customTarget];
  //       req.body.ref = data.ref;
  //     }
  //     _createUser(data, req, res);
  //   });
  // }
  // else {
  //   _createUser(data, req, res);
  // }

};

exports.exportListMembers = function(req, res) {

  req.body.sponsor = req.user._id+'';
  req.body.exportList = true;

  Genealogy.list(req.body, function(err, results) {
    if(err){
      console.log(err.message);
      return res.status(200).json({message: err.message});
    }
    else {
      return _listMembers({params: req.body, query: req.body}, res, results, true);
    }

  });
};


exports.listMembers = function(req, res) {
  var responseData       = [],
      responseDataObject = {
        sponsorId: req.params.sponsor,
        sponsorName: '-',
        flagUrl: config.flagUrl,
        memberInfo: [],
        totalUsers: 0,
        totalPages: 0
      };

  if(parseInt(req.params.level) > 3 || parseInt(req.params.level) <= 0 || isNaN(parseInt(req.params.level))) {
    return res.status(200).json(responseDataObject);
  }

  if(req.user._id+'' === req.params.sponsor) {
    Genealogy.list(req.params, function(err, results) {
      if(err){
        console.log(err.message);
        return res.status(200).json({message: err.message});
      }
      else {

        if(req.params.viewas == 'list') {
          return _listMembers(req, res, results, false);
        }
        else if(req.params.viewas == 'grid') {
          var _totalUsers = (results.totalUsers ? results.totalUsers : 0),
              _totalPages = parseInt(_totalUsers / parseInt(config.maxPaginationLimit));

          if((_totalPages * parseInt(config.maxPaginationLimit) < _totalUsers)) {
            _totalPages = _totalPages + 1;
          }

          responseDataObject.totalUsers  = _totalUsers;
          responseDataObject.pageLimit   = config.maxPaginationLimit;
          responseDataObject.totalPages  = _totalPages;
          responseDataObject.sponsorName = results.sponsor.name;

          results.members.forEach(function(_data) {

            responseDataObject.memberInfo.push({
              id: _data.member_id,
              name: _data.member_name,
              joinAt: _data.joinat,
              glevel: _data.generation_level,
              country: _data.country,
              rank: 0,
              status: 0,
              users: _data.members_count,
              sponsorUsername: (_data.user_sponsor_name ? _data.user_sponsor_name : ''),
              sponsorUserId: (_data.user_sponsor_id ? _data.user_sponsor_id : ''),
              sponsorId: (_data.sponsor_id ? _data.sponsor_id : '')
            });
          });
          return res.status(200).json(responseDataObject);
        }
      }
    });
  }
  else {
    return res.status(200).json(responseDataObject);
  }
};

exports.levelMembers = function(req, res) {

  var responseData       = [],
      responseDataObject = {
        sponsorId: req.params.sponsor,
        sponsorName: '-',
        flagUrl: config.flagUrl,
        memberInfo: [],
        totalUsers: 0,
        totalPages: 0
      };

  if(parseInt(req.params.level) > 3 || parseInt(req.params.level) <= 0 || isNaN(parseInt(req.params.level))) {
    return res.status(200).json(responseDataObject);
  }

  if(req.user._id+'' !== req.params.sponsor) {
    Genealogy.validRequest(req.user._id+'', req.params.sponsor, function(e, d) {

      var validMember = (!e && d && d[0] && d[0].validMember > 0);

      if(e || !validMember) {
        console.log('[err] Loading Genealogy level members info: ', e);
        return res.status(200).json(responseDataObject);
      }

      Genealogy.levelList(req.params, function(err, results) {
        if(err){
          console.log(err.message);
          return res.status(200).json({message: err.message});
        }
        else {

          if(req.params.viewas == 'list') {

            return _listMembers(req, res, results, false);
          }
          else if(req.params.viewas == 'grid') {
            var _totalUsers = (results.totalUsers ? results.totalUsers : 0),
                _totalPages = parseInt(_totalUsers / parseInt(config.maxPaginationLimit));

            if((_totalPages * parseInt(config.maxPaginationLimit) < _totalUsers)) {
              _totalPages = _totalPages + 1;
            }

            responseDataObject.totalUsers  = _totalUsers;
            responseDataObject.totalPages  = _totalPages;
            responseDataObject.sponsorName = results.sponsor.name;

            results.members.forEach(function(_data) {
              responseDataObject.memberInfo.push({
                id: _data.member_id,
                name: _data.member_name,
                joinAt: _data.joinat,
                glevel: _data.generation_level,
                country: _data.country,
                rank: 0,
                status: 0,
                users: _data.members_count,
                sponsorUsername: (_data.user_sponsor_name ? _data.user_sponsor_name : ''),
                sponsorUserId: (_data.user_sponsor_id ? _data.user_sponsor_id : ''),
                sponsorId: (_data.sponsor_id ? _data.sponsor_id : '')
              });
            });
            return res.status(200).json(responseDataObject);
          }
        }
      });

    });
  }
  else {
    return res.status(200).json(responseDataObject);
  }
};

exports.leaderBoardDirects = function(req, res) {

  return res.status(200).json({
    members: [],
    flagUrl: config.flagUrl
  });

  /* if(req.body.type != 'all') {
    var queryObj = {
      joinMinDate: req.body.startDate,
      joinMaxDate: req.body.endDate
    };

    Genealogy.getLeaderBoardInfoDirects(queryObj, function(err, results) {
      return res.status(200).json({members: results});
    });
  }
  else {
    Genealogy.getLeaderBoardInfoAllTimeDirects({}, function(err, results) {
      return res.status(200).json({
        members: results,
        flagUrl: config.flagUrl
      });
    });
  } */
};

exports.leaderBoardAllDirects = function(req, res) {

  return res.status(200).json({
    members: [],
    flagUrl: config.flagUrl
  });

  /* if(req.body.type != 'all') {
    var queryObj = {
      joinMinDate: req.body.startDate,
      joinMaxDate: req.body.endDate
    };

    Genealogy.getLeaderBoardInfoAllDirects(queryObj, function(err, results) {
      return res.status(200).json({
        members: results
      });
    });
  }
  else {
    Genealogy.getLeaderBoardInfoAllTimeAllDirects({}, function(err, results) {
      return res.status(200).json({
        members: results,
        flagUrl: config.flagUrl
      });
    });
  } */
};

exports.getMySignups = function(req, res) {

  var _query = {id: req.user._id};

  if(req.params.viewas && req.params.viewas != '') {
    var timeFrame = {
      from: new Date(),
      to: (new Date()).toISOString()
    };

    switch (req.params.viewas) {
      case '7D':
        timeFrame.from.setTime(timeFrame.from.getTime() - (7*24*60*60*1000));
        timeFrame.from = timeFrame.from.toISOString();
        _query['createdat'] = timeFrame
        break;
      case '1M':
        timeFrame.from.setTime(timeFrame.from.getTime() - (30*24*60*60*1000));
        timeFrame.from = timeFrame.from.toISOString();
        _query['createdat'] = timeFrame;
        break;
      case '24H':
        timeFrame.from.setTime(timeFrame.from.getTime() - (1*24*60*60*1000));
        timeFrame.from = timeFrame.from.toISOString();
        _query['createdat'] = timeFrame;
        break;
    }
  }

  Genealogy.getMySignups(_query, function(err, firstLeavelResult) {

    Genealogy.getMyTeamSignups(_query, function(err, result) {

      return res.status(200).json({
        totalFirstLevelSignups: (firstLeavelResult ? firstLeavelResult[0].members : 0),
        totalSignups: (result ? result[0].members : 0)
      });
    });

  });
};

exports.getlistAllUserUpto7Level = function(req, res) {

  var page = req.query.page || 1;
  return Genealogy.getlistAllUserUpto7Level(req.user._id+'', page, function(err, data) {
    return Genealogy.getcountAllUserUpto7Level(req.user._id+'', function(_err, _data) {
      return res.status(200).json({
        members: data,
        limit: config.minPaginationLimit,
        rows: _data[0]['count(n)']
      });
    });
  })
}

exports.timeBasedSignupCounts = function(req, res) {

  var _current = moment();
  var _query   = {
    userId: req.user._id,
    date1From: moment().subtract(1, 'day').toISOString(),
    date1To: _current.toISOString(),
    date7From: moment().subtract(7, 'day').toISOString(),
    date7To: _current.toISOString(),
    date30From: moment().subtract(30, 'day').toISOString(),
    date30To: _current.toISOString(),
    date365From: moment().subtract(365, 'day').toISOString(),
    date365To: _current.toISOString()
  };

  Genealogy.timeBasedSignupCounts(_query, function(err, dbResult) {
    var defObject = {
      "totalUsers": {
        "previousDay": {"totalFirstLevelSignups": 0, "totalSignups": 0},
        "last7Days": {"totalFirstLevelSignups": 0, "totalSignups": 0},
        "last30Days": {"totalFirstLevelSignups": 0, "totalSignups": 0},
        "last365Days": {"totalFirstLevelSignups": 0, "totalSignups": 0}
      }
    };

    if(err) { return res.status(200).json(defObject); }

    dbResult.forEach(function(r) {

      // Last 1 Day Signup
      if(r.level == "1" && r.numberOfDays == "1") {
        defObject['totalUsers'].previousDay.totalFirstLevelSignups = r.totalUsers;
      }
      else if(r.level == "7" && r.numberOfDays == "1") {
        defObject['totalUsers'].previousDay.totalSignups = r.totalUsers;
      }

      // Last 7 Days Signups
      else if(r.level == "1" && r.numberOfDays == "7") {
        defObject['totalUsers'].last7Days.totalFirstLevelSignups = r.totalUsers;
      }
      else if(r.level == "7" && r.numberOfDays == "7") {
        defObject['totalUsers'].last7Days.totalSignups = r.totalUsers;
      }

      // Last 30 Days Signups
      else if(r.level == "1" && r.numberOfDays == "30") {
        defObject['totalUsers'].last30Days.totalFirstLevelSignups = r.totalUsers;
      }
      else if(r.level == "7" && r.numberOfDays == "30") {
        defObject['totalUsers'].last30Days.totalSignups = r.totalUsers;
      }

      // Last 365 Days Signups
      else if(r.level == "1" && r.numberOfDays == "365") {
        defObject['totalUsers'].last365Days.totalFirstLevelSignups = r.totalUsers;
      }
      else if(r.level == "7" && r.numberOfDays == "365") {
        defObject['totalUsers'].last365Days.totalSignups = r.totalUsers;
      }
    });

    return res.status(200).json(defObject);
  });
};

var _listMembers = function(req, res, results, download) {

  var _Credits = new Credits(),
      responseData = [],
      exportData   = [],
      responseDataObject = {};

  async.forEach(results.members, function (_data, callback) {
    // _Credits.getPurchasedPacks(_data.member_id, function(_err, purchaseInfo) {
    //   if(_err) { console.log(_err); }
    //
    //   var silverPacks = 0, goldPacks = 0;
    //   if(purchaseInfo && purchaseInfo.length > 0) {
    //     purchaseInfo.forEach(function(d) {
    //       if(d._id.product == 'gold') { goldPacks = (d.packs ? d.packs : 0); }
    //       if(d._id.product == 'silver') { silverPacks = (d.packs ? d.packs : 0); }
    //     });
    //   }

      User.findById(_data.member_id+'', function(_e, _u) {
        responseData.push({
          sponsorId: _data.sponsor_id,
          sponsorName: _data.sponsor_name,
          memberInfo: {
            id: _data.member_id,
            name: _data.member_name,
            joinAt: _data.joinat,
            glevel: _data.generation_level,
            country: _data.country,
            rank: 0,
            status: 0,
            silverpacks: (_data.silverpacks || 0), //silverPacks,
            goldpacks: (_data.goldpacks || 0), //goldPacks,
            adcpacks : (_data.adcpacks || 0),
            users: _data.members_count,
            email: (_data.email ? _data.email : ''),
            sponsorUsername: (_data.user_sponsor_name ? _data.user_sponsor_name : ''),
            sponsorUserId: (_data.user_sponsor_id ? _data.user_sponsor_id : ''),
            username: (_u ? _u.username: ''),
            mobile: ((_u && _u.mobile) ? _u.mobile.replace("undefined-", "") : '')
          }
        });

        callback(); // tell async that the iterator has completed
      });
    // });
  }, function(err) {

    var maxlevel = Math.max.apply(Math, responseData.map(function(o){return o.memberInfo.glevel;}))
    var maxusers = Math.max.apply(Math, responseData.map(function(o){return o.memberInfo.users;}))
    var maxrank = Math.max.apply(Math, responseData.map(function(o){return o.memberInfo.rank;}))
    var maxgoldpacks = Math.max.apply(Math, responseData.map(function(o){return o.memberInfo.goldpacks;}))
    var maxsilverpacks = Math.max.apply(Math, responseData.map(function(o){return o.memberInfo.silverpacks;}))

    // req.params.minusers = parseInt(req.params.minusers);
    // req.params.maxusers = parseInt(req.params.maxusers);
    // req.params.rank = parseInt(req.params.rank);
    // req.params.minsilverpacks = parseInt(req.params.minsilverpacks);
    // req.params.maxsilverpacks = parseInt(req.params.maxsilverpacks);
    // req.params.mingoldpacks = parseInt(req.params.mingoldpacks);
    // req.params.maxgoldpacks = parseInt(req.params.maxgoldpacks);
    //
    // if(req.params.minusers >= 0 && req.params.maxusers > 0){
    //   responseData = _.filter(responseData, function(item){
    //     return ((item.memberInfo.users >= req.params.minusers) && (item.memberInfo.users <= req.params.maxusers));
    //   });
    // }
    // if(req.params.rank > 0){
    //   responseData = _.where(responseData,{rank: req.params.rank });
    // }
    // if(req.params.mingoldpacks >= 0 && req.params.maxgoldpacks > 0){
    //   responseData = _.filter(responseData, function(item) {
    //     return ((item.memberInfo.goldpacks >= req.params.mingoldpacks) && (item.memberInfo.goldpacks <= req.params.maxgoldpacks));
    //   });
    // }
    // if(req.params.minsilverpacks >= 0 && req.params.maxsilverpacks > 0){
    //   responseData = _.filter(responseData, function(item) {
    //     return ((item.memberInfo.silverpacks >= req.params.minsilverpacks) && (item.memberInfo.silverpacks <= req.params.maxsilverpacks));
    //   });
    // }

    if(download) {
      if(responseData && responseData.length > 0) {
        var exportData = [], idx = 1;
        responseData.forEach(function(a) {
          var _date  = new Date(a.memberInfo.joinAt);
          var time   = _date.getHours()+':'+_date.getMinutes()+':'+_date.getSeconds();
          var __date = _date.getFullYear()+'-'+(_date.getMonth()+1)+'-'+_date.getDate();
          exportData.push({
            "Sr. No": idx+'',
            "Name of the User": a.memberInfo.name,
            "User Id": a.memberInfo.username,
            "User Email": a.memberInfo.email,
            "Mobile Number": a.memberInfo.mobile,
            "DOJ (Server Date)": __date,
            "Time (Server Time)": time,
            "Directs": ' - ',
            "Team Size": a.memberInfo.users
          });

          idx = idx + 1;
        });

        var xls = json2xls(exportData);
        var filename = uuid.v1() + '.xlsx';
        var fd = fs.openSync( filename, 'w');
        fs.writeFile( filename, xls, 'binary');

        return res.status(200).json({ success : true, file: filename });

      } else {

        return res.status(500).json({ message : 'expecting an array or a object!'});
      }
    }
    else {
      responseDataObject = {'members': responseData, flagUrl: config.flagUrl, maxrank: maxrank, maxusers: maxusers, maxlevel: maxlevel, maxgoldpacks: maxgoldpacks, maxsilverpacks: maxsilverpacks, totalusers: results.totalUsers, limit: config.minPaginationLimit};

      return res.status(200).json(responseDataObject);
    }
  });
}
