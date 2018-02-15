'use strict';

angular.module('iCoinApp')
    .controller('AdminCtrl', function ($scope, $state, $sce, $cookieStore, $http, $location, $uibModal, $uibModalStack, $timeout, Auth, User, AdminAccess, Utilities, ApiPath) {
        $scope.nextAnchor = 0;
        $scope.prevAnchor = 0;
        $scope.limit = 25;
        $scope.filter = { data: '' };

        AdminAccess.hasAdminAccess();
        $scope.isSoloAddAdmin = AdminAccess.isSoloAddAdmin;
        $scope.isFinanceAdmin = AdminAccess.isFinanceAdmin;
        $scope.isWatchUserAdmin = AdminAccess.isWatchUserAdmin;
        $scope.isModeratorAdmin = AdminAccess.isModeratorAdmin;
        $scope.isSupervisorAdmin = AdminAccess.isSupervisorAdmin;
        $scope.canSeeUserBackOffice = AdminAccess.canSeeUserBackOffice;
        $scope.isRefreshCall = false;

        // Use the User $resource to fetch all users
        $scope.loadPage = function (pageIndex) {
            if ($scope.isRefreshCall && $scope.filter.data !== '') {
                return false;
            }
            $scope.pageId = 1;
            if (pageIndex) {
                $scope.pageId = pageIndex;
            }

            User.query({ limit: $scope.limit, anchorId: $scope.nextAnchor, pageId : $scope.pageId,  dataFilter: $scope.filter.data }, function (data) {
                $scope.users = data[0].documents;
                $scope.totalPages = data[0].totalPages;
                $scope.nextAnchor = data[0].nextAnchorId;
                $scope.prevAnchor = data[0].prevAnchorId;

                if (AdminAccess.isWatchUserAdmin() && $scope.filter.data === '') {
                    $timeout(function () {
                        $scope.nextAnchor = 0;
                        $scope.prevAnchor = 0;
                        //$scope.filter = {data: ''};
                        $scope.isRefreshCall = true;
                        $scope.loadPage();
                    }, 10000);
                }
            });
        };

        $scope.searchUsers = function () {
            $scope.nextAnchor = undefined;
            $scope.loadPage();
        };

        $scope.loadBySearch = function () {
            $scope.isRefreshCall = false;
            $scope.searchUsers();
        };

        $scope.blockUser = function (user) {
            User.remove({ id: user._id, blocked: true }, function () {
                user.isBlocked = true;
            });
        };

        $scope.unblockUser = function (user) {
            User.remove({ id: user._id, blocked: false }, function () {
                user.isBlocked = false;
            });
        };

        $scope.resendActivationLink = function (user) {
            User.sendAgainVerificationLink({
                uname: user.username + '',
                uemail: user.email + ''
            }, function (data) {
                var message = data.error;

                if (data.send) {
                    message = 'Verification link is sent to user';
                }
                alert(message);
            });
        };

        $scope.showUserPages = function (user) {
            if (user.isBlocked || !user.verified) {
                var alertMsg = user.isBlocked ? 'User is blocked, please unblock first.' : 'User is not verified yet.';
                alert(alertMsg);
                return false;
            }
            var adminUserId = AdminAccess.getUserId();
            var proxyId = btoa(user._id + (adminUserId && adminUserId !== '' ? ('-' + adminUserId) : ''));
            var token = $cookieStore.get('token');
            $scope.proxyUser = $sce.trustAsResourceUrl(ApiPath + '/api/users/user-proxy?proxyId=' + proxyId + '&access_token=' + token);
            $cookieStore.put('cipxser', 1);
            $uibModal.open({
                templateUrl: 'app/admin/dashboard/userdashboardbyadmin.html',
                // controller: 'AdminCtrl',
                size: 'lg',
                scope: $scope,
                windowClass: 'large-width',
                backdrop: 'static',
                keyboard: false
            });
        };

        $scope.closeallmodals = function () {
            console.log('Done');
            $uibModalStack.dismissAll();
        };

        $scope.clearClientSession = function () {
            $cookieStore.remove('cipxser');
            User.clearCXView(function () {
                $scope.closeallmodals();
            });
        };

        $scope.showSponsorInfo = function (user) {
            var sponsor = user.sponsor;
            var adminUserId = AdminAccess.getUserId();
            var proxyId = btoa(user._id + (adminUserId && adminUserId !== '' ? ('-' + adminUserId) : ''));
            var proxyUser = '/api/users/user-proxy?proxyId=' + proxyId;

            if (!sponsor) {
                Utilities.getDefaultSponsorInfo(function (data) {
                    User.getById({ reference: data.id }, function (_data) {
                        $scope.sponsor = _data;
                    });
                });
            }
            else {
                User.getById({ reference: sponsor }, function (data) {
                    $scope.sponsor = data;
                });
            }

            // Login agent history
            $http.get(ApiPath + proxyUser, {}).then(function () {
                $cookieStore.remove('cipxser');
                return cb();
            }).error(function (err) {
                $cookieStore.remove('cipxser');
                return cb(err);
            }.bind(this));

            $uibModal.open({
                templateUrl: 'app/admin/dashboard/sponsorinfo.html',
                scope: $scope,
                size: 'md'
            });
        };

        $scope.loadPage();
    })
    .controller('AdminNavigationCtrl', function ($scope, $rootScope, Auth,$state,$location) {
        $scope.getCurrentUser = Auth.getCurrentUser;

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

        $scope.isLoggedIn = Auth.isLoggedIn;
       /* $scope.userRole = function () {
          var user = Auth.getCurrentUser();
          return user.role;
        };*/
        if($(".app-header-navigation").length > 0){
          $("[data-header-navigation-toggle]").on("click",function(){
              $(".app-header-navigation").toggleClass("show");
              return false;
          });

          $(".app-header-navigation li > a").on("click",function(){
              var pli = $(this).parent("li");
              if(pli.find("ul").length > 0 || pli.find(".app-header-navigation-megamenu").length > 0){
                  pli.toggleClass("open");
                  return false;
              }
          });
        }

        $scope.openMenu = function(event){
            angular.element(event.target).parent().toggleClass("open");
        }

         $scope.getClass1 = function (path) {
        return ($location.path().substr(0, path.length) === path) ? 'active-menu' : '';
        }

        $scope.getClass = function (path) {
            return ($state.includes(path)) ? 'active-menu' : '';
      }
  })