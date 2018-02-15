'use strict';

var mongoose = require('mongoose');
var config   = require('./../server/config/environment');

// Connect to database
mongoose.connect(config.mongo.uri, config.mongo.options);
mongoose.connection.on('error', function(err) {
	console.error('MongoDB connection error: ' + err);
	process.exit(-1);
	}
);

var _                  = require('lodash');
var Users              = require('./../server/api/user/user.model');
var ActivePacks        = require('./../server/api/payment/activesilverpacks.model');
var Payments           = require('./../server/api/payment/payment.model');
var Genealogy          = require('./../server/api/genealogy/genealogy.model');
var GenealogyPurchases = require('./../server/api/utilities/genealogy-purchase.model');

var GenealogyUpdatePacksInfo = function() {

  var _self = this;

  _self.getGoldPacks = function(userIds, cb) {

    return Payments.aggregate([
      {$match: {status:'COMPLETED', active:true, userid: {"$in": userIds}, paymode: {$ne: "ic"}, productid: "gold"}},
      {$group: {_id: "$userid", goldpacks: {$sum: "$quantity"}}}
    ], cb);
  }

  _self.getSilverPacks = function(userIds, cb) {

    return ActivePacks.aggregate([
      {$match: {userid: {"$in": userIds}}},
      {$group: {
        _id: "$userid",
        silverpacks:{"$sum":{"$cond":{if: {$eq: ["$isactive", true]}, then: "$totalpacks", else: 0}}}
      }}
    ], cb);
  }

  _self.updateGenealogy = function(idx, length, data, cb) {

    if(idx < length) {
      var d = data[idx];
      return Genealogy.updatePacksInfo({
        'userId': d._id+'',
        'silverPacks': (d.silverpacks ? d.silverpacks : 0),
        'goldPacks': (d.goldpacks ? d.goldpacks : 0)
      }, function(err, gup) {

        console.log('[info] Worked Index: '+idx, err, gup, "\n\n");
        return _self.updateGenealogy((idx+1), length, data, cb);
      });
    }
    else {
      return cb(false, 'Genealogy Updated....');
    }
  }

  _self.startProcessing = function(userIds, cb) {

    return _self.getGoldPacks(userIds, function(_e, _d) {
      console.log('OK, part 2...');

      return _self.getSilverPacks(userIds, function(__e, __d) {
        var tempObj = {}, finalObj = [];
        _d.forEach(function(d) {
          tempObj[d._id+''] = d;
        });

        __d.forEach(function(n) {
          if(tempObj[n._id+'']) {
            finalObj.push({
              _id: n._id,
              goldpacks: tempObj[n._id].goldpacks,
              silverpacks: n.silverpacks
            });
          }
          else {
            finalObj.push({
              _id: n._id,
              goldpacks: 0,
              silverpacks: n.silverpacks
            })
          }
        });

        console.log('OK, part 3...', userIds.length, _d.length, __d.length, finalObj.length, finalObj);
        return _self.updateGenealogy(0, finalObj.length, finalObj, function(e, d) {
          return cb(e, d);
        });
      });
    });
  }

  _self.updateAll = function(startIndex, limit, cb) {

    Users.count(function(_e, _d) {

      if(!_e && (startIndex < _d)) {

        Users.find({}, '_id').sort({"_id": 1}).skip(startIndex).limit(limit).exec(function(e, d) {

          var userIds = [];
          d.forEach(function(_d) {
            userIds.push(_d._id+'');
          });

          console.log('OK, part 1...');
          return _self.startProcessing(userIds, function(error, data) {

            console.log('[info,err] >>>>> ', error, data);
            return _self.updateAll((startIndex + limit), limit, cb);
          })
        })

      }
      else {
        return cb(_e, 'All Done...');
      }
    });
  }

  _self.updateDirtyUsers = function(cb) {

    GenealogyPurchases.distinct('userid').exec(function(e, d) {

      console.log('OK, part 1...');
      return _self.startProcessing(d, function(error, data) {

        console.log('[info,err] >>>>> ', error, data);
        return GenealogyPurchases.remove({'userid': {"$in": d}}, function(_d) {

          console.log('[info] Old dirty cleared', _d);
          return cb(error, data);
        });
      })
    });
  }

  return {
    updateAll: _self.updateAll,
    execute: _self.updateDirtyUsers
  }
}

// var x = new GenealogyUpdatePacksInfo();
// x.updateAll(0, 1000, function(err, data) {
//   console.log(err, data);
//   process.exit(0);
// });

module.exports = GenealogyUpdatePacksInfo;
