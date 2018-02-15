'use strict';

var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
var co = require('co');
var config = require('./../server/config/environment');


mongoose.connect(config.mongo.uri, config.mongo.options);
mongoose.connection.on('error', function(err) {
    console.error('MongoDB connection error: ' + err);
    process.exit(-1);
});


var LeaderBoardWorkerData = require('./../server/api/utilities/leaderboardworkerdata.model');
var GenealogyTree = require('./../server/api/user/genealogytree.model');
var Users = require('./../server/api/user/user.model');
var GenealogyModel = require('./../server/api/genealogy/genealogy.model');
var LeaderboardModel = require('./../server/api/utilities/leaderboard.model');

var Leaderboard = function() {

    var _self = this;
    _self.interval = (process.env.LEADERBOARD_CRON_INTERVAL || (15* 60 *1000)); // 300000 milliseconds
    _self.dataProcessingStatus = 'processing';
    _self.dataProcessedStatus = 'processed';
    _self.COMPANY_ID = config.sponsorId;

    _self.processTeam = function(sponsor, processCount, signupat, callback){

        var sponsorId = sponsor;
            /* exit if sponsor is COMPANY_ID*/
            if (sponsorId == _self.COMPANY_ID || processCount > 3) {
              console.log("Process team for company or reached 3rd level limit");
                callback(null, true);
            }
            else
            {
              console.log("Processing leaderboard team for "+sponsorId);
              let query = "MATCH (n:ICUser) WHERE n.id='" + sponsorId + "' RETURN (n)";
              GenealogyModel.getResponse(query, function(err, respData) {
                      if(err || !respData){
                        console.log("[err] Unbale to get data from neo4j "+err);
                      }
                      else {
                        var _createdAt = new Date(signupat);
                            _createdAt = _createdAt.setHours(0,0,0,0);
                        LeaderboardModel.update({
                            memberid: sponsorId,
                            createdat : _createdAt
                        }, {
                            $inc: {
                                members: 1
                            },
                            $set : {
                              country : respData[0] ? respData[0].n.properties.countrycode : 'OTH',
                              membername: respData[0] ? respData[0].n.properties.name : '',
                              createdat : _createdAt
                            }
                        }, {
                            upsert: true
                        }).exec(function(err, lbupdated){
                          if(respData[0] && respData[0].n.properties.sponsor)
                            _self.processTeam(respData[0].n.properties.sponsor, (processCount+1), signupat, function(){
                              callback(null, false)
                            });
                        });
                      }
              });
            }
    };

    _self.processTree = function(data, index, callback){
      var row = data[index];
      if(row){
        if (row.refererid && row.refererid !='undefined' && _self.COMPANY_ID != row.refererid) {
            console.log("Processing Leaderboard tree "+index+" "+row.refererid);
            let query = "MATCH (n:ICUser) WHERE n.id='" + row.refererid + "' RETURN (n)";
            GenealogyModel.getResponse(query, function(err, respData) {
                if (err && !respData) {
                    console.log("[err] Unable to get data from neo4j" + err);
                } else {
                  var _createdAt = new Date(row.signupat);
                      _createdAt = _createdAt.setHours(0,0,0,0);
                    LeaderboardModel.update({
                        memberid: row.refererid,
                        createdat : _createdAt
                    }, {
                        $inc: {
                            members: 1,
                            directs: 1
                        },
                        $set : {
                          country : respData[0] ? respData[0].n.properties.countrycode : 'OTH',
                          membername: respData[0] ? respData[0].n.properties.name : '',
                          createdat : _createdAt
                        }
                    }, {
                        upsert: true
                    }).exec(function(err, lbupdated){
                        if(err){
                            console.log("Unable to update leaderboard data.");
                            callback(err);
                        }
                        else {
                          if(respData[0]){
                              _self.processTeam(respData[0].n.properties.sponsor, 1, row.signupat, function(err, processedTeam){
                                console.log("processed team for "+row.refererid+" is "+processedTeam);
                                _self.processTree(data, (index+1), callback);
                              });
                          }
                          else{
                            callback(null);
                          }
                        }
                    });


                }
            });
        }
        else{
          _self.processTree(data, (index+1), callback);
        }
      }
      else{
          callback(null);
      }
    };

    _self.startProcessing = function(data) {
                if (data) {
                    GenealogyTree.find({
                        treesponsor: {
                            $gt: data.recordid
                        }
                    }).limit(50).exec(function(err, tree){


                    if (tree && tree.length) {
                        _self.processTree(tree, 0, function(err){
                          if(err)
                            console.log("[err] Some thing went wrong"+err);
                          else{
                            console.log(tree[(tree.length-1)]);
                            let lbwdUpdate = LeaderBoardWorkerData.update({}, {recordid: tree[(tree.length-1)].treesponsor, status: _self.dataProcessedStatus, lastprocessedat: (new Date())}, function(err){
                              console.log("Leaderboard processed, All done!!!!");
                              process.exit(0);
                            });
                          }
                        });
                      }
                      else {
                        LeaderBoardWorkerData.update({}, {status: _self.dataProcessedStatus, lastprocessedat: (new Date())}, function(err){
                          console.log("No new users to process, All done!!!!");
                          process.exit(0);
                        });
                      }

                        });
                    }
                    else {
                      console.log("Worker data not found !!!!");
                      process.exit(0);
                    }
    }

    _self.execute = function(cb) {
        co(function*() {
            try {
                let lbworkerdata = yield LeaderBoardWorkerData.findOne();
                if (lbworkerdata) {
                    var laststartat = new Date(lbworkerdata.laststartat),
                        lastprocessedat = new Date(lbworkerdata.lastprocessedat),
                        currentTime = new Date(),
                        lastprocessdalta = (currentTime.getTime() - lastprocessedat.getTime());

                    if (lbworkerdata.status === _self.dataProcessingStatus) {
                        var startDalta = ((currentTime.getTime() - laststartat.getTime()) / (60 * 1000));
                        console.log('[info] Leaderboard Worker (Data is still processing since: ' + startDalta + ' minutes)');
                        process.exit(0);
                    }
                    //
                    if (lbworkerdata.status === _self.dataProcessedStatus && lastprocessdalta < _self.interval) {
                        var nextStartDalta = ((_self.interval - lastprocessdalta) / 1000);
                        console.log('[info] Leaderboard Worker will start after: ' + nextStartDalta + ' seconds');
                        process.exit(0);
                    }

                    if (lbworkerdata.status === _self.dataProcessedStatus && lastprocessdalta > _self.interval) {
                        // Update worker data for status and start time;
                        let updatedlbWorkerData = yield lbworkerdata.update({
                            status: _self.dataProcessingStatus,
                            laststartat: (new Date())
                        });

                        console.log('[info] Starting Leaderboard Worker ...');
                        let processing = _self.startProcessing(lbworkerdata);
                    }

                } else {
                    console.log('[err] Loading Leaderboard Worker Data: ', lbworkerdata)
                        //process.exit(0);
                }
            } catch (err) {
                console.log('Leader worker Error --> ', err);
                //process.exit(0);
            }
        });

    }
    _self.flushLock = function(cb) {
      LeaderBoardWorkerData.update({}, {status: _self.dataProcessedStatus, lastprocessedat: (new Date())}, function(e, d) {
        return cb(e, d);
      })
    };

    return {
        execute: _self.execute,
        flushLock: _self.flushLock
    }
}

module.exports = Leaderboard;

// var leaderboard = new Leaderboard();
// leaderboard.execute();
