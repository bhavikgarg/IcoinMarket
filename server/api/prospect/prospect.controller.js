'use strict';

var _ = require('lodash');
var Prospect = require('./prospect.model');

// Get list of prospects
exports.index = function(req, res) {
  var page  = req.query.page || 1;
  var limit = 25;
  var skip  = ((page - 1) * limit);
  var query = {userid: req.user._id};
  Prospect.find(query).sort({"_id": -1, "createdAt": -1}).skip(skip).limit(limit).exec(function (err, prospects) {
    if(err) { return handleError(res, err); }

    Prospect.count(query, function(err, count) {
      return res.status(200).json({
        errors: false,
        data: prospects,
        limit: limit,
        rows: count
      });
    })
  });
};

// Get a single prospect
exports.show = function(req, res) {
  Prospect.findOne({
    "_id": req.params.id+'',
    "userid": req.user._id+''
  }, function (err, prospect) {
    if(err) { return handleError(res, err); }
    if(!prospect) { return res.status(200).json({error: true, message: 'No prospect found'}); }
    return res.json({errors: false, data: prospect});
  });
};

// Creates a new prospect in the DB.
exports.create = function(req, res) {
  var _data = [], data = [], postContent = req.body; 
  if(postContent.multiple && req.body.prospects && req.body.prospects.length){
    _data = req.body.prospects;
  }
  else {
    _data.push(req.body);
  }
  // if(!(postContent instanceof Array)) {
  //   _data.push(req.body);
  // }
  // else {
  //   _data = req.body;
  // }
  //return res.status(201).json({error : true});
  data = _.map(_data, function(d) { d['userid'] = req.user._id+''; return d; });
  Prospect.create(data, function(err, prospect) {
    if(err) { return handleError(res, err); }
    return res.status(201).json(prospect);
  });
};

// Updates an existing prospect in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }

  Prospect.findOne({
    "_id": req.params.id,
    "userid": req.user._id+''
  }, function (err, prospect) {
    if (err) { return handleError(res, err); }
    if(!prospect) { return res.status(404).send('Not Found'); }
    var updated = _.merge(prospect, req.body);
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.status(200).json({error: false, data: prospect});
    });
  });
};


function handleError(res, err) {
  console.log('[err] Prospects: ', err);
  return res.status(200).json({error: true, message: err.message });
}
