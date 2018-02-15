'use strict';
/**
 * utilities module.
 * @module ci/utilities
 */
var _ = require('lodash');
var path = require('path');
var request = require('request');
var http = require('http');
var mime = require('mime');
var config = require('./../../config/environment');
var User = require('./../user/user.model');
var Affiliate = require('./../affiliates/affiliates.model');
var Genealogy = require('./../genealogy/genealogy.model');
var WSDL = require('../../components/wsdl/mapwsdl.service');
var uuid = require('uuid');
var fs = require('fs');
var json2xls = require('json2xls');
var Countries = require('./countries.model.js');
var Leaderboard = require('./leaderboard.model');
var LeaderboardData = require('./leaderboard.data.model');
var LatestSignup = require('./latestsignups.model');
var Counter = require('./counter.model');
var CurrencyRate  = require('./../payment/currency-rate.model');
var AdvCashWSDL = require('./../../components/wsdl/advcash-wsdl.service');
var PayService  = require('./../../components/payments/pay.service');
var AWS = require('aws-sdk');
AWS.config.region = 'us-east-1';

AWS.config.update({ accessKeyId: config.aws.accessKeyId, secretAccessKey: config.aws.secretAccessKey });
var request = require('request');

// Get list of campaigns
/**
* Get list of genres
* @function
* @return {List<genres>}
*/
exports.genre = function(req, res) {
  return res.status(200).json({genres: config.businessGenre});
};

/**
* Get clientid of social media site
* @function
* @param {string} site - social site name like facebook, google
* @return {json} clientid
*/
exports.clientID = function(req, res) {
  return res.status(200).json({clientid: config[req.params.site].clientID });
};

// Validate sponsor id provided by user is valid or not
// Set cookie for sponsor id to use in future
/**
* Validate sponsor id provided by user
* @function
* @param {object} user - user object in req body which must have sponsor
* @return {json} user
*/
exports.validSponsor = function(req, res) {
  //User.findOne({userProfileId: req.body.sponsor}, function(err, user) {
  User.findOne({username: req.body.sponsor}, function(err, user) {
    if(err || !user) {
      console.log('[info] Unable to validate sponsor by "sponsor id"', err, user);
      return res.status(200).json({user: null});
    }
    else {

      Affiliate.findOne({userid: user._id, isactive: true, linktype: 'default'}, function(err, affiliate) {

        var refUserCode = user._id+'>'+user.name+'>'+user.userProfileId+'>';
        if(err || !affiliate) {
          refUserCode = refUserCode + config.defTarget;
        }
        else {
          refUserCode = refUserCode + affiliate.target;
        }

        // Add username in refUserCode as we validate user by
        // its "username" now onwords; instead of "userProfileId"
        refUserCode = refUserCode + '>' + user.username;

        refUserCode = new Buffer(refUserCode);
        res.cookie('refUser', refUserCode.toString('base64'));
        res.cookie('refUser', refUserCode.toString('base64'), {domain: config.appDomain});
        return res.status(200).json({user: {
          name: (user.name || user.username),
          country: user.countryName,
          id: user.username,
          refUser: refUserCode.toString('base64')
        }});
      });
    }
  });
};

/**
* export data to excel
* @function
* @param {List} data - List of data which need to export
* @desc Get list of data to export and return file if exported successfully
* @return {json} exported or not
*/
exports.export = function(req, res) {

   if(req.body.data && req.body.data.length > 0){
     var xls = json2xls(req.body.data);
     var filename = uuid.v1() + '.xlsx';
     var fd = fs.openSync( filename, 'w');
     fs.writeFile( filename, xls, 'binary');
     res.status(200).json({ success : true, file: filename });
   } else {
     res.status(500).json({ message : 'expecting an array or a object!'});
   }

}


/**
* download file in excel
* @function
* @param {url} file - url of file
* @return {file} file
*/
exports.download = function(req, res) {
  var filename = path.basename(req.params.file);
  var mimetype = mime.lookup(req.params.file);

  res.setHeader('Content-disposition', 'attachment; filename='+filename);
  res.setHeader('Content-type', mimetype);

  var file = fs.createReadStream(req.params.file);

  file.on('close', function() {
    fs.unlink(req.params.file, function(err) { console.log('Export File Dropped: ', err) });
  });

  file.pipe(res);
}

/**
* Get country list contains users in each country
* @function
* @param {object} userId - current logged in userId
* @return {stats} stats
* @see module:genealogyservice.getMemberCountry
*/

exports.getSignupStatistical = function(req, res) {
  Genealogy.getMemberCountry({id: req.user._id}, function(err, data) {
    if(err) {
      console.log('Error: While getting Members Country', err);
      return res.status(200).json({stats: null})
    }

    //console.log(typeof data.forEach);
    var totalUsers = [];
    data = (!data ? [] : data);
    data.forEach(function(info) {
      totalUsers.push({
        "country": (info.country == null ? 'OTH' : info.country),
        "name": (info.name == null ? 'Other' : info.name),
        "users": info.users,
        "flag": config.flagUrl.replace('FLAG_COUNTRY_CODE', (info.country == null || info.country == "" ? 'oth' : info.country.toLowerCase()))
      });
    });

    return res.status(200).json({stats: totalUsers});
  });

}


exports.getLatestSignups = function(req, res) {
  var signups = [] ;
  LatestSignup.find({}).sort({createdat : -1}).limit(20).exec(function(err, _data){
    if(err){
      console.log("[Err] latestSignup :"+err);
      return res.status(200).json({users: [], companySignups: 0});
    }
    else{
        _data.forEach(function(info) {
          signups.push({
            "id" : info._id,
            "userid": info.userid,
            "name": info.name,
            "flag": config.flagUrl.replace('FLAG_COUNTRY_CODE', (info.country == null ? 'oth' : info.country.toLowerCase())),
            "signupDate": info.createdat
          });
        });
        Counter.findOne({id : 'userPId_inc'}, function(err, dd){
          if(err || !dd){
            return res.status(200).json({users: signups, companySignups: 0 });
          }
          else{
            // Get total user count
            User.count().exec(function(err, count){
              if(err){
                console.log("[Err] totallatestSignup :"+err);
                return res.status(200).json({usersCount:  0, users: signups, companySignups: dd.seq });
              } else{
                return res.status(200).json({usersCount:  count, users: signups, companySignups: dd.seq });
              }
            });
          }
        });
    }
  });
}

exports.getCalculatorInfo = function(req, res) {
  var query = {id: req.user._id + '', level: 1};
  Genealogy.getLevelMySignups(query, function(err, response1) {

    query.level = query.level + 1;
    Genealogy.getLevelMySignups(query, function(err, response2) {

      query.level = query.level + 1;
      Genealogy.getLevelMySignups(query, function(err, response3) {

            var resMembers1 = ((response1 && response1[0]) ? (response1[0].members || 0) : 0),
                resMembers2 = ((response2 && response2[0]) ? (response2[0].members || 0) : 0),
                resMembers3 = ((response3 && response3[0]) ? (response3[0].members || 0) : 0);
            res.status(200).json({data: [
              {
                GenerationLevel: 1,
                CurrentRecruits: resMembers1,
                Pack1: ((resMembers1 * 1 * 10) / 100)
              },
              {
                GenerationLevel: 2,
                CurrentRecruits: resMembers2,
                Pack1: ((resMembers2 * 1 * 3) / 100)
              },
              {
                GenerationLevel: 3,
                CurrentRecruits: resMembers3,
                Pack1: ((resMembers3 * 1 * 2) / 100)
              }
            ]});
      });
    });
  })

  /* var _wsdl = new WSDL();
  _wsdl.getVirtualLevelCommission(req.user._id + '', function(err, response) {

    if(!err) {
      return res.status(200).json({data: response});
    }

    res.status(404).json({error: err});
  }) */
}

exports.signupReport = function(req, res) {
  var result = {};
   if(req.query.startDate && req.query.endDate) {
     if (req.query.startDate < config.ICM_PRE_LAUNCH_TIME) {
       req.query.startDate = config.ICM_PRE_LAUNCH_TIME;
     }
     User.aggregate([{"$match" : {
        "createdat": {
            "$gte": (new Date(parseInt(req.query.startDate, 10))),
            "$lt": (new Date(parseInt(req.query.endDate, 10)))
         }
      }},
      {
        '$group' : {
          _id: {
            countryName :"$countryName",
            country : "$countryCode"
          },
          users: {$sum: 1 }
        }
      }
    ]).sort({users: -1}).exec(function(err, data) {
    if (err) {
      return res.status(200).json({error: true, message: err});
    } else {
      if (data.length) {
          var totalUsers = [];
          data = (!data ? [] : data);
          data.forEach(function(info) {
          totalUsers.push({
                    "countryName": (info._id.countryName),
                    "country": (info._id.country == null ? 'OTH' : info._id.country),
                    "users": info.users,
                    "flag": config.flagUrl.replace('FLAG_COUNTRY_CODE', (info._id.country == null || info._id.country == "" ? 'oth' : info._id.country.toLowerCase()))
                  });
        });
       return res.status(200).json({stats: totalUsers});
      } else {
        result.documents = [];
        result.totalPages = 0;
        return res.status(200).json({error: true, message: 'No records found', data: []});
      }
    }
  });
 }
}

/* Allow download instead of view
exports.getSignedUrl = function(req, res){
  var s3 = new AWS.S3();
  var params = {Bucket: config.aws.bucket, Key: req.body.file};
  var filename = path.basename(req.body.file);
  var mimeType = mime.lookup(req.body.file);

  var file = fs.createWriteStream(filename);

  s3.getObject(params).
  on('httpData', function(chunk) { file.write(chunk); }).
  on('httpDone', function() {
    file.end();
    res.status(200).json({url: filename});
  }).
  send();
}

======= */

exports.getSignedUrl = function(req, res){
  var s3 = new AWS.S3();
  var params = {Bucket: config.aws.bucket, Key: req.body.file};
  s3.getSignedUrl('getObject', params, function (err, url) {
    if(err){
      res.status(500).json({err: err});
    }
    res.status(200).json({url: url});
  });
}

exports.saveImage = function(req, res) {
  var dataString = req.body.imageData;
  var matches    = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  var response   = {};

  if (matches.length !== 3)
  {
    var _err = new Error('Invalid input string');
    return res.status(404).json({error: _err});
  }

  response.type = matches[1];
  response.data = new Buffer(matches[2], 'base64');
  response.ext  = matches[1].split('/');
/* Conflict HEAD */

  var _file    = uuid.v1() + '.' + response.ext[1];
  var filename = req.user._id + '/' + _file;
  var s3 = new AWS.S3({params: {Bucket: config.aws.bucket}});

  if(req.body.uploadType && req.body.uploadType === 'banner') {
    filename = 'assets/affiliates/banner/upload/' + _file;
  }

  s3.upload({
    Key: filename,
    Body: response.data,
    ContentType : response.type,
    ACL: req.body.access
  }, function(err, data){
    if(err){
      res.status(500).json({ err: err })
    }
    if(req.body.access == 'private'){
      res.status(200).json({ imagePath : filename})
    } else {
      res.status(200).json({ imagePath : data.Location})
    }
  });

/* Conflict Part 2

  /* var baseImagePath = dataPath+uuid.v1()+'.'+response.ext[1];
  var userUploadedImagePath = __dirname + '/../../../client/'+baseImagePath

  try{
    fs.open(userUploadedImagePath, 'w+', function(err, data) {
      console.log( err );
      if(!err) {
        fs.writeFile(userUploadedImagePath, response.data, function(err, resp) {
          console.log('DEBUG - feed:message: Saved to disk image attached by user:', userUploadedImagePath, err, resp);
          return res.status(200).json({imagePath: baseImagePath});
        });
      }
      else {
        res.status(404).json({error: 'Unable to upload file.'});
      }
    });

  }
  catch(error) {
    return res.status(404).json({error: _err});
  } */
}


exports.getLandingPages = function(req, res) {

  return res.status(200).json({landingPages: config.landingPages});
}


exports.getDefaultSponsor = function(req, res) {

  return res.status(200).json({username: config.sponsorUn, id: config.sponsorId});
}


exports.getISDCodes = function(req, res) {

  Countries.find({}, {"dial_code": true}).sort({'dial_code': 1}).exec(function(err, data) {

    if(err) {
      console.log('Error: While getting ISD Codes', err);
      res.status(200).json({isdCodes: []});
    }

    return res.status(200).json({isdCodes: data});
  });
}

exports.getCountries = function(req, res) {

  Countries.find({}).sort({'name': 1}).exec(function(err, data) {

    if(err) {
      console.log('Error: While getting ISD Codes', err);
      res.status(200).json({countries: []});
    }

    return res.status(200).json({countries: data});
  })
}

exports.getTimeZones = function(req, res) {
    var content = require('./static-data/time-zones.json');
    return res.status(200).json({countryZones: content.countries});
}

exports.getMaxTeamSize = function(req, res) {
    LeaderboardData.findOne({category: 'maxTeamSize'}, function (err, data) {
        if (!err) {
            res.status(200).json({maxTeamSize: {
              last7days: data.last7days,
              last30days: data.last30days,
              allTime: data.allTime,
              flagUrl: data.flagUrl
            }});
        }
    });
}

exports.getMaxDirects = function(req, res) {
    LeaderboardData.findOne({category: 'maxDirects'}, function (err, data) {
        if (!err) {
            res.status(200).json({maxDirects: {
              last7days: data.last7days,
              last30days: data.last30days,
              allTime: data.allTime,
              flagUrl: data.flagUrl
            }});
        }
    });
}

exports.getPackInformation = function(req, res) {
    var info = {
      coins: 0,
      qty: 1,
      price: 0
    };
    if(req.body.type == 'adscash') {
        CurrencyRate.findOne({currency : 'adscash', isactive: true, expireat: null}, function(err, rt){
          if(err || !rt){
            return res.status(200).json({error : true, message : 'Unable to get current adscash rate.' });
          }
          else {
              info = config.packsInfo.adscash;
              info.price = (info.coins*rt.rate);
              return res.status(200).json({error : false, data : info });
          }
        });
    }
    else{
        return res.status(200).json({error : true, message : 'Invalid type.' });
    }
}

exports.getAdvCashTransactionInfo = function(req, res) {

  var wsdlService = new AdvCashWSDL();

  wsdlService.findTransaction(req.body.data, function(err, httpResponse, body) {

    if(err) {
      return res.status(200).json({error: true, message: err});
    }

    return res.status(200).json(httpResponse["return"]);
  })
}

exports.requireSTPInfo = function(req, res) {

  var accountIds = [];

  if(accountIds.indexOf(req.user.email) >= 0 && (!req.user.stp || req.user.stp == null || req.user.stp.trim() == '')) {
    return res.status(200).json({'show': true});
  }

  return res.status(200).json({'show': false});
}

exports.registerSponsorSession = function(req, res) {

  req.session.regenerate(function(err) {
    try {
      req.session["sponsorId"]     = req.body.id;
      req.session["sponsorName"]   = req.body.name;
      req.session["sponsorTarget"] = (req.body.target ? req.body.target : '-');
      console.log(req.session, req.sessionID);
      res.cookie('refby', req.sessionID);
      return res.status(200).json({error: false, message: 'sponor locked'});
    }
    catch (e) {
      return res.status(200).send({error: true, message: 'Unable to register sponor'});
    }
  });
}


exports.productSubTypes = function(req, res) {

  return res.status(200).json({subTypes: config.productSubTypes});
}


exports.staticContent = function(req, res) {

  var content = [];

  if(req.query.type == 'pdf') {

    content = require('./static-data/pdfs-info');
  }
  else if(req.query.type == 'video') {

    var staticVideoFiles = require('./static-data/videos-info');
    if(req.query.subtype && staticVideoFiles[req.query.subtype]) {
      content = {videos: staticVideoFiles[req.query.subtype]}
    }
    else if(req.query.subtype && !staticVideoFiles[req.query.subtype]) {
      content = {videos: []}
    }
    else if(!req.query.subtype) {
      content = staticVideoFiles;
    }
  }

  return res.status(200).json(content);
}


exports.salesInfo = function(req, res) {

  var pageView = req.query.page;
  pageView     = ((pageView >= 1) ? pageView : 1);
  Genealogy.getlistSaleAllUserUpto7Level(req.user._id+'', pageView, function(err, users) {

    if(err || !users || (users && users.length == 0)) {
      return res.status(200).json({error: false, members: []});
    }

    Genealogy.getlistSaleAllUserUpto7LevelCount(req.user._id+'', function(_err, _users) {
      return res.status(200).json({
        error: false,
        members: users,
        limit: parseInt(config.minPaginationLimit),
        rows: ((_users && _users[0] && _users[0].members) ? (_users[0].members) : users.length)
      });
    })
  })
}


exports.salesStats = function(req, res) {

  Genealogy.getSaleMembers(req.user._id+'', function(error, members) {

    var _members = [];
    if(!error) {
      var ps  = new PayService();
      members = members || [];
      members.forEach(function(d) {
        _members.push(d.saleMembers+'');
      });

      // Previous day silver sale
      ps.getSalesByDate(1, _members, 'silver', function(e1, d1) {

        // Last 7 days silver sale
        ps.getSalesByDate(7, _members, 'silver', function(e7, d7) {

          // Last 30 days silver sale
          ps.getSalesByDate(30, _members, 'silver', function(e30, d30) {

            // Last 365 days silver sale
            ps.getSalesByDate(365, _members, 'silver', function(e365, d365) {
              // Previous day gold sale
              ps.getSalesByDate(1, _members, 'gold', function(eg1, g1) {
                // Last 7 days gold sale
                ps.getSalesByDate(7, _members, 'gold', function(eg7, g7) {
                    // Last 30 days gold sale
                  ps.getSalesByDate(30, _members, 'gold', function(eg30, g30) {
                    // Last 365 days gold sale
                    ps.getSalesByDate(365, _members, 'gold', function(eg365, g365) {

                      return res.status(200).json({error: false, sales: {
                        silver : {
                          'lastDay': parseInt((!e1 && d1 && d1.length > 0) ? (d1[0].totalSale) : 0),
                          'last7Days': parseInt((!e7 && d7 && d7.length > 0) ? (d7[0].totalSale) : 0),
                          'last30Days': parseInt((!e30 && d30 && d30.length > 0) ? (d30[0].totalSale) : 0),
                          'last365Days': parseInt((!e365 && d365 && d365.length > 0) ? (d365[0].totalSale) : 0)
                        },
                        gold : {
                          'lastDay': parseInt((!eg1 && g1 && g1.length > 0) ? (g1[0].totalSale) : 0),
                          'last7Days': parseInt((!eg7 && g7 && g7.length > 0) ? (g7[0].totalSale) : 0),
                          'last30Days': parseInt((!eg30 && g30 && g30.length > 0) ? (g30[0].totalSale) : 0),
                          'last365Days': parseInt((!eg365 && g365 && g365.length > 0) ? (g365[0].totalSale) : 0)
                        }
                      }});

                    });
                  });
                });
              });


            });
          });
        });
      });
    }
    else {
      return res.status(200).json({error: false, sales: {
        'lastDay': 0, 'last7Days': 0, 'last30Days': 0, 'last365Days': 0
      }});
    }
  });
}

exports.getPaypalAccount = function(req, res){
  return res.status(200).json({account: config.paypalAccount});
}


exports.getCryptoData = function(req, res) {
  var limit = req.params.limit;
  // request call
  var config = {
        url: 'http://api.coinmarketcap.com/v1/ticker/?limit='+limit,
        headers: {'Content-Type': 'application/json'}
      };

  request.get(config,
      function(err, httpResp, response) {
        if(err === null){
         if(httpResp.statusCode != 200){
                  console.log("Error in getting coin data from cryptocoinmarketcap.com"+err);
                  return res.status(httpResp.statusCode).json({error:true, data:'Error in getting coin data from cryptocoinmarketcap.com'})
                }
                else{
                  console.log("Successfully got the coin data from cryptocoinmarketcap.com" +httpResp.statusCode);
                  return res.status(200).json({error : false, data: JSON.parse(response)});
                }
        }
        else{
          console.log("Error in getting coin data from cryptocoinmarketcap.com. Error occured");
          return res.status(520).json({error : false, data: 'Error in getting coin data from cryptocoinmarketcap.com. Error occured'});
        }
  })
}

exports.getCryptoChartData = function(req, res) {
    var config = {
        url: 'https://graphs.coinmarketcap.com/currencies/' + req.query.currency + '/' + req.query.starttime + '/' + req.query.endtime,
        headers: {
            'Content-Type': 'application/json'
        }
    };
    request.get(config, function(err, httpResp, body) {
        if (err === null) {
            if (httpResp.statusCode != 200) {
                console.log("Error in getting chart data from cryptocoinmarketcap.com" + err);
                return res.status(httpResp.statusCode).json({
                    error: true,
                    data: 'Error in getting chart data from cryptocoinmarketcap.com'
                })
            } else {
                console.log("Successfully got the chart data from cryptocoinmarketcap.com" + httpResp.statusCode);
                return res.status(200).json({
                    error: false,
                    data: JSON.parse(body)
                });
            }
        } else {
            console.log("Error in getting chart data from cryptocoinmarketcap.com. Error occured");
            return res.status(520).json({
                error: false,
                data: 'Error in getting chart data from cryptocoinmarketcap.com. Error occured'
            });
        }
    })

}
