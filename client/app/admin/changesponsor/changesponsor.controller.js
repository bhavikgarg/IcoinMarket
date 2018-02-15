'use strict';

angular.module('iCoinApp')
   .controller('ChangeSponsorCtrl', function ($scope, $state, $sce, $cookieStore, $http, $location, $uibModal, $uibModalStack, $timeout, Auth, User, AdminAccess, Utilities) {

    $scope.nextAnchor = 0;
    $scope.prevAnchor = 0;
    $scope.limit = 25;
    $scope.filter = {data: ''};
    $scope.sponsorfrm={email:''};
    AdminAccess.hasAdminAccess();
    $scope.isSoloAddAdmin   = AdminAccess.isSoloAddAdmin;
    $scope.isFinanceAdmin   = AdminAccess.isFinanceAdmin;
    $scope.isWatchUserAdmin = AdminAccess.isWatchUserAdmin;
    $scope.isModeratorAdmin     = AdminAccess.isModeratorAdmin;
    $scope.isSupervisorAdmin    = AdminAccess.isSupervisorAdmin;
    $scope.canSeeUserBackOffice = AdminAccess.canSeeUserBackOffice;

    // Use the User $resource to fetch all users
    $scope.loadPage = function() {
      User.query({limit: $scope.limit, anchorId: $scope.nextAnchor, dataFilter: $scope.filter.data}, function(data) {
        $scope.users = data[0].documents;
        $scope.totalPages = data[0].totalPages;
        $scope.nextAnchor = data[0].nextAnchorId;
        $scope.prevAnchor = data[0].prevAnchorId;

        if(AdminAccess.isWatchUserAdmin()) {
          $timeout(function() {
            $scope.nextAnchor = 0;
            $scope.prevAnchor = 0;
            $scope.filter = {data: ''};
            $scope.loadPage();
          }, 10000);
        }
      });
    };

    $scope.sponsorEdit = function (user) {
      var userId = user;
      $scope.status = false;
      $scope.disableForUser = true;

        User.getById({reference: userId}, function(_data) {
          //console.log(_data);
          $scope.user = _data;
          $scope.userId=user;
        });

        $scope.sponsorfrm={email:'',userEmail:'',userid:''};
        $scope.searchedSponserDetail = false;

      $uibModal.open({
        templateUrl: 'app/admin/changesponsor/sponsoredit.html',
        scope: $scope,
        size: 'md'
      });
    };

    $scope.status=false;
    $scope.userStatus=true;
    $scope.sponsorstatus=false;
    $scope.errorMes='';
    $scope.errorUserMes='';
    $scope.respMessage = '';
    $scope.updateSponser = function(form) {
      //console.log($scope.user.email);
      if(form.$valid) {
        User.changeSponsor({
          email:$scope.sponsorfrm.email,
          userEmail:$scope.user.email,
          userid:$scope.userId
        }, function(result){
          if(result.error) {
            $scope.respMessage = result.message;
          }
          else {
            $uibModalStack.dismissAll();
            $state.reload();
          }
        });
      }
    };

    $scope.disableForUser = true;
    //$scope.searchedSponserDetail = {};
    $scope.verifySponsorEmail = function() {
      User.isSponsorEmail({email: $scope.sponsorfrm.email}, function(response) {
        $scope.validSponsorUser = (response && response.isValid && response.isValid == true);
        $scope.disableForUser   = !$scope.validSponsorUser;
        $scope.userStatus       = true;
        $scope.status           = false;
        $scope.errorMes         = '';
        if($scope.disableForUser) {
          $scope.errorMes = 'Invalid info, Please check sponsor email address.';
          // declare searchedSponserDetails to false
          $scope.searchedSponserDetail = false;
        }
        else{
          $scope.searchedSponserDetail = response.user;
        }
      });
    };

    $scope.reverifySponsor = function() {
      $scope.disableForUser = true;
      $scope.errorMes = '';
    };

    $scope.showSponsorInfo = function (user) {
      var sponsor     = user.sponsor;
      var adminUserId = AdminAccess.getUserId();
      var proxyId     = btoa(user._id + (adminUserId && adminUserId != '' ? ('-' + adminUserId) : ''));
      var proxyUser   = '/api/users/user-proxy?proxyId='+proxyId;
      $scope.status   = false;
      $scope.sponsorstatus =false;
      $scope.checkUserId = AdminAccess.canSeeUserBackOffice;
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
        templateUrl: 'app/admin/changesponsor/sponsorinfo.html',
        scope: $scope,
        size: 'md'
      });
    };

    $scope.loadPage();
  })