'use strict';

var _ = require('lodash');
var Config = require('./../../config/environment');
var soap   = require('soap');

module.exports = function() {

  var self = this;
  self.getClient = function(callback) {
    soap.createClient(Config.wsdlInfo.url, callback);
  };

  return {

    getInvestmentReport: function(memberId, callback) {

      self.getClient(function(err, client) {
        if(!err) {
          client.GetInvestmentReport({
            MemberId: memberId,
            key: Config.wsdlInfo.key
          }, callback);
        }
        else {
          callback(new Error('Unable to get Investment Information'), null);
        }
      });
    },

    getMaxDistributionPerShare: function(callback) {

      self.getClient(function(err, client) {
        if(!err) {
          client.GetMaxDistributionPerShare({
            key: Config.wsdlInfo.key
          }, callback);
        }
        else {
          callback(new Error('Unable to get Max Distribution Per Share'), null);
        }
      });
    },

    getMemberInvestments: function(memberId, callback) {

      self.getClient(function(err, client) {
        if(!err) {
          client.GetMemberInvestments({
            MemberId: memberId,
            key: Config.wsdlInfo.key
          }, callback);
        }
        else {
          callback(new Error('Unable to get Member Investments Information'), null);
        }
      });
    },

    getVirtualLevelCommission: function(memberId, callback) {
      //Get_Virtual_LevelCommission
      self.getClient(function(err, client) {
        if(!err) {
          client.Get_Virtual_LevelCommission({
            MemberId: memberId,
            key: Config.wsdlInfo.key
          }, callback);
        }
        else {
          callback(new Error('Unable to get Virtual Level Commission'), null);
        }
      });
    },

    memberExists: function(memberId, callback) {
      //Member_Exists
      self.getClient(function(err, client) {
        if(!err) {
          client.Member_Exists({
            MemberId: memberId,
            key: Config.wsdlInfo.key
          }, callback);
        } else {
          callback(new Error('Unable to verify member exists or not'), null);
        }
      });
    },

    registerUser: function(memberData, callback) {
      //Member_Registration
      self.getClient(function(err, client) {
        if(!err) {
          client.Member_Registration({
            SponsorId: memberData.SponsorId,
            MemberId: memberData.MemberId,
            RegistrationDate: memberData.RegistrationDate,
            key: Config.wsdlInfo.key
          }, callback);
        }
        else {
          callback(new Error('Unable to register new user'), null);
        }

      });
    },

    topupMember: function(topupInfo, callback) {
      //Member_Topup
      self.getClient(function(err, client) {
        if(!err) {
          client.Member_Topup({
            MemberId: topupInfo.memberId,
            TotalShares: topupInfo.totalShares,
            PaidAmount: topupInfo.paidAmount,
            ReturnAmount: topupInfo.returnAmount,
            TopupDate: topupInfo.topupDate,
            key: Config.wsdlInfo.key
          }, callback);
        }
        else {
          callback(new Error('Unable to update member investements'), null);
        }
      });
    },

    setMaxDistributionPerShare: function(maxDistributionPerShareValue, callback) {
      //SetMaxDistributionPerShare
      self.getClient(function(err, client) {
        if(!err) {
          client.SetMaxDistributionPerShare({
            MaxDistributionPerShareValue: maxDistributionPerShareValue,
            key: Config.wsdlInfo.key
          }, callback);
        }
        else {
          callback(new Error('Unable to set Max Distribution Per Share'), null);
        }
      });
    }
  }

};
