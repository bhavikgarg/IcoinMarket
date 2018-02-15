'use strict';

angular.module('iCoinApp')
  .factory('GeneralogyCreate', function($location, $rootScope, $http, User, $cookieStore, GenealogyService) {
    //var currentUser = {};

    return {
      placeInTree: function(signupUser, referenceUser, callback) {
        var cb = callback || angular.noop;

        var userData = {
          'name': signupUser.name,
          'role': 'user',
          'email': signupUser.email,
          'ip': signupUser.ip,
          'countryName': signupUser.countryName,
          'countryCode': signupUser.countryCode,
          'tokenVal': signupUser.token,
          'customSponsor': signupUser.customSponsor,
          'customTarget': signupUser.customTarget
        };

        GenealogyService.place({
          'user': userData,
          'ref': referenceUser
        }, cb);

        /* signupUser.$promise.then(function(data) {
          var userData = {
            'id': data._id,
            'name': data.name,
            'role': data.role,
            'email': data.email,
            'ip': data.ip,
            'countryName': data.countryName,
            'countryCode': data.countryCode
          };
          //console.log('Place in Tree: ');
          GenealogyService.place({
            'user': userData,
            'ref': referenceUser
          }, cb);

        }); */
      },

      listCurrentUserMembers: function(reqData, Auth, callback) {
        var cb = callback || angular.noop;
        //var _self = this;

        Auth.getCurrentUser().$promise.then(function(data) {
          GenealogyService.listView({
            referenceUser: ((typeof reqData.viewMember !== 'undefined' && reqData.viewMember !== '') ? (reqData.viewMember) : data._id),
            listlevel: reqData.level,
            page: reqData.page,
            viewas: reqData.viewAs,
            dir: reqData.dir,
            from: reqData.from || 0,
            to: reqData.to || 0,
            minusers: reqData.minusers || 0,
            maxusers: reqData.maxusers || 0,
            rank: reqData.rank || 0,
            mingoldpacks: reqData.mingoldpacks || 0,
            minsilverpacks: reqData.minsilverpacks || 0,
            maxgoldpacks: reqData.maxgoldpacks || 0,
            maxsilverpacks: reqData.maxsilverpacks || 0,
            dd: (reqData.dd ? (reqData.dd) : 0),
            searchfield: reqData.searchfield || 0,
            search: reqData.search || 0
          }, cb);
        });
      },

      listCurrentUserLevelMembers: function(reqData, Auth, callback) {
        var cb = callback || angular.noop;
        //var _self = this;
        Auth.getCurrentUser().$promise.then(function(data) {

          GenealogyService.levelView({
            referenceUser: ((typeof reqData.viewMember !== 'undefined' && reqData.viewMember !== '') ? (reqData.viewMember) : data._id),
            listlevel: reqData.level,
            page: reqData.page,
            viewas: reqData.viewAs,
            dir: reqData.dir,
            from: reqData.from || 0,
            to: reqData.to || 0,
            minusers: reqData.minusers || 0,
            maxusers: reqData.maxusers || 0,
            rank: reqData.rank || 0,
            mingoldpacks: reqData.mingoldpacks || 0,
            minsilverpacks: reqData.minsilverpacks || 0,
            maxgoldpacks: reqData.maxgoldpacks || 0,
            maxsilverpacks: reqData.maxsilverpacks || 0,
            dd: (reqData.dd ? (reqData.dd) : 0),
            searchfield: reqData.searchfield || 0,
            search: reqData.search || 0
          }, cb);
        });
      },

      exportCurrentUserMembers: function(reqData, Auth, callback) {
        var cb = callback || angular.noop;
        //var _self = this;
        Auth.getCurrentUser().$promise.then(function(data) {

          GenealogyService.exportView({
            sponsor: ((typeof reqData.viewMember !== 'undefined' && reqData.viewMember !== '') ? (reqData.viewMember) : data._id),
            level: reqData.level,
            page: reqData.page,
            limit: reqData.limit,
            viewas: reqData.viewAs,
            dir: reqData.dir,
            from: reqData.from,
            to: reqData.to,
            minusers: reqData.minusers || 0,
            maxusers: reqData.maxusers || 0,
            rank: reqData.rank || 0,
            mingoldpacks: reqData.mingoldpacks || 0,
            minsilverpacks: reqData.minsilverpacks || 0,
            maxgoldpacks: reqData.maxgoldpacks || 0,
            maxsilverpacks: reqData.maxsilverpacks || 0,
            dd: (reqData.dd ? (reqData.dd) : 0)
          }, cb);
        });
      },

      listDirects: function(reqData, callback) {
        var cb = callback || angular.noop;

        GenealogyService.listDirects({
          startDate: reqData.sDate,
          endDate: reqData.eDate,
          type: reqData.reqFor
        }, cb);
      },

      listAllLeaderboardMembers: function(reqData, callback) {
        var cb = callback || angular.noop;

        GenealogyService.listAllTimeDirects({
          startDate: reqData.sDate,
          endDate: reqData.eDate,
          type: reqData.reqFor
        }, cb);
      },

      getMySignupsInfo: function(reqData, callback) {
        var cb = callback || angular.noop;
        GenealogyService.getMySignups(reqData, cb);
      }
    };
  });
