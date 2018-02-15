/**
 * Task module.
 * @module ci-server/task-controller
 */
'use strict';

var _ = require('lodash');
var Task = require('./task.model');
var TaskDoneLog = require('./taskdonelog.model');
var CampaignLog = require('./../campaign/viewcampaignlog.model');
var ViewCampaignLog = require('./../campaign/viewcampaignlog.model');

// Get list of tasks
exports.index = function(req, res) {

  var query = {};

  if(req.user.role != 'admin') {
    query['active'] = true;
  }

  var viewLimit   = 25;
  var currentPage = (req.query.page ? req.query.page : 1);
  var skipRows    = (viewLimit * (currentPage - 1));

  Task.find(query).sort({"createdat": -1}).limit(viewLimit).skip(skipRows).exec(function(err, data) {

    if(err) {
      return handleError(res, err);
    }

    Task.count(query, function(err, rows) {

      return res.status(200).json({data: data, limit: viewLimit, rows: rows });
    });
  });
};

// Get a single task
exports.show = function(req, res) {
  Task.findById(req.params.id, function (err, task) {
    if(err) { return handleError(res, err); }
    if(!task) { return res.status(404).send('Not Found'); }
    return res.json(task);
  });
};

// Creates a new task in the DB.
exports.create = function(req, res) {
  Task.create(req.body, function(err, task) {
    if(err) { return handleError(res, err); }
    return res.status(201).json(task);
  });
};

// Updates an existing task in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  Task.findById(req.params.id, function (err, task) {
    if (err) { return handleError(res, err); }
    if(!task) { return res.status(404).send('Not Found'); }
    var updated = _.merge(task, req.body);
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.status(200).json(task);
    });
  });
};

// Deletes a task from the DB.
exports.destroy = function(req, res) {
  Task.findById(req.params.id, function (err, task) {
    if(err) { return handleError(res, err); }
    if(!task) { return res.status(404).send('Not Found'); }
    task.update({active: false}, function(err) {
      if(err) { return handleError(res, err); }
      return res.status(204).send('No Content');
    });
  });
};

exports.userDoTask = function(req, res) {

  TaskDoneLog.findOne({
    userid: req.user._id+'',
    taskid: req.body.taskid+'',
    exuserid: req.body.exuserid+'',
    exusername: req.body.exusername+''
  }, function(err, tdl) {

    if(err) { return handleError(res, err); }

    if(tdl) { return res.status(200).json({error: 'You have already done this task'}); }

    if(!tdl) {
      var data = req.body;
          data['userid'] = req.user._id;

      TaskDoneLog.create(data, function(_err, task) {
        if(_err) { return handleError(res, _err); }

        CampaignLog.create({
          userid: req.user._id,
          campaignid: task._id,
          impression: false,
          logtype: 'task'
        }, function(__err, tcl) {

          if(__err) { console.log('[err] Unable to save info in Campaign Log For Task Done by User', __err); }

          return res.status(201).json(task);
        });
      });
    }
  });
};

/**
* Get user task details
* @function
* @param {number} type - query param text/fbshare, default 'text'
* @access user
* @return {json} { daylimit : <max>, viewed : <count> }
*/
exports.getUserTasks = function(req, res) {
  //
  // TaskDoneLog.find({userid: req.user._id + ''}, function(err, tdl) {
  //
  //   if(err) { return handleError(res, err); }
  //
  //   var doneTaskId = [];
  //   if(tdl && tdl.length > 0) {
  //
  //     tdl.forEach(function(_tdl) {
  //       doneTaskId.push(_tdl.taskid);
  //     });
  //   }
  //
  //   Task.find({active: true, _id: {$nin: doneTaskId}}).sort({'createdat': -1}).limit(25).exec(function(_err, _task) {
  //
  //     if(_err) { return handleError(res, _err); }
  var logtype = req.query.type || 'view'; // text => view
  if( logtype === 'text' )
    logtype = 'view';

  var daylimits = {
    view : 10,
    fbshare : 20
  };

  var currentTime = new Date();
	var minTime     = new Date();
	    minTime.setDate(minTime.getDate() - 1);

	ViewCampaignLog.count({
    createdAt: {$gte: minTime, $lt: currentTime},
    userid: req.user._id+'',
    logtype : logtype
	}, function(_err, _data) {
    return res.status(200).json({data: [], textAds: {
      daylimit: daylimits[logtype],
      viewed: _data
    }});
  });
  //
  //     // return res.status(200).json({data: _task});
  //   });
  //
  // });
}

function handleError(res, err) {
  return res.status(500).send(err);
}
