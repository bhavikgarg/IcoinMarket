'use strict';

var _ = require('lodash');
var Soloadds = require('./soloadds.model');
var Affiliates = require('./../affiliates/affiliates.model');
var uuid = require('uuid');

// Get list of soloaddss
exports.index = function(req, res) {
  var query = {};
  if(req.user.role == 'user') {
    query['userid'] = req.user._id+'';
  }

  if(req.query.nextid) {
    query['_id'] = { $lt: req.query.nextid+'' };
  }
  if(req.query.previd) {
    query['_id'] = { $gt: req.query.nextid+'' };
  }

  if(req.query.purchaseid) {
    query['purchaseid'] = req.query.purchaseid+''
  }

  Soloadds.find(query).sort({createdat: -1}).exec(function (err, soloaddss) {
    if(err) { return handleError(res, err); }
    if(soloaddss.length == 0) { return res.status(200).json([-1]); }
    return res.status(200).json(soloaddss);
  });
};

// Get a single soloadds
exports.show = function(req, res) {
  Soloadds.findById(req.params.id, function (err, soloadds) {
    if(err) { return handleError(res, err); }
    if(!soloadds) { return res.status(404).send('Not Found'); }
    return res.json(soloadds);
  });
};

// Creates a new soloadds in the DB.
exports.create = function(req, res) {

  Soloadds.findOne({purachseid: req.body.purachseid+''}, function(err, _data) {

    if(!err && !_data) {
      var data = req.body;
      data['userid'] = req.user._id;

      Soloadds.create(data, function(err, soloadds) {
        if(err) { return handleError(res, err); }

        Affiliates.create({
          userid: req.user._id,
          linktype: 'other',
          linkurl: '/link',
          linkname: soloadds.title,
          isactive: true,
          reference: req.user.role,
          target: uuid.v1(),
          landingpage: soloadds.linkurl
        }, function(err, affiliates) {
          console.log('[info] Solo Ads Affiliate is created');

          var _seperator = '?';
          if(soloadds.linkurl.indexOf(_seperator) >= 0) {
            _seperator = '&';
          }

          soloadds.update({
            linkurl: soloadds.linkurl + _seperator + 'ref=' + affiliates.target + '&name=' + encodeURIComponent(affiliates.linkname)
          }, function(err, _ud) {
            console.log('[info] Solo Ads Update for "linkurl"');
          });

        });

        return res.status(201).json(soloadds);
      });
    }

    if(_data) {

      console.log(data);
      return res.status(200).json({error: 'Sorry! you have already created a campaign on this purchase'});
    }

    if(err) {
      return res.status(200).json({error: 'Unable to create your Solo Campaign, Please try after some time'});
    }

  });
};

// Updates an existing soloadds in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  Soloadds.findById(req.params.id, function (err, soloadds) {
    if (err) { return handleError(res, err); }
    if(!soloadds) { return res.status(404).send('Not Found'); }
    var updated = _.merge(soloadds, req.body);
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.status(200).json(soloadds);
    });
  });
};

// Deletes a soloadds from the DB.
exports.destroy = function(req, res) {
  Soloadds.findById(req.params.id, function (err, soloadds) {
    if(err) { return handleError(res, err); }
    if(!soloadds) { return res.status(404).send('Not Found'); }
    soloadds.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.status(204).send('No Content');
    });
  });
};

function handleError(res, err) {
  return res.status(500).send(err);
}
