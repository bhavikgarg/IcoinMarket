'use strict';

angular.module('iCoinApp')
  .service('PacksInfo', function(Purchase){
    var x = {};

    return {
      getPurchase: function(pType, _callback) {
        if(typeof x.silver === 'undefined' || typeof x.silver === null) {
          Purchase.getPurchasedPacksInfo({type: pType}, function(err, resp) {
            x = resp;
            _callback(err, resp);
          });
        }
        else {
          _callback(null, x);
        }
      },

      getPackPurchase: function(reqData, _callback){
        var cb = _callback || angular.noop;
        Purchase.getPackInfo(reqData, cb);
      },

      getPurchaseSilver: function(reqData, _callback){
        var cb = _callback || angular.noop;
        Purchase.getSilverInfo(reqData, cb);
      },
    };
  })
  .service('TaskTimer', function(User) {
    // /var timeDiffSec = null;
    return {
      getExpiryTime: function(callback) {
        // Auth.getCurrentUser().$promise.then(function(data) {
        User.getExpiryTime(function(data) {
          if(data.expiryTime){
            var nextViewTime = moment(data.expiryTime),
                currentTime  = moment(data.currentTime);
            callback(parseInt(nextViewTime.diff(currentTime, 'seconds')));
          } else {
            callback(-1);
          }
        });
      }
    };
  })
  .service('SponsorVerifier', function(User) {
    return {
      verifyIfno: null,
      validateSponsor: function(callback) {
        var _self = this;
        if(!_self.verifyIfno || _self.verifyIfno.error) {
          return User.verifySponsor(function(data) {
            _self.verifyIfno = data;
            callback(data);
          });
        }
        return callback(_self.verifyIfno);
      }
    };
  })
  .controller('AdminHeaderCtrl', function ($scope,$rootScope, $state, $http, $location, $uibModal, $uibModalStack, $timeout, $window, Auth, User, MessageService, LaunchDate, Utilities, Purchase, PacksInfo, Tasks, TaskTimer) {
    $scope.sponsor = {};
    $scope.showDefaultTask = false;
    $scope.username = Auth.getCurrentUser();
    $scope.userRole = $scope.username.role;
    $scope.getCurrentUser = Auth.getCurrentUser;

    if(!sessionStorage.weakPassword){
      $scope.weakPassword = false;
    }else{
      $scope.weakPassword = sessionStorage.weakPassword;
    }

    if(Auth.getCurrentUser().$promise) {
      Auth.getCurrentUser().$promise.then(function(_user) {
        $scope.data = _user;
        $rootScope.memberInfo = _user;
        $scope.userRole = _user.role;
        $scope.headerAvatar = (_user.avatar) ? _user.avatar : 'assets/images/user/no-image.png';
        $rootScope.memberInfo.avatar = (_user.avatar) ? _user.avatar : 'assets/images/user/no-image.png';
        $rootScope.memberInfo.name=_user.name;
      });
    }

    $scope.cryptoHeaderData = function() {
      Utilities.getCryptoData({limit : 10},function(response) {
        $scope.cryptoCurrencydata = response.data;
        $scope.headerLimit = 6;
      });
    };

    $scope.cryptoHeaderData();

   /* $scope.showData = function() {
      console.log("nbhbjkcbjdbdivkvvk");
      alert("bjfbvbfjvfbvfv");
    };*/

    $scope.closeMenu = function(){
        angular.element(document.querySelector("#mobile-menu")).removeClass("show");
    }

    $scope.closeallmodals = function(){
      console.log('Done');
      $uibModalStack.dismissAll('Sponsor Message Page');
      $state.go('sponsorMessage');
    };
    $scope.closeModal= function(){
      $modalStack.dismissAll('Sponsor Message Page');
    };

    $scope.closeModal = function() {
      $uibModalStack.dismissAll();
    };

    $scope.sponsorModal = function () {
      var sponsor = $scope.data.sponsor;

      if(!sponsor) {
        Utilities.getDefaultSponsorInfo(function(data) {
          User.getById({reference: data.id}, function(_data) {
            $scope.sponsor = _data;
          });
        });
      }
      else {
        User.getById({reference: sponsor}, function(data) {
          $scope.sponsor = data;
        });
      }

      $uibModal.open({
          templateUrl: 'app/dashboard/sponsorinfo.html',
          scope: $scope,
          size: 'md'
      });
    };

    $scope.menu = [{
      'title': 'Home',
      'link': '/'
    }];

    $scope.purchaseInfo = {
      gold: {},
      silver: {}
    };

    $scope.totalMessages = 0;
    $scope.messages = [];
    $scope.totalTasks = 1;
    $scope.tasks = [];
    $scope.isCollapsed = true;
    $scope.isLoggedIn = Auth.isLoggedIn;
    $scope.isAdmin = Auth.isAdmin;
    $scope.getCurrentUser = Auth.getCurrentUser;
    $scope.adcCirculation = {circulation : 0, current_price : 0, next_price : 0};

    $scope.logout = function() {
      sessionStorage.clear();
      Auth.logout();
    };

    $scope.isActive = function(route) {
      return route === $location.path();
    };

    $scope.getPacks = function(){
      PacksInfo.getPurchase('adscash', function(data) {
        $scope.purchaseInfo['adscash'] = data;
      });
      // PacksInfo.getPurchase('gold', function(data) {
      //   $scope.purchaseInfo['gold'] = data;
      // });
      TaskTimer.getExpiryTime(function(data) {
        $scope.seconds = data;
      });
    };

    $scope.config = {
      autoHideScrollbar: false,
      theme: 'light',
      advanced:{
        updateOnContentResize: true
      },
      setHeight: 200,
      scrollInertia: 0,
      axis: 'y'
    };

    // $scope.getMessageInfo = function() {
    //   MessageService.get({
    //     type:'inbox',
    //     isView:false
    //   }, function(data) {
    //     $scope.totalMessages = ((data.total && data.total > 0) ? data.total : 0);
    //     $scope.messages = data.messages;
    //   });
    // };

    $scope.startTimer = function (LaunchDate) {
      var currentDate = new Date(), launchDate  = new Date(LaunchDate);
      $scope.countdownVal = parseInt((launchDate.getTime() - currentDate.getTime()) / 1000);
      $scope.$broadcast('timer-start');
      $scope.timerRunning = true;
    };

    $scope.startTimer(LaunchDate);

    $scope.sponsorInfo = function(data) {
      $scope.sponsor = data;
    };

    $scope.getUserTasks = function() {
      Tasks.getUserTaks(function(info) {
        $scope.tasks = info.data;
        $scope.totalTasks += info.data.length;
        $scope.showDefaultTask = ((info.textAds.daylimit - info.textAds.viewed) > 0);
      });
    };

    $scope.timeDiffSec = {};
    $scope.getNextTask = function() {
      TaskTimer.getExpiryTime(function(data) {
        $scope.timeDiffSec.seconds = data;
      });
    };

    $scope.userLoggedIn = false;
    if(Auth.isLoggedIn()) {
      //$scope.getNextTask();
      //$scope.getUserTasks();
      // $scope.getMessageInfo();
      $scope.userLoggedIn = true;
      /*Get current circulation */
      Purchase.getCurrentCirculation(function(result){
          if(!result.error){
              $scope.adcCirculation = result.data;
          }
      });
    }

    // $scope.$on('message-read', function(){
    //   $scope.getMessageInfo();
    // });

  });

