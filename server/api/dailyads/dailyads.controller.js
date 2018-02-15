'use strict';

var _ = require('lodash');
var DailyAds    = require('./dailyads.model');
var DailyAdDate = require('./dailyadsdates.model');
var Users       = require('./../user/user.model');
var Payment     = require('./../payment/payment.model');
var config      = require('./../../config/environment');
var moment      = require('moment');
var _url        = require('url');
var DailyAdService = require('./../../components/dailyads/dailyads.service');
var ProductService = require('../../components/products/product.service');

// Get list of tasks
exports.index = function(req, res) {

  var query = {};

  if(req.user.role != 'admin') {
    query['active'] = true;
  }

  var viewLimit   = config.minPaginationLimit;
  var currentPage = (req.query.page ? req.query.page : 1);
  var skipRows    = (viewLimit * (currentPage - 1));

  if(req.query.type == 'active') {
    query['$and'] = [
      {'broadcastend': {"$gte": moment().format("YYYY-MM-DD")}},
      {'$or': [{'active': true}, {'active': null}]}
    ];
  }
  else if(req.query.type == 'inactive') {
    query['$or'] = [
      {'broadcastend': {"$lt": moment().format("YYYY-MM-DD")}},
      {'active': false}
    ];
  }

  DailyAds.find(query).sort({
    "broadcaststart": 1,
    "broadcastend": 1,
    "createdAt": 1
  }).limit(viewLimit).skip(skipRows).exec(function(err, data) {

    if(err) {
      return handleError(res, err);
    }

    var paymentIds = [];
    data.forEach(function(d) {
      paymentIds.push(d.purchaseid+'');
    });

    return Payment.find({"_id": {"$in": paymentIds}}, '_id status', function(e, purchase) {

      return DailyAds.count(query, function(err, rows) {
        return res.status(200).json({data: {dailyAds: data, payStatus: purchase}, limit: viewLimit, rows: rows });
      });
    });
  });
};

// Get a single task
exports.show = function(req, res) {
  DailyAds.findById(req.params.id, function (err, task) {
    if(err) { return handleError(res, err); }
    if(!task) { return res.status(404).send('Not Found'); }
    return res.json(task);
  });
};

exports.todaysAd = function(req, res) {
  return DailyAdService.getTodaysAd(function(response) {
    return res.status(200).json(response);
  })
}

exports.dailyAdContent = function(req, res) {
  var query = {
    purchaseid: req.body.pid+''
  };

  if(req.user.role != 'admin') {
    query["userid"] = req.user._id+'';
  }

  DailyAds.findOne(query, function (err, solo) {
    if(err) { return handleError(res, err); }
    if(!solo) { return res.status(404).json({error: true, message: 'No data found'}); }
    return res.json(solo);
  });
};


exports.isBroadcastDateAvailable = function(req, res) {
  return DailyAdService.isBroadcastDateAvailable(req.body, function(response) {
    return res.status(200).json(response);
  });
}


exports.getBookedDates = function(req, res) {
  return DailyAdDate.find({'viewdate': {"$gte": moment().format('YYYY-MM-DD')}}, 'viewdate', function(err, dates) {
    if(err || !dates || dates.length == 0) { return res.status(200).json({"dates": []}); }

    var _dates = [];
    dates.forEach(function(d) {
      _dates.push(d.viewdate);
    });

    return res.status(200).json({"dates": _dates});
  })
}


// Creates a new task in the DB.
exports.create = function(req, res) {

  var content = req.body;

  Payment.findOne({
    "_id": content.purchaseid+'',
    "userid": req.user._id+'',
    "status": "COMPLETED",
    "productid": {"$nin": ["gold", "silver"]},
    "soloemail": true
  }, function(e, d) {

    if(e || !d) { return res.status(200).json({error: true, message: 'Invalid request'}); }

    content.userid = req.user._id;
    content.active = true;
    DailyAds.create(content, function(err, task) {
      var _message = "Validation fail";

      if(err) {
        if(err.errmsg.indexOf('duplicate') >=0 && err.errmsg.indexOf("broadcastdate") >= 0) {
          _message = "Email sending date is already registered by some other user";
        }
        else if(err.errmsg.indexOf('duplicate') >=0 && err.errmsg.indexOf("purchaseid") >= 0) {
          _message = "You have already registered your Soloemail content with us.";
        }

        return res.status(200).json({error: true, "message": _message});
      }

      return res.status(201).json(task);
    });
  });
};

// Updates an existing task in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }

  var contentUrl = _url.parse(req.body.pageurl);
  var ps         = new ProductService();
  return ps.isValidContnetUrl(contentUrl, req.headers['user-agent'], function(response) {
    if(response.valid === true) {
      return DailyAds.findById(req.params.id, function (err, soloemail) {
        if (err) { return handleError(res, err); }
        if(!soloemail) { return res.status(200).json({error: true, message: 'Not Found'}); }
        var updated = _.merge(soloemail, req.body);
        updated.save(function (err) {
          if (err) { return handleError(res, err); }
          return res.status(200).json(soloemail);
        });
      });
    }
    else {
      return res.status(200).json({error: true, message: response.error});
    }
  });
};


exports.updateContent = function(req, res) {

  if(req.body._id) { delete req.body._id; }
  var query = {
    "_id": req.params.id+''
  };

  if(req.user.role != 'admin') {
    query["userid"]  = req.user._id+'';
    query["pageurl"] = 'N/A';
  }

  DailyAds.findOne(query, function (err, soloemail) {
    if (err) { return res.status(200).json({error: true, message: 'Sorry!!! something went wrong, please try after sometime.'}); }
    if(!soloemail) { return res.status(200).json({error: true, message: 'Not Found'}); }

    var contentUrl = _url.parse(req.body.pageurl);
    var ps         = new ProductService();
    return ps.isValidContnetUrl(contentUrl, req.headers['user-agent'], function(response) {
      if(response.valid === true) {
        var updated = _.merge(soloemail, req.body);
        updated.save(function (err) {
          if (err) { return res.status(200).json({error: true, message: ((err.errors && err.errors.pageurl) ? 'Invalid URL, please correct your URL' : 'Sorry!!! unable to add "Daily Login Ad URL", please try after some time')}); }
          return res.status(200).json(soloemail);
        });
      }
      else {
        return res.status(200).json({error: true, message: response.error});
      }
    });
  });
}


// Marked Daily Login Ad as Inactive (i.e. blocked by admin)
exports.destroy = function(req, res) {
  DailyAds.findById(req.params.id, function (err, dailyad) {
    if(err) { return handleError(res, err); }
    if(!dailyad) { return res.status(404).json({error: true, message: 'Not Found'}); }
    dailyad.update({active: false}, function(err) {
      if(err) { return handleError(res, err); }
      return res.status(204).send('No Content');
    });
  });
};

function handleError(res, err) {
  return res.status(500).send(err);
}
