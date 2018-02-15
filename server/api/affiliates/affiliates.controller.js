'use strict';

var _ = require('lodash');
var Affiliates      = require('./affiliates.model');
var AffilateBanner  = require('./affiliates-banner.model');
var AffiliateLog    = require('./affiliates-logs.model');
var User            = require('./../user/user.model');
var uploadmedia = require('./../uploadmedia/uploadmedia.model');
var config = require('./../../config/environment');
var uuid = require('uuid');

// Get list of affiliatess
exports.index = function(req, res) {
  var query = {};
  var viewLimit   = config.minPaginationLimit;
  var currentPage = (req.query.page ? req.query.page : 1);
  var skipRows    = (viewLimit * (currentPage - 1));

  if(req.user.role != 'admin') {
    query.userid   = req.user._id;
    query.isactive = true;
  }

  if(typeof req.query.type != 'undefined') {
    query.linktype = req.query.type;
  }

  Affiliates.find(query).sort({createdat: -1}).limit(viewLimit).skip(skipRows).exec(function (err, affiliates) {
    if(err) { return handleError(res, err); }

    Affiliates.findOne({linktype: 'default', userid: req.user._id}, function(_err, _row) {
      var _affiliates = affiliates;
      if(_row) {
        _affiliates.push(_row);
      }

      if(req.query.isexist){
        return res.status(200).json({exist : (_affiliates && _affiliates.length > 0) });
      }
      else{
        Affiliates.count(query, function(err, rows) {
          return res.status(200).json({data: _affiliates, limit: viewLimit, rows: rows});
        });
      }
    })
  });
};

// Get a single affiliates
exports.show = function(req, res) {
  var query = {
    'isactive': true,
    '_id': 'ObjectId("'+req.params.id+'")'
  };

  Affiliates.findOne(query, function (err, affiliates) {
    if(err) { return handleError(res, err); }
    if(!affiliates) { return res.status(404).send('Not Found'); }
    return res.json(affiliates);
  });
};

// Creates a new affiliates in the DB.
exports.create = function(req, res) {
  var _user   = req.user;
  var linkUrl = '/link' //+_user.role+'&target='+uuid.v1()+'&source=oth&user='+_user._id;
  /*if(req.body.signUp){
    var signUp = req.body.signUp;
  }else{
    var signUp = '';
  }*/
  var defaultLink = req.body.defaultLink;

  Affiliates.aggregate([{"$match": {"userid": _user._id+''}}, {"$group": {"_id":"$userid", maxId: { $max: "$uniqueid" }}}], function(err, d) {

    if(err) { return handleError(res, err) };

    var maxId = (parseInt(d[0].maxId)+1);
    Affiliates.create({
      userid: _user._id,
      linktype: 'other',
      linkurl: linkUrl,
      linkname: req.body.title,
      isactive: true,
      reference: _user.role,
      target: uuid.v1(),
      landingpage: req.body.landingpage,
      defaultLink: defaultLink,
      userfriendlyurl: '?id='+_user.username+'&link='+maxId,
      uniqueid: maxId,
      memberid: _user.username
    }, function(err, affiliates) {
      if(err) { return handleError(res, err); }
      return res.status(201).json(affiliates);
    });
  })
};

// Updates an existing affiliates in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  Affiliates.findById(req.params.id, function (err, affiliates) {
    if (err) { return handleError(res, err); }
    if(!affiliates) { return res.status(404).send('Not Found'); }
    //if(affiliates.userid != req.user._id) { return res.status(404).send('Invalid request'); }

    if(req.body.visitcount && affiliates.visitcount != req.body.visitcount) {
      AffiliateLog.create({
        userid: affiliates.userid,
        logtype: 'visit',
        target: affiliates.target
      }, function(err, visitLog) {
        if(err) {
          console.log('[err] Affiliates Log Visit Error');
        }
      });
    }
    if(req.body.registercount && affiliates.registercount != req.body.registercount) {

      AffiliateLog.create({
        userid: affiliates.userid,
        logtype: 'signup',
        target: affiliates.target
      }, function(err, visitLog) {
        if(err) {
          console.log('[err] Affiliates Log Signup Error');
        }
      });
    }

    var updated = _.merge(affiliates, req.body);

    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.status(200).json(affiliates);
    });
  });
};

// Deletes a affiliates from the DB.
exports.destroy = function(req, res) {
  Affiliates.findById(req.params.id, function (err, affiliates) {
    if(err) { return handleError(res, err); }
    if(!affiliates) { return res.status(404).send('Not Found'); }
    if(affiliates.userid != req.user._id) { return res.status(404).send('Invalid request'); }
    affiliates.update({isactive: false}, function(err) {
      if(err) { return handleError(res, err); }
      return res.status(204).send('No Content');
    });
  });
};

exports.defaultAffilate = function(req, res) {
  var _user   = req.user;
  var linkUrl = '/link';
  var _landingpage= config.protocol + config.appDomain + '/refl';

    Affiliates.create({
        userid: _user._id,
        linktype: 'default',
        linkurl: linkUrl,
        linkname: 'Default Referral',
        reference: _user.role,
        target: uuid.v1(),
        isactive: true,
        defaultLink: false,
        landingpage: _landingpage,
        userfriendlyurl: '?id=' + _user.username + '&link=1',
        uniqueid: 1,
        memberid: _user.username
    }, function(err, affiliates) {
        if (err) {
            return handleError(res, err);
        }
        return res.status(201).json(affiliates);
    });
}

exports.findByTarget = function(req, res) {

  var query = {
    memberid: decodeURI(req.query.memberid || req.params.memberid),
    uniqueid: parseInt(req.query.linkid || req.params.linkid),
    isactive: true
  };

  if(req.query.target) {
    query = {
      target: req.query.target + '',
      isactive: true
    };
  }

  Affiliates.findOne(query, function(err, affiliates) {
    if(err) { return res.status(200).json({error: true, message: 'Invalid Referral Link.'}) }

    if(affiliates) {
      // findByTarget
      User.findById(affiliates.userid, function(error, userInfo) {

        if(error || !userInfo) {
          console.log("Referal user not found, UserId : "+affiliates.userid+', Err: '+error);
          var referralHash = encodeURIComponent(config.sponsorId + '>CICompany>2>>' + config.sponsorUn);
        }
        else {
          var referralHash = encodeURIComponent(userInfo._id + '>' + userInfo.name + '>' + userInfo.userProfileId + '>' + affiliates.target + '>' + userInfo.username);
        }

        referralHash = new Buffer(referralHash.replace(/%([0-9A-F]{2})/g, function(mstr, pstr) {
          return String.fromCharCode('0x' + pstr);
        }));

        return res.status(200).json({
          error: false,
          target: affiliates.target,
          refhash: referralHash.toString('base64')
        });
      });
    }
    else {
      AffilateBanner.findOne(query, function(_err, abanners) {
        if(abanners) {

          User.findById(abanners.userid, function(error, userInfo) {

            if(error || !userInfo) {
              var referralHash = encodeURIComponent(config.sponsorId + '>CICompany>2>>' + config.sponsorUn);
            }
            else {
              var referralHash = encodeURIComponent(userInfo._id + '>' + userInfo.name + '>' + userInfo.userProfileId + '>' + abanners.target + '>' + userInfo.username);
            }

            referralHash = new Buffer(referralHash.replace(/%([0-9A-F]{2})/g, function(mstr, pstr) {
              return String.fromCharCode('0x' + pstr);
            }));

            return res.status(200).json({
              error: false,
              target: abanners.target,
              refhash: referralHash.toString('base64')
            });
          });
        }
        else {

          console.log('[info] Affiliate not found for target: ' + query.target, _err, err);
          return res.redirect('/login');
        }
      });
    }
  });
}

exports.createBanner = function(req, res) {
  var _data = {
    userid: req.user._id,
    bannerimage: req.body.image,
    bannerwidth: req.body.width,
    bannerHeight: req.body.height,
    bannername: req.body.name,
    bannerviewhtml: '',
    isactive: true,
    target: uuid.v1(),
    linkurl: '/link'
  };

  AffilateBanner.create(_data, function(err, banner) {
    if(err) { return handleError(res, err); }
    return res.status(201).json(banner);
  });
}

exports.getAffilateBanners = function(req, res) {

  var _banners = [];
  AffilateBanner.find({isactive: true}, function(err, banners) {
    if (err) { return handleError(res, err); }

    banners.forEach(function(banner) {
      _banners.push({
        width: banner.bannerwidth,
        height: banner.bannerHeight,
        name: banner.bannername,
        image: banner.bannerimage,
        id: banner._id,
        target: banner.target,
        linkurl: banner.linkurl,
        createdAt: banner.createdat
      });
    });

    return res.status(200).json({banners: _banners});
  });
}

exports.removeBanner = function(req, res) {
  AffilateBanner.findById(req.params.id, function (err, banner) {
    if(err) { return handleError(res, err); }
    if(!banner) { return res.status(404).send('Not Found'); }

    banner.update({isactive: false}, function(err) {
      if(err) { return handleError(res, err); }
      return res.status(204).send('No Content');
    });
  });
}

// Creates a new affiliates in the DB.
exports.createBannerPromotion = function(req, res) {
  var _user   = req.user;
  var linkUrl = '/link';


  Affiliates.aggregate([
    {"$match": {"userid": _user._id+''}},
    {"$group": {"_id":"$userid", maxId: { $max: "$uniqueid" }}}
  ], function(err, d) {

    if(err) { return handleError(res, err) };

    var maxId = (parseInt(d[0].maxId)+1);
    Affiliates.create({
      userid: _user._id,
      linktype: 'banner',
      linkurl: linkUrl,
      linkname: req.body.title,
      isactive: true,
      reference: _user.role,
      target: uuid.v1(),
      banner: req.body.bannerInfo,
      landingpage: req.body.landingpage,
      userfriendlyurl: '?id='+_user.username+'&link='+maxId,
      uniqueid: maxId,
      memberid: _user.username
    }, function(err, affiliates) {
      if(err) { return handleError(res, err); }
      return res.status(201).json(affiliates);
    });
  });
};

exports.getTotalHits = function(req, res) {
  var _user  = req.user;
  var _query = {"userid": _user._id + '', 'logtype': 'visit'};

  var prelaunchTime = 1498471200000; // Timm is set to 26th June 2017, 3:30 IST which is ICM pre launch launch time

  if(req.query.viewas && req.query.viewas != '') {
    var timeFrame = {
      from: new Date()
    };

    switch (req.query.viewas) {
      case '7D':
        var fromTime = timeFrame.from.getTime() - (7*24*60*60*1000);
        timeFrame.from.setTime(Math.max(prelaunchTime, fromTime));
        _query['createdat'] = {
          $gte: new Date(timeFrame.from.getTime())
        }
        break;
      case '1M':
        var fromTime = timeFrame.from.getTime() - (30*24*60*60*1000);
        timeFrame.from.setTime(Math.max(prelaunchTime, fromTime));
        _query['createdat'] = {
          $gte: new Date(timeFrame.from.getTime())
        }
        break;
      case '24H':
        var fromTime = timeFrame.from.getTime() - (1*24*60*60*1000);
        timeFrame.from.setTime(Math.max(prelaunchTime, fromTime));
        _query['createdat'] = {
          $gte: new Date(timeFrame.from.getTime())
        }
        break;
    case 'all':
      timeFrame.from.setTime(prelaunchTime);
      _query['createdat'] = {
        $gte: new Date(timeFrame.from.getTime())
      }
      break;
    }
  }
  AffiliateLog.count(_query , function(err, data){
    return res.status(200).json({totalHits: (data && parseInt(data) > 0 ? parseInt(data) : 0)});
  });
};


// exports.getTotalHits = function(req, res) {
//   var _user  = req.user;
//   var _query = {"userid": _user._id + '', 'logtype': 'visit'};
//
//   if(req.query.viewas && req.query.viewas != '') {
//     var timeFrame = {
//       from: new Date(),
//       to: new Date()
//     };
//
//     switch (req.query.viewas) {
//       case '7D':
//         timeFrame.from.setTime(timeFrame.from.getTime() - (7*24*60*60*1000));
//         _query['createdat'] = {
//           $gte: new Date(timeFrame.from.getTime()),
//           $lte: new Date(timeFrame.to.getTime())
//         }
//         break;
//       case '1M':
//         timeFrame.from.setTime(timeFrame.from.getTime() - (30*24*60*60*1000));
//         _query['createdat'] = {
//           $gte: new Date(timeFrame.from.getTime()),
//           $lte: new Date(timeFrame.to.getTime())
//         }
//         break;
//       case '24H':
//         timeFrame.from.setTime(timeFrame.from.getTime() - (1*24*60*60*1000));
//         _query['createdat'] = {
//           $gte: new Date(timeFrame.from.getTime()),
//           $lte: new Date(timeFrame.to.getTime())
//         }
//         console.log(JSON.stringify([
//           {$match: _query},
//           {$group: {
//             "_id": {"userid": "$userid"},
//             "totalhits": {$sum: "$visitcount"}
//           }}
//         ]));
//         break;
//     }
//   }
//
//   return res.status(200).json({totalHits: 0 });
//   // AffiliateLog.aggregate([
//   //   {$match: _query},
//   //   {$group: {
//   //     "_id": {"userid": "$userid"},
//   //     "totalhits": {$sum: 1}
//   //   }}
//   // ], function(err, affiliate) {
//   //   if(err) { return handleError(res, err); }
//   //   return res.status(200).json({totalHits: (affiliate && affiliate.length > 0 && affiliate[0].totalhits ? (affiliate[0].totalhits) : 0)});
//   // })
// };

exports.updateVisit = function(req, res) {

  Affiliates.findOne({
    memberid: req.params.username + '',
    uniqueid: req.params.uniqueid + '',
    isactive: 1
  }, function (err, affiliates) {
    if (err) { return handleError(res, err); }
    if(!affiliates) { return res.status(404).send('Not Found'); }

    AffiliateLog.create({
      userid: affiliates.userid,
      logtype: 'visit',
      target: affiliates.target
    }, function(err, visitLog) {
      if(err) {
        console.log('[err] Affiliates Log Visit Error');
      }
    });

    var updated = _.merge(affiliates, {visitcount: (affiliates.visitcount+1)});

    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.status(200).json({});
    });
  });
};

function handleError(res, err) {
  return res.status(500).send(err);
}
