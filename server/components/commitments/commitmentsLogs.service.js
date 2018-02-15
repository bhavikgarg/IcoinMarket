'use strict';

var _ = require('lodash');
var CommitmentsLogs = require('../../api/commitments/commitments-logs.model');

module.exports = function() {
  var commitmentsLogsService = {
    addTradeLog: function(userid, logsInfo, callback) {
      CommitmentsLogs.create({
        commitmentid: logsInfo.commitmentid,
        status: logsInfo.status,
        description: logsInfo.description || '',
        createdby :userid,
      }, callback);
    },
    getOnTradeAmount: function (userid, callback) {
      return Credits.findOne({userid: userid+''}, callback);
    },
  };
  return commitmentsLogsService;
};
