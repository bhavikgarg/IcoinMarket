'use strict';

/**
 * campaign module.
 * @module ci-server/campaign-controller
 * @see module:ci-server/viewcampaign
 */

var _ = require('lodash');
var co = require('co');
var Campaign = require('./campaign.model');
var ViewCampaign = require('./viewcampaign.model');
var ViewCampaignLog = require('./viewcampaignlog.model');
var UserCreditLogs = require('./../credits/credit-logs.model');
var UserModel = require('./../user/user.model');
var Credits = require('../../components/credits/credits.service');
var Products = require('../../components/products/product.service');
var config = require('./../../config/environment');
var mongoose = require('mongoose');
var http = require('http');
var _url = require('url');
var HttpProxyAgent = require('http-proxy-agent');
var request = require('request');
var moment  = require('moment');
var UserWithdrawal = require('./../payment/transfer-user.model');
var uuid = require('uuid');
var ValidateService   = require('./../../components/transactions/validate.service');
var moment = require('moment');
var ProductService = require('../../components/products/product.service');


/**
* Get list of campaigns
* @function
* @param {number} page
* @access user
* @return {List<Campaign>} campaigns - 25 per page
*/
exports.index = function(req, res) {

  var query = {};
  if(req.user.role == 'user') {
    query.userid = req.user._id+'';
  }

  if(req.query.type && typeof req.query.type === 'object') {
    query.campaigntype = {$in: req.query.type };
  }
  var viewLimit   = parseInt(config.minPaginationLimit);
  if(req.query.filterQuery) {
    var _filterData = JSON.parse(req.query.filterQuery).data;
    query["$or"] = [
      {"name": {"$regex": _filterData, "$options": 'i'}},
      {"viewurl": _filterData }
    ]
  }

  var currentPage = (req.query.page ? req.query.page : 1);
  var skipRows    = (viewLimit * (currentPage - 1));
  var _campaing   = Campaign.find(query);

  if(req.user.role == 'admin') {
    if(req.query.isactive == 1) {
      query['active'] = true;
      if(req.query.filterQuery) {
        query['$and'] = [{"$or": query['$or']}, {"$or": [
          {'credits': {"$gte": 0}},
          {'credits': null}
        ]}];

        delete query['$or'];
      }
      else {
        query['$or'] = [
          {'credits': {"$gte": 0}},
          {'credits': null}
        ];
      }

      _campaing = Campaign.find(query)
      .$where('this.credits > this.expirecredits');
    }
    else if(req.query.isactive == 0) {
      query['active'] = false;
      if(req.query.filterQuery && req.query.filterQuery.data != '') {
        query['$and'] = [{"$or": query['$or']}, {"$or": [{'credits': {"$gte": 1}}]}];
        delete query['$or'];
      }
      else {
        query['$or'] = [{'credits': {"$gte": 1}}];
      }

      _campaing = Campaign.find(query)
      .$where('this.credits <= this.expirecredits');
    }
  }

  _campaing.sort({_id: -1, createdat: -1}).limit(viewLimit).skip(skipRows).exec(function (err, campaigns) {
    if(err) { return handleError(res, err); }

    var _campaigns = [], _rowData = {};
    campaigns.forEach(function(c) {
      var _credit    = parseInt(c.credits),
          _excredits = parseInt(c.expirecredits);
      _credit    = (isNaN(_credit) ? 0 : _credit);
      _excredits = (isNaN(_excredits) ? 0 : _excredits);
      _rowData   = {
        id: c._id,
        title: c.name,
        description: c.description,
        credits: c.credits,
        expirecredits : c.expirecredits,
        amount: c.amount,
        type: c.campaigntype,
        viewUrl: c.viewurl,
        viewTime: c.priority,
        extraTime: c.quality,
        // categories: c.categories,
        createdat: c.createdat,
        imagepath: c.imagepath,
        active: ((_credit > _excredits) || (_credit === 0)),
        allowEdit: ((c.expirecredits === null) || (c.expirecredits === 0))
      };

      _campaigns.push(_rowData);
    });

    // count query update
    var _countCampaign = Campaign.count(query);
    if(req.user.role == 'admin') {
      if(req.query.isactive == 1) {
        _countCampaign = _countCampaign.$where('this.credits > this.expirecredits');
      }
      else if(req.query.isactive == 0) {
        _countCampaign = _countCampaign.$where('this.credits <= this.expirecredits');
      }
    }

    _countCampaign.exec(function(err, rows) {
      return res.status(200).json({data: _campaigns, limit: viewLimit, rows: rows});
    });

  });
};

/**
* Get campaign
* @function
* @access user
* @param {id} id : parameter campaign-id
* @return {List<Campaign>} campaigns - 25 per page
*/
exports.show = function(req, res) {
  var query = {};
  if(req.user.role == 'user') {
    query.userid = req.user._id;
  }

  Campaign.findById(req.params.id, function (err, campaign) {
    if(err) { return handleError(res, err); }
    if(!campaign) { return res.status(404).send('Not Found'); }

    return res.json({
      id: campaign._id,
      title: campaign.name,
      description: campaign.description,
      credits: campaign.credits,
      type: campaign.campaigntype,
      viewUrl: campaign.viewurl,
      priority: campaign.priority,
      viewTime: config.minViewTime,
      extraTime: campaign.quality,
      // categories: campaign.categories,
      imagepath: campaign.imagepath,
      allowEdit: ((campaign.expirecredits === null) || (campaign.expirecredits === 0))
    });
  });
};

/**
* Get campaign viewers paginated list
* @function
* @access user
* @param {id} id - parameter campaign-id
* @param {number} skip - viewers to skip
* @return {List<CampaignViewers>} campaignViewers - 25 per page
*/
exports.views = function(req, res) {
  var skip = +req.query.skip || 0;
  var limit = 25;
  co( function * () {
    var rval = { limit : limit };
    rval.data = yield ViewCampaignLog.find( { campaignid : req.params.id } )
      .select( { userid : 1, createdAt : 1 } )
	  .populate( { path : "userid", select : "username", model : "User" } )
	  .sort( { _id : -1 } )
      .skip( skip )
      .limit( limit )
      .exec();

  	rval.data = rval.data.map( function(d) { return d.toJSON(); } );
  	rval.data.forEach( function(d) {
  	  d.username = d.userid.username;
  	  if( d.username.length > 2 )
  		d.username = d.username[0] + '..' + d.username[d.username.length-1];

  	  delete d.userid; delete d._id;
  	} );

    if( !skip )
      rval.rows =  ViewCampaignLog.count( { campaignid : req.params.id } ).exec();

    return rval;
  }).then( function(val) {
    return res.status(200).send(val);
  }).catch( function(err) {
	console.log( "views error ", err );
    return handleError( res, err );
  });
};

/**
* Validate query URL can be viewed in IFrame and
* also it is a valid URL (no 500 or >=400 status code in response)
* @function
* @access user
* @param {url} loadUrl - query param campaign-id
* @return {json} valid or not
*/
exports.validateIframeLoading = function(req, res) {
  var queryLoadUrl = _url.parse(req.query.loadUrl);

  if(typeof queryLoadUrl.host == 'undefined' || queryLoadUrl.host == null) {
    res.status(200).json({valid: false, 'default': false, error: 'Invalid URL'});
  }
  else {
    var ps = new ProductService();
    return ps.isValidContnetUrl(queryLoadUrl, req.headers['user-agent'], function(response) {

      return res.status(200).json(response);
    });
  }
};

/**
* Get Last Viewed Ad time
* @function
* @access user
* @param {url} loadUrl - query param campaign-id
* @return {json} valid or not
*/
exports.lastViewTime = function(req, res){
  var viewTimeLog = ViewCampaignLog.find({userid: req.user._id, logtype : 'view' }).sort({_id:-1}).limit(1);

  UserModel.findOne({
    "_id": req.user._id+'',
    'expiryTime': {"$gte": (new Date())}
  }, 'expiryTime', function(uerr, user) {

    if(!uerr && user) {
      return res.status(200).json({'error': false, 'viewTime': user.expiryTime });
    }
    else {
      viewTimeLog.exec(function(err, timeLog) {
        if(!err && timeLog && timeLog.length > 0) {
          return res.status(200).json({'error': false, 'viewTime': timeLog[0].createdAt});
        }
        else {
          return res.status(200).json({'error': true});
        }
      });
    }
  });
}


/**
*  Get campaigns by campaign type
* @function
* @access user
* @param {string} type - query param campaigntype
* @param {string} limit - query param list size to fetch
* @param {string} skip - query param referring to page
* @return {json} valid or not
*/
exports.showByType = function(req, res) {
  var bulkOperation = Campaign.collection.initializeUnorderedBulkOp();
  var skip = +req.query.skip || 0;  //??
  var query = {
    "$or": [{expirecredits:{$gte: 0}}, {expirecredits:null}],
    campaigntype: req.query.type,
    credits: {$gt: 0},
    active: true
  };

  if(req.user.role == 'user') {
    query.userid = {$ne: req.user._id+''};

    // if(req.user.categories && req.user.categories.length > 0 && req.user.categories[0] != -1) {
    //   query.categories = {$in: req.user.categories};
    // }
  }

  //var campaignM = req.query.type === 'fbshare' ? ViewCampaignLog : ViewCampaign;
  var campaignM = req.query.type === 'text' ?  ViewCampaign : ViewCampaignLog;
  //var viewCampaign = campaignM.find({userid: req.user._id, impression: false, logtype : req.query.type === 'text' ? 'view' : req.query.type }).select({'campaignid':1, '_id':0});
  var viewCampaignQuery = {userid: req.user._id, logtype : req.query.type === 'text' ? 'view' : req.query.type };
  if(req.query.type === 'text')
    viewCampaignQuery.impression = true;
  var viewCampaign = campaignM.find(viewCampaignQuery).select({'campaignid':1, '_id':0});
  viewCampaign.exec(function(err, vcampaign) {
    if(vcampaign) {
      query._id = {$nin: []};
      vcampaign.forEach(function(v) {
        query._id['$nin'].push(mongoose.Types.ObjectId(v.campaignid+''));
      });
    }

    Campaign.aggregate([
      {$match: query},
      {$project: {
        _id: "$_id",
        userid : "$userid",
        createdat : "$createdat",
        name: "$name",
        userid: "$userid",
        description: "$description",
        viewurl: "$viewurl",
        expirecredits: "$expirecredits",
        campaigntype: "$campaigntype",
        createdat: "$createdat",
        credits: "$credits",
        priority: {$cond:{if:{$eq:["$priority","40"]},then:40, else:{$cond:{if:{$eq:["$priority","30"]},then:30, else:{$cond:{if:{$eq:["$priority","20"]},then:20, else: {$cond:{if:{$eq:["$priority","15"]},then:15,else:{$cond:{if:{$eq:["$priority", "10"]},then:10,else:5}}}}}}}}}},
        // categories: "$categories",
        imagepath: "$imagepath",
        "isexpired":{"$cond":{"if":{"$lt":["$expirecredits","$credits"]},"then":0,"else":1}}
      }},
      {"$match":{"isexpired":0}},
      {$sort: {priority: -1, createdat: 1}},
      {$skip: skip },
      {$limit: parseInt(req.query.limit)}
    ], function(err, campaigns) {
      if(err) { return handleError(res, err); }

      var _campaigns = [], impressionIds = [];
      var expiryCredits = [];
      campaigns.forEach(function(c) {
        if(config.defaultTextAds && (config.defaultTextAds.indexOf(c._id.toString()) === -1)){
            impressionIds.push({campaignid: c._id+'', userid: req.user._id, logtype : req.query.type === 'text' ? 'view' : req.query.type, impression: true});
        }
        var expCredits = (c.expirecredits ? parseInt(c.expirecredits) : 0);
        bulkOperation.find({
          description: c.description,
          viewurl: c.viewurl,
          credits: c.credits,
          userid: c.userid+'',
          createdat: c.createdat,
          campaigntype: c.campaigntype
        }).update({"$set":{expirecredits: (expCredits + parseInt(c.priority))}});

        _campaigns.push({
          id: c._id,
          title: c.name,
          description: c.description,
          type: c.campaigntype,
          priority: c.priority,
          viewUrl: c.viewurl,
          viewTime: config.minViewTime,
          // categories: c.categories,
          imagepath: c.imagepath
        });
      });

      // Block due to very less Ads are in the system
      // if(req.query.type === 'text' && impressionIds.length > 0) {
      //   handleImpression(impressionIds, bulkOperation, function(campaign, addView) {
      //     console.log('Impression View Update');
      //   });
      // }

      var currentTime = new Date();
      var userTime    = req.user.expiryTime;
      var userViewed  = 0;
  		var minTime     = new Date();
  		    minTime.setDate(minTime.getDate() - 1);
      var _createdAt  = {$gte: minTime, $lt: currentTime};

      if(userTime) {
        userTime   = new Date(userTime);
        userViewed = ((userTime > currentTime) ? 10 : userViewed);
        _createdAt = {$gte: (userTime || minTime)};
      }

  		ViewCampaignLog.count({
  			createdAt: _createdAt,
        logtype : 'view',
        userid: req.user._id+'',
        impression: true        // Verify that user view this Ad before expiry time
  		}, function(_err, _data) {

        return res.status(200).json({
          campaigns: _campaigns,
          daylimit: parseInt(config.textAdsDailyLimit),
          viewed: ((userViewed == 10) ? userViewed : _data)
        });
      });
    });
  });
};

/**
*  Creates a new campaign in the DB.
* @function
* @access user
* @param {string} body - campaign doc
* @return {json} created doc
*/
exports.create = function(req, res) {
  var data = req.body;
  data.userid = req.user._id;
  data.active = true;
  data.expirecredits = 0;

  if(parseInt(data.credits) < 1 || !data.credits) {
    return res.status(200).json({error: true, message: 'Invalid assigned coins'});
  }

  var reachPeople = parseInt(parseInt(data.credits) / parseInt(data.priority));

  if((reachPeople * parseInt(data.priority) < parseInt(data.credits))) {
    return res.status(200).json({error: true, message: 'Invalid request'});
  }

  if(!req.body.reqToken || req.body.reqToken.trim() == '') {
    return res.status(200).json({error: 'Invalid request, Required information is missing.'});
  }

  // Validate Token
  var ts = new ValidateService(UserWithdrawal);
  ts.isValid(req.user._id+'', 'payment', req.body.reqToken, function(error, _message) {

    if(error) { return res.status(200).json({ error: _message }); }

    verifyUserCoins(req.user, data, function(err, cbal){
      if (err && err.error) {
        return res.status(200).json({error: true, message: err.message});
      }
      else {
        Campaign.create(data, function(err, campaign) {
          if(err) { return handleError(res, err); }

          var dtcredits = 0;
          if(campaign.credits > 0 && campaign.quality > 0) {
            dtcredits = 0 - ((campaign.credits / campaign.priority) * (campaign.quality / config.dtCreditUnit));
          }
          campaign.update({dtcredits: (-dtcredits)}, function(err, data) {});

          var _Credits = new Credits();
          _Credits.updateCredits(data.userid, {
            silvercoins: (campaign.campaigntype=='text' ? (0 - campaign.credits) : 0),
            goldcoins: (campaign.campaigntype!='text' ? (0 - campaign.credits) : 0),
            silverquantity: 0,
            goldquantity: 0,
            dtcredits: dtcredits
          }, function(err, data) {
            console.log('Credits Info: ', err);
          });

          return res.status(201).json({
            id: campaign._id,
            title: campaign.name,
            description: campaign.description,
            credits: campaign.credits,
            amount: campaign.amount,
            type: campaign.campaigntype
          });
        });
      }
    });
    // if (data.campaigntype == 'fbshare') {
    //   cdt.getGoldCredits(req.user._id+'', function(err, ginfo){
    //     if(err || !ginfo) { return res.status(200).json({error: true, message: 'Unable to verify gold coins'}); }
    //
    //     var totalGoldCoins = ginfo.total;
    //     if(totalGoldCoins > 0 && totalGoldCoins > parseInt(data.credits)){
    //       Campaign.create(data, function(err, campaign) {
    //         if(err) { return handleError(res, err); }
    //
    //         var dtcredits = 0;
    //         if(campaign.credits > 0 && campaign.quality > 0) {
    //           dtcredits = 0 - ((campaign.credits / campaign.priority) * (campaign.quality / config.dtCreditUnit));
    //         }
    //         campaign.update({dtcredits: (-dtcredits)}, function(err, data) {});
    //
    //         var _Credits = new Credits();
    //         _Credits.updateCredits(data.userid, {
    //           silvercoins: (campaign.campaigntype=='text' ? (0 - campaign.credits) : 0),
    //           goldcoins: (campaign.campaigntype!='text' ? (0 - campaign.credits) : 0),
    //           silverquantity: 0,
    //           goldquantity: 0,
    //           dtcredits: dtcredits
    //         }, function(err, data) {
    //           console.log('Credits Info: ', err);
    //         });
    //
    //         return res.status(201).json({
    //           id: campaign._id,
    //           title: campaign.name,
    //           description: campaign.description,
    //           credits: campaign.credits,
    //           amount: campaign.amount,
    //           type: campaign.campaigntype
    //         });
    //       });
    //     }
    //     else {
    //       return res.status(200).json({error: true, message: 'Invalid request Or Coin balance is low'});
    //     }
    //   });
    // }
    // else{
    //   cdt.getSilverCredits(req.user._id+'', function(err, dinfo) {
    //     if(err || !dinfo) { return res.status(200).json({error: true, message: 'Unable to verify silver coins'}); }
    //
    //     var totalSilverCoins = 0;
    //     if(dinfo) {
    //       totalSilverCoins = totalSilverCoins + (dinfo.creditlogs && dinfo.creditlogs[0] && dinfo.creditlogs[0].total ? dinfo.creditlogs[0].total : 0);
    //       totalSilverCoins = totalSilverCoins + (dinfo.viewcampaign && dinfo.viewcampaign[0] && dinfo.viewcampaign[0].count ? dinfo.viewcampaign[0].count : 0);
    //       totalSilverCoins = totalSilverCoins - (dinfo.campaign && dinfo.campaign[0] && dinfo.campaign[0].credits ? dinfo.campaign[0].credits : 0);
    //     }
    //
    //     if(totalSilverCoins > 0 && totalSilverCoins > parseInt(data.credits)) {
    //       Campaign.create(data, function(err, campaign) {
    //         if(err) { return handleError(res, err); }
    //
    //         var dtcredits = 0;
    //         if(campaign.credits > 0 && campaign.quality > 0) {
    //           dtcredits = 0 - ((campaign.credits / campaign.priority) * (campaign.quality / config.dtCreditUnit));
    //         }
    //         campaign.update({dtcredits: (-dtcredits)}, function(err, data) {});
    //
    //         var _Credits = new Credits();
    //         _Credits.updateCredits(data.userid, {
    //           silvercoins: (campaign.campaigntype=='text' ? (0 - campaign.credits) : 0),
    //           goldcoins: (campaign.campaigntype!='text' ? (0 - campaign.credits) : 0),
    //           silverquantity: 0,
    //           goldquantity: 0,
    //           dtcredits: dtcredits
    //         }, function(err, data) {
    //           console.log('Credits Info: ', err);
    //         });
    //
    //         return res.status(201).json({
    //           id: campaign._id,
    //           title: campaign.name,
    //           description: campaign.description,
    //           credits: campaign.credits,
    //           amount: campaign.amount,
    //           type: campaign.campaigntype
    //         });
    //       });
    //     }
    //     else {
    //       return res.status(200).json({error: true, message: 'Invalid request Or Coin balance is low'});
    //     }
    //   });
    // }
  });
};

/**
*  Updates an existing campaign in the DB.
* @function
* @access user
* @param {string} id - url param campaign id
* @param {json} body - updated campaign fields
* @return {json} updated doc
*/
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }

  if(req.body.credits <= 0) {
    return res.status(200).send("Assigned coins can't be less than or equal to zero.");
  }

  Campaign.findById(req.params.id, function (err, campaign) {
    if (err) { return handleError(res, err); }
    if(!campaign) { return res.status(404).send('Not Found'); }

    if(campaign.credits > req.body.credits) {
      return res.status(200).json({error : true, message : "Can't degrade coins once assigned greater coins."});
    }

    if(campaign.expirecredits) {
      return res.status(200).json({message:'This campaign is already viewed by CI users.'});
    }

    if(campaign.priority > req.body.priority) {
      return res.status(200).json({error : true, message : "Priority can't be degrade, once assigned"});
    }

    if(campaign.quality > req.body.quality) {
      return res.status(200).json({error : true, message : "Quality/DT-Credits can't be degrade, once assigned"});
    }

    var newData = req.body, dtcredits = 0, newDtCredits = 0;
    var previousData = {
      credits: campaign.credits,
      priority: campaign.priority,
      quality: campaign.quality,
      dtcredits: campaign.dtcredits
    };

    campaign.update(req.body, function(err, response) {
      if (err) { return handleError(res, err); }

      Campaign.findById(req.params.id, function (err, _campaign) {

        var creditCoins = (previousData.credits - _campaign.credits);
        if(_campaign.credits > 0 && _campaign.quality > 0) {
          var capCredits = (previousData.dtcredits ? (previousData.dtcredits) : 0);
          dtcredits      = ((_campaign.credits / _campaign.priority) * (_campaign.quality / config.dtCreditUnit));
          newDtCredits   = dtcredits;
          dtcredits      = (capCredits - dtcredits);
        }

        _campaign.update({dtcredits: newDtCredits}, function(err, data) {
          if (err) { return handleError(res, err); }

          var _Credits = new Credits();
          _Credits.updateCredits(_campaign.userid, {
            silvercoins: (_campaign.campaigntype=='text' ? creditCoins : 0),
            goldcoins: (_campaign.campaigntype!='text' ? creditCoins : 0),
            silverquantity: 0,
            goldquantity: 0,
            dtcredits: dtcredits
          }, function(err, data) {
            console.log('Credits Update Info: ', err);
          });

          return res.status(200).json(_campaign);
        });
      });
    });
  });
};

/**
*  Campaign action performed. reward incentive to user, update expirecredits for campaign
* @function
* @access user
* @param {string} id - url param campaign id
* @param {json} body - { type : <string> }
* @return {json} updated campaign
*/
exports.updateView = function(req, res) {

  if(req.body._id) { delete req.body._id; }

  Campaign.findOne({"_id": req.params.id+'', 'active': true}, function (err, campaign) {
    if (err) { return handleError(res, err); }
    if(!campaign) { return res.status(404).send('Not Found'); }

    var data = {
      id:req.params.id,
      userid:req.user._id+'',
      viewcount:campaign.priority,
      impression:false,
      logtype : req.body.type,
      expirecredits: parseInt(campaign.expirecredits)
    };

    ViewCampaign.findOne({
      campaignid: campaign._id,
      userid: data.userid,
      impression: data.impression
    }, function(err, viewcampaign) {

      if(err) { return handleError(res, err); }
      if(!viewcampaign) {
        //data.expirecredits = parseInt(campaign.expirecredits) + parseInt(data.viewcount);
        if( req.body.type !== 'view' ){
          data.expirecredits = parseInt(campaign.expirecredits)+parseInt(campaign.priority);
        }

        // If viewcount and campaign credits are equal
        // then no credits are left to show campaign
        // hence campaign become in-active
        if(data.expirecredits >= campaign.credits) {
          data.active = false;
        }

        var currentTime = new Date(),
            expiryTime  = ((req.user.expiryTime && req.user.expiryTime != null) ? (new Date(req.user.expiryTime)) : (new Date(req.user.createdat)));
        var _Credits = new Credits();
        var _Products = new Products();
        var execIncentives = _Products.getExecIncentives( campaign.campaigntype );
        var _data = {
          campaignid: campaign._id,
          userid: data.userid,
          impression: (currentTime.getTime() >= expiryTime.getTime()), // To verify that user view Text Ads after expiry time
          logtype : data.logtype,
          silvercoins: req.body.type === 'view'? 1 : 0,
          goldcoins: req.body.type !== 'view' ? 0.25*execIncentives.low : 0
        };
        var timeFrame = {
          fromDate: new Date(),
          toDate: (new Date()).toISOString()
        };
        timeFrame.fromDate.setTime(timeFrame.fromDate.getTime() - (1*24*60*60*1000));

        _Credits.getGoldCreditsView(data.userid, timeFrame, function(err, gcv){
          // If total gold coins earn is grater then or equal to earning limit make gold earning zero
          if (gcv && gcv.viewcampaign[0] && gcv.viewcampaign[0].total >= config.earnCreditLimit.gold){
            return res.status(200).json({campaign : null, err : 'You have exceeded daily earning limit' });
          }
          else
          {
            // This Block added due to very less Ads are in the system
            ViewCampaign.create({campaignid: campaign._id+'', userid: req.user._id, logtype : _data.logtype,  impression: true}, function(evc, vc) {

              /* Add coins to credits */
              var _Credits = new Credits();
              _Credits.updateCredits(req.user._id, {
                silvercoins: (_data.silvercoins ? parseInt(_data.silvercoins) : 0),
                goldcoins: (_data.goldcoins ? parseInt(_data.goldcoins) : 0),
                silverquantity: 0,
                goldquantity: 0,
                dtcredits: 0
              }, function(err, data) {
                console.log('Credits Info coins added: ', err);
              });


            ViewCampaignLog.create(_data, function(err, __data) {
              console.log('Add User View In ViewCampaignLog: ', err);
              delete data.userid;
              var updated = _.merge(campaign, data);
              updated.save(function (err) {
                if (err) { console.log('[err] While updating campaign in UpdateView', err); }

                ViewCampaignLog.count({
                  userid: req.user._id+'',
                  impression: true,
                  logtype : 'view',
                  createdAt: {"$gt": expiryTime}
                }, function(_e, _d) {

                  // Add expiry time to know user is active or not for revenue share
                  if(_d && _d >= parseInt(config.textAdsDailyLimit)) {
                    var cTime = moment(new Date());
                        cTime.add(24, 'hours');

                    return UserModel.update({
                      _id: Object(req.user._id)
                    }, {
                      "$set": {
                        expiryTime: cTime
                      }
                    }, function(err, _data) {
                      return res.status(200).json({message: 'Updated'});
                    });
                  }
                  else {
                    return res.status(200).json({message: 'Updated'});
                  }
                });
              });

            });
            });
          }
        });

      }
      else {
        return res.status(200).json({message: 'Already updated'});
      }
    });
  });
};

/**
*  Deletes a campaign from the DB.
* @function
* @access user
* @param {string} id - url param campaign id
* @return {string} 'No Content'
*/
exports.destroy = function(req, res) {
  Campaign.findById(req.params.id, function (err, campaign) {
    if(err) { return handleError(res, err); }
    if(!campaign) { return res.status(404).send('Not Found'); }
    campaign.update({active: (campaign.active ? false : true)}, function(err) {
      if(err) { return handleError(res, err); }
      return res.status(204).send('No Content');
    });
  });
};

/**
*  Get remaining coins (silver/gold) for the user
* @function
* @access user
* @return {json} { silverCoins : <number>, goldCoins : <number> }
*/
exports.remainingCredits = function(req, res) {

  var query = {};
  if(req.user.role != 'admin') {
    query.active = true;
    query.userid = req.user._id+''
  }

  var _Credits = new Credits();
  // _Credits.getCredits(req.user._id, function(err, data) {
  //
  //   if(err) { return handleError(res, err); }
  //   return res.status(200).json({
  //     id: req.user._id,
  //     silverCoins: ((data && data.silvercoins) ? (data.silvercoins) : 0),
  //     goldCoins: ((data && data.goldcoins) ? (data.goldcoins) : 0),
  //     dtCredits: ((data && data.dtcredits) ? (data.dtcredits) : 0),
  //     dtCreditUnit: config.dtCreditUnit,
  //     minViewTime: config.minViewTime
  //   });
  // });

  _Credits.getGoldCredits( req.user._id, function(err, ucredit){
    _Credits.getSilverCredits(req.user._id, function(err, data) {
      if(err) { return handleError(res, err); }

      _Credits.getSilverPacks(req.user._id, function(_err, _data) {
        //console.log( "GET CREDITS %j", ucredit.toJSON() );
        if(err) { return handleError(res, err); }
        if(!data) { return res.status(200).json(defResponse); }

        var creditlogs   = data.creditlogs,
            viewcampaign = data.viewcampaign,
            campaign     = data.campaign;

        var clTotal = (creditlogs[0] ? creditlogs[0].total : 0),
            vcTotal = (viewcampaign[0] ? viewcampaign[0].count : 0),
            cTotal  = (campaign[0] ? campaign[0].credits : 0);

        return res.status(200).json({
          id: req.user._id,
          silverCoins: (clTotal + vcTotal - cTotal),
          goldCoins: ucredit ? ucredit.total : 0,
          dtCredits: 0,
          dtCreditUnit: config.dtCreditUnit,
          minViewTime: config.minViewTime
        });
      });
    });
  })
};

/**
*  Get walletinfo for a user
* @function
* @access user
* @param {string} page - query param page to fetch
* @return {json} valid or not
* @see {@link module:creditservice.getWalletInfo }
*/
exports.walletInfo = function(req, res) {
  var _Credits = new Credits();
  var limit = parseInt(config.minPaginationLimit);
  var skip = 0;
  var page = (req.query.page ? (req.query.page * 1) : 1);

  if(page > 1) {
    skip = (limit * (page - 1));
  }

  _Credits.getWalletInfo(req.user._id, skip, limit, function(err, data) {

    if(err) { return handleError(res, err); }
    var totalPurchase = 0,
        totalSpent    = 0,
        totalEarned   = 0,
        totalCoins    = 0,
        rowInfo       = [];

    data.forEach(function(row) {

      rowInfo.push({
        description: row.description,
        coins: row.coins,
        createdAt: row.createdat,
        cointype: row.cointype,
        comment: row.comment
      });

      if(row.coins > 1 && row.description.toLowerCase() == 'purchase credits') {
        totalPurchase = totalPurchase + (row.coins * 1);
      }
      else if(row.coins == 1 && row.description.toLowerCase() == 'view campaign credits') {
        totalEarned = totalEarned + (row.coins * 1);
      }
      else if(row.coins < 1 && row.description.toLowerCase() == 'buy from credits') {
        totalSpent = totalSpent + (row.coins * -1);
      }
    });

    totalCoins = ((totalPurchase + totalEarned) - totalSpent);

    _Credits.getWalletRowsCount(req.user._id, function(err, rows) {

      return res.status(200).json({
        'totalPurchase': totalPurchase,
        'totalSpent': totalSpent,
        'totalEarned': totalEarned,
        'balanceCoins': totalCoins,
        //'rows': rowInfo,
        'data': rowInfo,
        'limit': limit,
        'rows': rows
      });

    });

  });
}
/**
*  Get silver wallet info
* @function
* @access user
* @param {string} page - query param page to fetch
* @return {json} [ docs ]
* @see {@link module:creditservice.getSilverWalletInfo }
*/
exports.silverWalletInfo = function(req, res) {
  var _Credits = new Credits();
  var limit = parseInt(config.minPaginationLimit);
  var skip = 0;
  var page = (req.query.page ? (req.query.page * 1) : 1);

  if(page > 1) {
    skip = (limit * (page - 1));
  }

  _Credits.getSilverWalletInfo(req.user._id, skip, limit, function(err, data) {

    if(err) { return handleError(res, err); }
    var rowInfo = [];

    data.forEach(function(row) {
      rowInfo.push({
        description: 'Purchase Silver Packs',
        coins: row.coins,
        createdAt: row.createdAt,
        cointype: (row.paymode == 'ic' ? 'Gold Coins' : row.paymode),
        status: row.status
      });
    });

    _Credits.getSilverWalletRowsCount(req.user._id, function(err, rows) {
      return res.status(200).json({
        'data': rowInfo,
        'limit': limit,
        'rows': rows
      });
    });
  });
}

/**
*  Get gold coins earned
* @function
* @access user
* @param {string} page - query param page to fetch
* @return {json} [ docs ]
* @see {@link module:creditservice.getEarnedInfoGold }
*/
exports.earnedInfoGold = function(req, res){
  var _Credits = new Credits();
  var limit = 25;
  var skip = 0;
  var page = (req.query.page ? (req.query.page * 1) : 1);

  if(page > 1) {
    skip = (limit * (page - 1));
  }

  _Credits.getEarnedInfoGold(req.user._id, skip, limit, function(err, data) {
    if(err) { return handleError(res, err); }
    var rowInfo = [];
    data.forEach(function(row) {
      var desc = '';
      if(row.logtype == 'fblike'){
        desc = 'Facebook Like';
      } else {
        desc = 'Facebook Share';
      }
      rowInfo.push({
        description: desc,
        coins: row.goldcoins,
        createdAt: row.createdAt
      });
    });

    _Credits.getEarnedInfoGoldRowsCount(req.user._id, function(err, rows) {
      return res.status(200).json({
        'data': rowInfo,
        'limit': limit,
        'rows': rows
      });
    });
  });
}

/**
*  Get gold coins earned
* @function
* @access user
* @param {string} page - query param page to fetch
* @return {json} [ docs ]
* @see {@link module:creditservice.getEarnedInfoGold }
*/
exports.usdTransactionsInfo = function(req, res){
  var _Credits = new Credits();
  var limit = 25;
  var skip = 0;
  var page = (req.query.page ? (req.query.page * 1) : 1);
  var subtype = req.query.subtype;

  if(page > 1) {
    skip = (limit * (page - 1));
  }

  _Credits.getUsdTransactionsInfo(req.user._id, skip, limit, subtype, function(err, data) {
    if(err) { return handleError(res, err); }
    var rowInfo = [];
    data.forEach(function(row) {
      rowInfo.push({
        description: row.description,
        coins: row.coins,
        createdAt: row.createdat,
        type: row.type,
        subtype: row.subtype
      });
    });

    _Credits.getUsdTransactionsRowsCount(req.user._id, subtype, function(err, rows) {
      return res.status(200).json({
        'data': rowInfo,
        'limit': limit,
        'rows': rows
      });
    });
  });
}

/**
*  Get silver coins earned through campaign executions
* @function
* @access user
* @param {number} page - query param page to fetch
* @return {json} [ docs ]
*/
exports.silverEarnedCoins = function(req, res) {
  var limit = parseInt(config.minPaginationLimit);
  var skip = 0;
  var page = (req.query.page ? (req.query.page * 1) : 1);

  if(page > 1) {
    skip = (limit * (page - 1));
  }

  ViewCampaignLog.find({userid: req.user._id+'', logtype : 'view', impression : false })
  .sort({createdAt:-1}).skip(skip).limit(limit).exec(function(err, rows) {
    if(err) { return handleError(res, err); }
    var rowInfo = [];

    rows.forEach(function(row) {
      rowInfo.push({
        description: 'View Text Ads',
        coins: 1,
        createdAt: row.createdAt,
        cointype: 'Earned',
        status: 'COMPLETED'
      });
    });

    ViewCampaignLog.count({userid: req.user._id+'', logtype : 'view' }, function(err, rows) {
      return res.status(200).json({
        'data': rowInfo,
        'limit': limit,
        'rows': rows
      });
    });
  });
}

/**
*  View Text ads paginated list
* @function
* @access user
* @param {number} page - query param page to fetch
* @return {json} [ docs ]
*/
exports.silverTextAdsCreateInfo = function(req, res) {
  var limit = parseInt(config.minPaginationLimit);
  var skip = 0;
  var page = (req.query.page ? (req.query.page * 1) : 1);

  if(page > 1) {
    skip = (limit * (page - 1));
  }

  var query = {userid: req.user._id+'', 'campaigntype':'text'};

  Campaign.find(query)
  .sort({createdat:-1}).skip(skip).limit(limit).exec(function(err, rows) {
    if(err) { return handleError(res, err); }
    var rowInfo = [];

    rows.forEach(function(row) {
      var coins = parseInt(row.credits);
      rowInfo.push({
        name: row.name,
        description: row.description,
        coins: (coins ? (coins * -1) : 0),
        createdAt: row.createdat,
        cointype: 'Silver Coins',
        status: ((parseInt(row.credits) <= parseInt(row.expirecredits) || !coins) ? 'Non Active' : 'Active')
      });
    });

    Campaign.count(query, function(err, rows) {
      return res.status(200).json({
        'data': rowInfo,
        'limit': limit,
        'rows': rows
      });
    });
  });
}

/**
*  Get list of withdrawals
* @function
* @access user
* @param {number} page - query param page to fetch
* @return {json} [ docs ]
* @see @todo
*/
exports.withdrawalInfo = function(req, res) {
  var _Credits = new Credits();
  var limit = parseInt(config.minPaginationLimit);
  var skip = 0;
  var page = (req.query.page ? (req.query.page * 1) : 1);

  if(page > 1) {
    skip = (limit * (page - 1));
  }

  _Credits.getWithdrawalInfo(req.user._id, skip, limit, function(err, data) {

    if(err) { return handleError(res, err); }
    var totalPurchase = 0,
        totalSpent    = 0,
        totalEarned   = 0,
        totalCoins    = 0,
        withdrawalInfo = [],
        admincomments = '';

    data.forEach(function(row) {
      admincomments = '';
      if(row.status == 'COMPLETED') {
        admincomments = row.admincommentcomplete;
      } else if(row.status == 'RETURNED') {
        admincomments = row.admincommentreturn;
      } else if(row.status == 'CANCELLED') {
        admincomments = row.admincommentcancel;
      }
      withdrawalInfo.push({
        _id: row._id,
        createdAt: row.createdat,
        requestedusd: row.requestedusd,
        requestedadscash: row.requestedadscash,
        repurchasedamount: row.repurchasedamount,
        btcamount: row.btcamount,
        adscashcoins: row.adscashcoins,
        withdrawAmount: row.withdrawamount,
        description: row.admincommentcomplete,
        status: row.status,
        transactionid: row.transactionid,
        transferthrough: row.transferthrough,
        creditaccount: row.creditaccount,
        admincomments : admincomments
      });

      // if(row.coins > 1 && row.description.toLowerCase() == 'purchase credits') {
      //   totalPurchase = totalPurchase + (row.coins * 1);
      // }
      // else if(row.coins == 1 && row.description.toLowerCase() == 'view campaign credits') {
      //   totalEarned = totalEarned + (row.coins * 1);
      // }
      // else if(row.coins < 1 && row.description.toLowerCase() == 'buy from credits') {
      //   totalSpent = totalSpent + (row.coins * -1);
      // }
    });
    //totalCoins = ((totalPurchase + totalEarned) - totalSpent);

    _Credits.getWithdrawalRowsCount(req.user._id, function(err, rows) {

      return res.status(200).json({
        'totalPurchase': totalPurchase,
        'totalSpent': totalSpent,
        'totalEarned': totalEarned,
        'balanceCoins': totalCoins,
        //'rows': rowInfo,
        'data': withdrawalInfo,
        'limit': limit,
        'rows': rows
      });

    });
  });

}
/**
*  Get total comission
* @function
* @access user
* @return {json} { totalCoins : <number> }
*/
exports.totalCommissionInfo = function(req, res) {
  var _Credits = new Credits();

  _Credits.getTotalCommission(req.user._id, function(err, data) {
    if(err) { return handleError(err, res); }
    return res.status(200).json({'totalCoins': [{
      "previousDay": (data[0] && data[0].previousDay ? data[0].previousDay : 0),
      "last7Days": (data[0] && data[0].last7Days ? data[0].last7Days : 0),
      "last30Days": (data[0] && data[0].last30Days ? data[0].last30Days : 0),
      "last365Days": (data[0] && data[0].last365Days ? data[0].last365Days : 0),
      "coins": (data[0] && data[0].coins ? data[0].coins : 0)
    }]});
  });
}

/**
*  Get paginated list of comissions
* @function
* @access user
* @param {number} page - query param page to fetch
* @return {json} [ docs ]
*/
exports.commissionInfo = function(req, res) {
  var _Credits = new Credits();
  var limit = parseInt(config.minPaginationLimit);
  var skip = 0;
  var page = (req.query.page ? (req.query.page * 1) : 1);

  if(page > 1) {
    skip = (limit * (page - 1));
  }

  if(req.query.page == null){
    skip = null;
  }

  _Credits.getCommissionInfo(req.user._id, skip, limit, function(err, data) {

    if(err) { return handleError(res, err); }
    var totalPurchase = 0,
        totalSpent    = 0,
        totalEarned   = 0,
        totalCoins    = 0,
        commissionInfo = [];

    data.forEach(function(row) {

      commissionInfo.push({
        wkey: row._id,
        description: row.description,
        coins: row.coins,
        createdAt: row.createdat,
        cointype: row.cointype,
        subtype: row.subtype,
        comment: row.comment
      });

      if(row.coins > 1 && row.description.toLowerCase() == 'purchase credits') {
        totalPurchase = totalPurchase + (row.coins * 1);
      }
      else if(row.coins == 1 && row.description.toLowerCase() == 'view campaign credits') {
        totalEarned = totalEarned + (row.coins * 1);
      }
      else if(row.coins < 1 && row.description.toLowerCase() == 'buy from credits') {
        totalSpent = totalSpent + (row.coins * -1);
      }
    });
    totalCoins = ((totalPurchase + totalEarned) - totalSpent);

    _Credits.getCommissionInfoRowsCount(req.user._id, function(err, rows) {

      return res.status(200).json({
        'totalPurchase': totalPurchase,
        'totalSpent': totalSpent,
        'totalEarned': totalEarned,
        'balanceCoins': totalCoins,
        //'rows': rowInfo,
        'data': commissionInfo,
        'limit': limit,
        'rows': rows
      });

    });
  });
}

/**
*  Get revenue creditlogs paginated entries
* @function
* @access user
* @param {string} page - query param page ref
* @see module:creditservice.getRevenueInfo
*/
exports.revenueInfo = function(req, res) {
  var _Credits = new Credits();
  var limit = parseInt(config.minPaginationLimit);
  var skip = 0;
  var page = (req.query.page ? (req.query.page * 1) : 1);

  if(page > 1) {
    skip = (limit * (page - 1));
  }

  _Credits.getRevenueInfo(req.user._id, skip, limit, function(err, data) {

    if(err) { return handleError(res, err); }
    var totalPurchase = 0,
        totalSpent    = 0,
        totalEarned   = 0,
        totalCoins    = 0,
        revenueInfo = [];

    data.forEach(function(row) {

      revenueInfo.push({
        wkey: row._id,
        description: row.description,
        coins: row.coins,
        createdAt: row.createdat,
        cointype: row.cointype,
        subtype: row.subtype,
        comment: row.comment
      });

      if(row.coins > 1 && row.description.toLowerCase() == 'purchase credits') {
        totalPurchase = totalPurchase + (row.coins * 1);
      }
      else if(row.coins == 1 && row.description.toLowerCase() == 'view campaign credits') {
        totalEarned = totalEarned + (row.coins * 1);
      }
      else if(row.coins < 1 && row.description.toLowerCase() == 'buy from credits') {
        totalSpent = totalSpent + (row.coins * -1);
      }
    });
    totalCoins = ((totalPurchase + totalEarned) - totalSpent);

    _Credits.getRevenueInfoRowsCount(req.user._id, function(err, rows) {

      return res.status(200).json({
        'totalPurchase': totalPurchase,
        'totalSpent': totalSpent,
        'totalEarned': totalEarned,
        'balanceCoins': totalCoins,
        //'rows': rowInfo,
        'data': revenueInfo,
        'limit': limit,
        'rows': rows
      });

    });
  });
}

/**
*  Send campaign view to the client
* @function
*  @todo where is it used ?
* @access user
* @param {string} adsid - url param campaigntype
* @return {html} camapaignView
*/
exports.showAdd = function(req, res) {
  var adId = req.params.adsid;
  Campaign.findById(adId+'', function(err, ads) {

    if(err || !ads) { res.status(200).send(''); }
    if(ads) {

      // if(ads.viewurl && ads.viewurl != '' && ads.viewurl.indexOf('https://') >= 0) {
      //   return res.status(200).send('Visit this URL: ' + ads.viewurl);
      // }

      if(ads.viewurl && ads.viewurl != '') {
        ads.viewurl = ads.viewurl.replace('htt:', 'http:');
        ads.viewurl = ((ads.viewurl.indexOf('://')<0 && ads.viewurl.indexOf(':/')>=0) ? ads.viewurl.replace(':/','://') : ads.viewurl);

        var baseDomain  = ads.viewurl.replace(_url.parse(ads.viewurl).pathname, '');
        var _baseDomain = baseDomain.split('?');
            baseDomain  = _baseDomain[0];
            baseDomain  = ((baseDomain.indexOf('://')<0 && baseDomain.indexOf(':/')>=0) ? baseDomain.replace(':/','://') : baseDomain);

        res.write('<script type="text/javascript">(function(w,d,t,e){var _e=d.createElement(e),_m=d.getElementsByTagName(t),_p=_m[(_m.length-1)],_bpath="'+baseDomain+'";_e.href=_bpath;_p.parentNode.insertBefore(_e,_p);})(window,document,"script","base");</script>');

        // var proxy = ads.viewurl;
        // var agent = new HttpProxyAgent(proxy);

        /* request({ uri: ads.viewurl,
          agent: agent,
          timeout: 10000,
          followRedirect: true,
          maxRedirects: 10
        }).pipe(res).on('error', function(e) {
          res.status(200).send('Please visity URL: ' + ads.viewurl);
        }); */

        request(ads.viewurl).pipe(res).on('error', function(e) {
          res.status(200).send('Please visity URL: ' + ads.viewurl);
        });
      }
      else {
        return res.status(200).send('View URL Not Found');
      }
    }
  })
};

/**
*  Handle operation error by sending back appropriate error(tostring)
* @function
* @access private
* @param {string} res - http response
* @param {string} error - error description
* @return {json} valid or not
*/
function handleError(res, err) {
  return res.status(500).send(err);
}

/**
*  track impressions delivered to user by inserting into viewcampaign
* @function
* @access private
* @param {string} data - list of viewcampaign docs
* @param {string} bulkOperation - add expirecredits into delivered campaigns
* @return {json} callback
*/
function handleImpression(data, bulkOperation, callback) {
  ViewCampaign.create(data, function(err, d) {
    bulkOperation.execute(function(_err, _d) {
      console.log('BuildOperation: ', _err, {
        'Ok':_d.ok,
        'nMatched':_d.nMatched,
        'nModified':_d.nModified,
        'hasWriteErrors':_d.hasWriteErrors(),
        'getWriteErrors':_d.getWriteErrors()
      });
    });
  } );
}

function verifyUserCoins(user, cdata, callback) {
  var errObj = null;
  var cdt  = new Credits();
  if (cdata.campaigntype == 'fbshare' || cdata.campaigntype == 'fblike') {
    cdt.getGoldCredits(user._id + '', function(err, ginfo) {
        if (err || !ginfo) {
          errObj = {
            error: true,
            message: 'Unable to verify gold coins'
          };
        }
        var totalGoldCoins = ginfo.total;
        if (totalGoldCoins > 0 && totalGoldCoins > parseInt(cdata.credits)) {
          errObj = {
            error: false,
            message: ''
          };
        } else {
          errObj = {
            error: true,
            message: 'Invalid request Or Coin balance is low'
          };
        }
        callback(errObj, totalGoldCoins);
      });
    }
    else {
      cdt.getSilverCredits(user._id + '', function(err, dinfo) {
          if (err || !dinfo) {
            errObj = {
              error: true,
              message: 'Unable to verify silver coins'
            };
          }
          var totalSilverCoins = 0;
          if (dinfo) {
            totalSilverCoins = totalSilverCoins + (dinfo.creditlogs && dinfo.creditlogs[0] && dinfo.creditlogs[0].total ? dinfo.creditlogs[0].total : 0);
            totalSilverCoins = totalSilverCoins + (dinfo.viewcampaign && dinfo.viewcampaign[0] && dinfo.viewcampaign[0].count ? dinfo.viewcampaign[0].count : 0);
            totalSilverCoins = totalSilverCoins - (dinfo.campaign && dinfo.campaign[0] && dinfo.campaign[0].credits ? dinfo.campaign[0].credits : 0);
          }
          if (totalSilverCoins > 0 && totalSilverCoins > parseInt(cdata.credits)) {
            errObj = {
              error: false,
              message: ''
            };
          } else {
            errObj = {
              error: true,
              message: 'Invalid request Or Coin balance is low'
            };
          }
          callback(errObj, totalSilverCoins);
        });
      }
    };
