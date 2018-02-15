'use strict';

angular.module('iCoinApp')
  .service('MessageActions', function(Auth) {
    return {
      markDelete: function(msgId, msgService, callback) {
        msgService.trashMessage({id: msgId}, callback);
      },

      markSpam: function(msgId, msgService, callback) {
        msgService.updateFlags({_id: msgId, isspam: true}, callback);
      },

      markImportant: function(msgId, msgService, callback) {
        msgService.updateFlags({_id: msgId, impmessage: true}, callback);
      },

      markViewed: function(msgId, msgService, callback) {
        msgService.updateFlags({_id: msgId, isview: true}, callback);
      },

      getTeamMembers: function(req, gService, callback) {
        gService.listCurrentUserMembers({
          level: 1,
          page: req.page,
          viewMember: '',
          viewAs: 'list',
          dir: 'DESC',
          from: '',
          to: '',
          dd: -1,
          searchfield: req.searchfield,
          search: req.search
        }, Auth, callback);
      }
    };
  })
  .controller('MessageListCtrl', function ($scope, $location, $stateParams, $rootScope, Purchase, Cache, GeneralogyCreate, MessageService,Auth) {
    $scope.msgType = $stateParams.listType.toLowerCase(); //'inbox';
    $scope.pageTitle = 'Message ' + $scope.msgType.toUpperCase();
    $scope.sentType = ($scope.msgType === 'sent' ? 1 : 0);
    $scope.currentPage = 1;
    $scope.total = 0;
    $scope.search = '';
    $scope.showLoadingMessage = false;
    $scope.urlPage = window.location.hash;
    $scope.getmessages = function(skip, limit, search, pageView){
      $scope.error = '';
      $scope.showLoadingMessage = true;
      var rootPage   = $rootScope.messageListPage;
      var pageShould = (rootPage && pageView ? rootPage.split('-') : [$scope.msgType, $scope.currentPage]);
      var viewPage = skip;
      if(pageShould[0] === $scope.msgType){
        viewPage = pageShould[1];
      }

      MessageService.get({type: $scope.msgType, skip: viewPage, search:search, limit: limit}, function(response) {
        $scope.messages = response.messages;
        $scope.total = response.total;
        $scope.limit = response.limit;
        //Get total Pages
        if(response.total > $scope.limit){
          $scope.pages = Math.ceil(response.total/$scope.limit);
        }
        $scope.showLoadingMessage = false;
        if(pageShould[0] === $scope.msgType){
          $scope.currentPage = (pageView ? pageShould[1] : $scope.currentPage);
        }else{
          $scope.currentPage = 1;
        }
        $rootScope.messageListPage = $scope.msgType+'-'+$scope.currentPage;
      });
    };

    $scope.searchFilter = function(skip, limit, search) {
      $scope.getmessages(skip, limit, search);
    };

    $scope.getmessages($scope.currentPage, $scope.limit, $scope.search, true);

    // Go to Specific Page
    $scope.updatePage = function() {
      if($scope.getPage) {
        if($scope.getPage > $scope.pages) {
          $scope.error = 'Page not found';
        }else {
          $scope.error = '';
          $scope.currentPage = $scope.getPage;
          $scope.getmessages($scope.currentPage, $scope.limit);
        }
      }
    };

    $scope.viewMessage = function(key, sentType) {
      var messageId = $scope.messages[key].messageId;
      $location.path('/teamcommunication/view/'+messageId+'/'+sentType);
    };

    $scope.usd_balance = Cache.get("usd_balance");
    if (!$scope.usd_balance) {
        Purchase.getPurchasedPacksInfo(function(data) {
            Cache.put("usd_balance", data.usd);
            $scope.usd_balance = data.usd;
        });
    }

  Auth.getCurrentUser().$promise.then(function(_user) {
          $scope.data     = _user;
          $scope.userId   = _user._id;
          $scope.userinfo = _user;
          $scope.userinfo.avatar = (_user.avatar);
          $scope.avatarImage = $scope.userinfo.avatar;
          // var _stdcode = $scope.userinfo.mobile;
          // _stdcode = _stdcode ? (_stdcode+'').split('-') : '';
          // $scope.stdcode = (_stdcode.length > 1 ? _stdcode[0] : '+');
          // $scope.userinfo.mobile = (_stdcode.length > 1 ? (_stdcode[1] * 1) : (_stdcode[0] * 1));

          // if(_user.categories && _user.categories[0] === -1) {
          //   $scope.userinfo.categories = $scope.genres.map(function(item) { return item.key; });
          // }
        });
  });
