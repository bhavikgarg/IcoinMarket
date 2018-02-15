'use strict';

var _ = require('lodash');
var SoloEmail = require('./soloemails.model');
var Users     = require('./../user/user.model');
var Payment   = require('./../payment/payment.model');
var config    = require('./../../config/environment');
var moment    = require('moment');

// Get list of tasks
exports.index = function(req, res) {

  var query       = {};
  var viewLimit   = config.minPaginationLimit;
  var currentPage = (req.query.page ? req.query.page : 1);
  var skipRows    = (viewLimit * (currentPage - 1));

  if(req.user.role != 'admin') {
    query['active'] = true;
  }

  if(req.query.type == 'active') {
    query['$and'] = [
      {'broadcastdate': {"$gte": moment().format("YYYY-MM-DD")}},
      {'$or': [{'active': true}, {'active': null}]}
    ];
  }
  else if(req.query.type == 'inactive') {
    query['$or'] = [
      {'broadcastdate': {"$lt": moment().format("YYYY-MM-DD")}},
      {'active': false}
    ];
  }

  SoloEmail.find(query).sort({"broadcastdate": 1, "createdAt": 1})
  .limit(viewLimit).skip(skipRows).exec(function(err, data) {

    if(err) {
      return handleError(res, err);
    }

    var paymentIds = [];
    data.forEach(function(d) {
      paymentIds.push(d.purchaseid+'');
    });

    return Payment.find({"_id": {"$in": paymentIds}}, '_id status', function(e, purchase) {
      return SoloEmail.count(query, function(err, rows) {

        return res.status(200).json({data: {soloEmails: data, payStatus: purchase}, limit: viewLimit, rows: rows });
      });
    });
  });
};

// Get a single task
exports.show = function(req, res) {
  SoloEmail.findById(req.params.id, function (err, task) {
    if(err) { return handleError(res, err); }
    if(!task) { return res.status(404).send('Not Found'); }
    return res.json(task);
  });
};

exports.getBlockedDates = function(req, res) {
  return SoloEmail.find({broadcastdate: {"$gte": moment().format('YYYY-MM-DD')}}, 'broadcastdate', function(err, dates) {
    if(err || !dates || dates.length == 0) { return res.status(200).json({"dates": []}); }

    var _dates = [];
    dates.forEach(function(d) {
      _dates.push(d.broadcastdate);
    });

    return res.status(200).json({"dates": _dates});
  });
}

exports.emailContent = function(req, res) {
  var query = {
    purchaseid: req.body.pid+''
  };

  if(req.user.role != 'admin') {
    query["userid"] = req.user._id+'';
  }

  SoloEmail.findOne(query, function (err, solo) {
    if(err) { return handleError(res, err); }
    if(!solo) { return res.status(404).json({error: true, message: 'No data found'}); }
    return res.json(solo);
  });
};


exports.isBroadcastDateAvailable = function(req, res) {
  var reqDate = new Date(req.body.dt);

  if(reqDate != 'Invalid Date') {
    return SoloEmail.count({broadcastdate: moment(reqDate).format('YYYY-MM-DD')}, function(e, d) {
      console.log(d, e);
      if(e || d >= 1) { return res.status(200).json({valid: false}); }
      res.status(200).json({valid: true});
    });
  }
  else {
    return res.status(200).json({valid: false});
  }
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
    SoloEmail.create(content, function(err, task) {
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
  SoloEmail.findById(req.params.id, function (err, soloemail) {
    if (err) { return handleError(res, err); }
    if(!soloemail) { return res.status(200).json({error: true, message: 'Not Found'}); }
    var updated = _.merge(soloemail, req.body);
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.status(200).json(soloemail);
    });
  });
};


exports.updateContent = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  var query = {
    "_id": req.params.id+'',
    "subject": "Provide a 'cAtChY' subject line to attract eyeballs",
    "content": "Please provide content for the Email body. Include your contact details and website / link of your offer"
  };

  if(req.user.role != 'admin') {
    query["userid"] = req.user._id+'';
  }

  SoloEmail.findOne(query, function (err, soloemail) {
    if (err) { return handleError(res, err); }
    if(!soloemail) { return res.status(200).json({error: true, message: 'Not Found'}); }
    var updated = _.merge(soloemail, req.body);
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.status(200).json(soloemail);
    });
  });
}


// Deletes a task from the DB.
exports.destroy = function(req, res) {
  SoloEmail.findById(req.params.id, function (err, soloemail) {
    if(err) { return handleError(res, err); }
    if(!soloemail) { return res.status(404).json({error: true, message: 'Not Found'}); }
    soloemail.update({active: false}, function(err) {
      if(err) { return handleError(res, err); }
      return res.status(204).send('No Content');
    });
  });
};

function handleError(res, err) {
  return res.status(500).send(err);
}
