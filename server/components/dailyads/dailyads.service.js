'use strict';

var DailyAds    = require('./../../api/dailyads/dailyads.model');
var DailyAdDate = require('./../../api/dailyads/dailyadsdates.model');
var Purchase    = require('./../../api/payment/payment.model');
var moment      = require('moment');

var DailyAdsService = function() {

  var _self = this;

  _self.isAvailable = function(data, cb) {
    var reqSDate = new Date(data.sdt);
    var reqEDate = new Date(data.edt);

    if(reqSDate != 'Invalid Date' && reqEDate != 'Invalid Date') {
      return DailyAdDate.count({
        "$and": [
          {viewdate: {"$gte": moment(data.sdt).format('YYYY-MM-DD')}},
          {viewdate: {"$lte": moment(data.edt).format('YYYY-MM-DD')}},
        ]
      }, function(e, d) {
        console.log(d, e);
        if(e || d >= 1) { return cb({valid: false}); }
        cb({valid: true});
      });
    }
    else {
      return cb({valid: false});
    }
  }

  _self.lockDailyAdsViewDates = function(purchaseId, cb) {

    return DailyAds.findOne({"purchaseid": purchaseId+''}, function(e, d) {
      if(e || !d) { console.log('[err] Unable to lock Daily Ads Date'); return cb(); }
      return d.update({'expireAt': null}, function(_e, _d) {
        if(_e) { console.log('[err] Unable to lock Daily Ads Date'); return cb(); }

        return DailyAdDate.update({"adid": d._id+''}, {"expireAt": null}, {"multi": true}, function(__e, __d) {
          console.log('Lock Daily Ads Date:', __e, __d);
          return cb();
        });
      });
    });
  }

  _self.getTodaysAd = function(cb) {
    var _now = moment().format('YYYY-MM-DD');

    // Load today's ad information ad id
    return DailyAdDate.findOne({viewdate: _now}, function(e, d) {
      if(e || !d) { return cb({error: true, message: 'No "Login Ad" found for today'}); }

      // Verify and load Daily Login Ad Page Url
      return DailyAds.findById(d.adid+'', function(_e, _d) {
        if(_e || !_d) { return cb({error: true, message: 'No "Login Ad" found for today'}); }

        // Verify, Ad should have a valid pageurl and must be active (i.e. not blocked by admin)
        if(_d && (_d.pageurl == 'N/A' || _d.active == false)) { return cb({error: true, message: 'No "Login Ad" found for today'}); }

        // Verify Payment must status must be COMPLETED
        return Purchase.findOne({"_id": _d.purchaseid+'', "status": "COMPLETED", "active": true}, function(__e, __d) {
          if(__e || !__d) { return cb({error: true, message: 'No "Login Ad" found for today'}); }
          return cb({error: false, pageUrl: _d.pageurl});
        });
      });
    });
  }

  _self.createDailyAd = function(data, cb) {
    var sdate  = new Date(data.broadcaststart);
    var edate  = new Date(data.broadcastend);
    var _now   = new Date();
    var _sdate = parseInt(moment(data.broadcaststart).format('YYYYMMDD'));
    var _ndate = parseInt(moment().add(1, 'day').format('YYYYMMDD'));
    var _edate = parseInt(moment(data.broadcastend).format('YYYYMMDD'));

    if(sdate != 'Invalid Date' && edate != 'Invalid Date' && _sdate >= _ndate && _edate >= _ndate && _edate >= _sdate) {

      _self.isAvailable({sdt: data.broadcaststart, edt: data.broadcastend}, function(resp) {
        if(resp.valid === true) {
          DailyAds.create({
            "userid": data.userid,
            "broadcaststart": moment(data.broadcaststart).format('YYYY-MM-DD'),
            "broadcastend": moment(data.broadcastend).format('YYYY-MM-DD'),
            "purchaseid": data.username+'-'+_now.getTime(),
            "pageurl": "N/A"
          }, function(_e, _d) {

            if(_e || !_d) {
              var _message = "Validation fail";

              if(_e && _e.errmsg) {
                if(_e.errmsg.indexOf('duplicate') >=0 && _e.errmsg.indexOf("broadcaststart") >= 0) {
                  _message = "Ooops!!! 'Daily Login Ad' start date is already booked. Please choose different start date.";
                }
                if(_e.errmsg.indexOf('duplicate') >=0 && _e.errmsg.indexOf("broadcastend") >= 0) {
                  _message = "Ooops!!! 'Daily Login Ad' end date is already booked. Please choose different end date.";
                }
              }
              else if(!_e && !_d) {
                _message = 'Unable to take request now, please try after some time';
              }

              return cb({error: true, "message": _message});
            }

            var bulkOperation = [];
            while(moment(data.broadcastend).diff(moment(data.broadcaststart), 'days') >= 0) {

              bulkOperation.push({
                adid: _d._id+'', viewdate: moment(data.broadcaststart).format('YYYY-MM-DD'), viewlink: 'N/A'
              });

              data.broadcaststart = moment(data.broadcaststart).add(1, 'day');
            }

            DailyAdDate.create(bulkOperation, function(__e, __d) {
              console.log(__e, __d, ' >>>> ');
              if(__e) {
                return _d.remove(function(e, d) {
                  return cb({error: true, message: 'Unable to take request now, please try after some time'});
                });
              }
              return cb({error: false, data: _d});
            });
          });
        }
        else {
          return cb({error: true, message: 'Ooops!!! "Daily Login Ad" date is already booked. Please choose another date range sloat.'});
        }
      });
    }
    else {
      return cb({error: true, message: 'Ooops!!! "Daily Login Ad" display dates are invalid.'});
    }
  }

  return {
    "create": _self.createDailyAd,
    "isBroadcastDateAvailable": _self.isAvailable,
    "lockDailyAdsViewDates": _self.lockDailyAdsViewDates,
    "getTodaysAd": _self.getTodaysAd
  }
}


module.exports = new DailyAdsService();
