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
    //var timeDiffSec = null;
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
  .controller('HeaderCtrl', function ($scope,$rootScope, $state, $http, $location, $uibModal, $uibModalStack, $timeout, $interval, $window, Auth, User, MessageService, LaunchDate, Utilities, Purchase, PacksInfo, Tasks, TaskTimer) {
    $scope.sponsor = {};
    $scope.showDefaultTask = false;
    $scope.showtime =false;
    // $scope.endTime='July 29, 2017 00:00:00';
    // $scope.username = Auth.getCurrentUser();
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

    $scope.$on('top-six-currency-data', function ($event, data){
        $scope.cryptoCurrencydata=data;
        $scope.headerLimit = 6;
    });

    $scope.closeallmodals = function(){
      $uibModalStack.dismissAll('Sponsor Message Page');
      $state.go('sponsorMessage');
    };
    $scope.closeModal= function(){
      $uibModalStack.dismissAll('Sponsor Message Page');
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

    $scope.getClass1 = function (path) {
    return ($location.path().substr(0, path.length) === path) ? 'active-menu' : '';
    }

    $scope.getClass = function (path) {
    return ($state.includes(path)) ? 'active-menu' : '';
    }

    $scope.closeMenu = function(){       
        angular.element(document.querySelector("#mobile-menu")).removeClass("show");
    }

  $scope.showSponsorInfo = function (user) {
    var sponsor = user.sponsor;
    if (!sponsor) {
      Utilities.getDefaultSponsorInfo(function (data) {
        User.getById({ reference: data.id }, function (_data) {
          $scope.sponsor = _data;
        });
      });
    } else {
      User.getById({ reference: sponsor }, function (data) {
        $scope.sponsor = data;
      });
    }

    $uibModal.open({
      templateUrl: 'app/userprofile/my-sponser-info.html',
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
        $scope.purchaseInfo.adscash = data;
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
    }

    // $scope.$on('message-read', function(){
    //   $scope.getMessageInfo();
    // });
        var countDownDate = new Date("August 31, 2017 00:00:00").getTime();
        var currentDate = new Date().getTime();
      // Update the count down every 1 second
      if(currentDate < countDownDate){
        $scope.showtime =true;
          var interval = $interval(function() {
              // Get todays date and time
              var now = new Date().getTime();
              // Find the distance between now an the count down date
              var distance = countDownDate - now;
              // Time calculations for days, hours, minutes and seconds
              $scope.days = Math.floor(distance / (1000 * 60 * 60 * 24));
              $scope.hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
              $scope.mins = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
              $scope.secs = Math.floor((distance % (1000 * 60)) / 1000);
              var newCurrentDate = new Date().getTime();
              if(newCurrentDate > countDownDate){
                $scope.showtime =false;
                $interval.cancel(interval);
              }
          }, 1000);
        }
        else{
            $scope.days = 0;
            $scope.hours = 0;
            $scope.mins = 0;
            $scope.secs = 0;
       }

        $scope.$on('$destroy', function (event) {
            $interval.cancel(interval);
        });
  });
