'use strict';

var mongoose         = require('mongoose');
var config           = require('./../server/config/environment');

mongoose.connect(config.mongo.uri, config.mongo.options);
mongoose.connection.on('error', function(err) {
	console.error('MongoDB connection error: ' + err);
	process.exit(-1);
	}
);

var WorkerData       = require('./../server/api/utilities/genealogytreeworkerdata.model');
var GenealogyTree    = require('./../server/api/genealogy/genealogyview.model');
var Users            = require('./../server/api/user/user.model');
var GenealogyModel   = require('./../server/api/genealogy/genealogy.model');
var processInterval  = (process.env.GENEALOGY_TREE_CRON_INTERVAL || (1000));


var GenelaogyViewWorker = function() {

  var _self = this;

  _self.processingLimit = 10;

  _self.defaultRefId = config.sponsorId;

  _self.defaultLevel = 7;

  _self.dataProcessingStatus = 'processing';

  _self.dataProcessedStatus  = 'processed';

  _self.orderDirection = 'DESC';

  // Execution Interval
  _self.interval = processInterval;  // 300000 milliseconds

  _self.treeQuery = 'MATCH (n:ICUser {id: "REFID"}), (n)-[:MEMBER_OF*..LEVEL_NUMBER]->(j) WITH n,j OPTIONAL MATCH (b:ICUser {id: j.id}), (b)-[:MEMBER_OF*..7]->(mem) WITH n,j,b,mem RETURN j.id as member_id, j.sponsor as sponsor_id, j.name as member_name, j.sponsorId as user_sponsor_id, j.sponsorUsername as user_sponsor_name, j.joinat as joinat, j.hpos as member_generation_level, n.hpos as sponsor_generation_level, j.countrycode as country, COUNT(mem) as members_count, j.email as email ORDER BY j.joinat ORDER_DIRECTION';

  // Load worker data
  _self.getWorkerData = function(_callback) {

    WorkerData.findOne({}, _callback);
  };

  _self.saveGenealogyInfo = function(currentUser, data, _callback) {

    if(data && data.length > 0) {

      data.forEach(function(info) {

        GenealogyTree.findOne({
          memberid: info.member_id,
          sponsorid: info.sponsor_id,
          genlevelrefsponsorid: currentUser._id,
          genelevelrefmemberlevel: ((info.member_generation_level*1) - (info.sponsor_generation_level*1)),
        }, function(err, gtd) {

          if(!err && !gtd) {
            GenealogyTree.create({
              memberid: info.member_id,
              membername: info.member_name,
							memberemail: info.email,
              membergenlevel: info.member_generation_level,
              sponsorid: info.sponsor_id,
              sponsorname: info.user_sponsor_name,
              sponsorprofileid: (isNaN(info.user_sponsor_id) ? 0 : info.user_sponsor_id),
              sponsorgenlevel: info.sponsor_generation_level,
              genlevelrefsponsorid: currentUser._id,
              genelevelrefmemberlevel: ((info.member_generation_level*1) - (info.sponsor_generation_level*1)),
              memberjoinat: new Date(info.joinat),
              membercountry: info.country,
              usercount: info.members_count
            }, function(_err, _d) {

              console.log('[info] Adding genealogy tree information in DB: '+info.member_id+', '+info.member_name, _err);
            });
          }

          if(!err && gtd) {
            gtd.update({
              membergenlevel: info.member_generation_level,
              sponsorprofileid: (isNaN(info.user_sponsor_id) ? 0 : info.user_sponsor_id),
              sponsorgenlevel: info.sponsor_generation_level,
              genelevelrefmemberlevel: ((info.member_generation_level*1) - (info.sponsor_generation_level*1)),
              usercount: info.members_count,
							memberemail: info.email
            }, function(_uerr, _ud) {

              console.log('[info] Updating genealogy tree information in DB: '+currentUser.userProfileId+', '+info.member_id+', '+info.member_name, _uerr);
            })
          }

          if(err) {
            console.log('[err] Unable to Add/Update genealogy tree information in DB: '+info.member_id+', '+info.member_name, err);
          }
        });
      });

      _callback();
    }
    else {
      console.log('Nothing to do... ' + currentUser.userProfileId + ', ' + currentUser._id + ', ' + currentUser.name);
      _callback();
    }
  }

  _self.subProcess = function(userInfo, currentIndex, _callback) {
    var totalUsers = userInfo.length;

    if(totalUsers > 0 && currentIndex < totalUsers) {
      var currentUser = userInfo[currentIndex];

      var _query = _self.treeQuery.replace('REFID', currentUser._id);
          _query = _query.replace('LEVEL_NUMBER', _self.defaultLevel);
          _query = _query.replace('ORDER_DIRECTION', _self.orderDirection);

      GenealogyModel.getResponse(_query, function(err, data) {

        _self.saveGenealogyInfo(currentUser, data, function() {

          _self.subProcess(userInfo, (currentIndex + 1), _callback);
        });
      });

    }
    else {

      _callback();
    }
  };

  _self.startProcessing = function(wdata, _callback) {

    Users.find({userProfileId: {$gt: wdata.startafter}})
		.limit(_self.processingLimit)
		.sort({userProfileId: 1})
		.exec(function(err, udata) {

      if(err) {
        console.log('[info] Genealogy Worker, unable to load user information', err);
        process.exit(0);
      }

      if(udata) {

        _self.subProcess(udata, 0, function() {
          if(udata && udata.length > 0) {
            var lastId = udata[(udata.length - 1)].userProfileId;
            _callback(lastId);
          }
          else {
            _callback(1);
          }
        });
      }

      if(!udata) {
        _self.startProcessing({startafter: 1}, _callback);
      }

    })
  };

  // Start worker to process info
  _self.startWorker = function() {

    _self.getWorkerData(function(err, wdata) {

      if(err) {
        console.log('[err] Loading Genealogy Worker Data: ', err)
        return false;
      }

      if(wdata) {

        var laststartat      = new Date(wdata.starttime),
            lastprocessedat  = new Date(wdata.lastprocessedat),
            currentTime      = new Date(),
            lastprocessdalta = (currentTime.getTime() - lastprocessedat.getTime());

        if(wdata.status === _self.dataProcessingStatus) {
          var startDalta = ((currentTime.getTime() - laststartat.getTime()) / (60 * 1000));
          console.log('[info] Genealogy Worker (Data is still processing since: ' + startDalta + ' minutes)');
					process.exit(0);
        }

        if(wdata.status === _self.dataProcessedStatus && lastprocessdalta < _self.interval) {
          var nextStartDalta = ((_self.interval - lastprocessdalta) / 1000);
          console.log('[info] Genealogy Worker will start after: ' + nextStartDalta + ' seconds');
					process.exit(0);
        }

        if(wdata.status === _self.dataProcessedStatus && lastprocessdalta > _self.interval) {

          // Update worker data for status and start time;
          wdata.update({
            status: _self.dataProcessingStatus,
            starttime: (new Date())
          }, function(_err, _data) {
            if(_err) {
              console.log('[err] Worker Data Update Status', _err);
            }
            else {
              console.log('[info] Worker Data Update Status as "Processing"');
            }
          });

          console.log('[info] Starting Genealogy Worker ...');
          _self.startProcessing(wdata, function(lastId) {

            _self.updateWorkerData(lastId, wdata, function() {

              process.exit(0);
            });
          });
        }
      }

      if(!wdata) {
        WorkerData.create({
          startafter: 1,
          starttime: (new Date()),
          status: _self.dataProcessingStatus
        }, function(_err, _data) {
          if(_err) {
            console.log('[err] Worker Data Update Status', _err);
          }
          else {
            console.log('[info] Worker Data Update Status as "Processing"');

            console.log('[info] (No Data Found) Starting Genealogy Worker From Beginning ...');
            _self.startProcessing({startafter: 1}, function(lastId) {
              _self.updateWorkerData(lastId, _data, function() {

                process.exit(0);
              });
            });
          }
        });
      }
    });
  }

  _self.updateWorkerData = function(lastId, wdata, _callback) {

    wdata.update({
      startafter: lastId,
      status: _self.dataProcessedStatus,
      lastprocessedat: (new Date())
    }, function(err, _d) {

      console.log('[info] Genealogy Worker Processing Completed...');
      _callback();
    });
  }

  return {
    execute: _self.startWorker
  };
}

// Kickstart worker
setTimeout(function() {
	var worker = new GenelaogyViewWorker();
	worker.execute();
}, processInterval);
