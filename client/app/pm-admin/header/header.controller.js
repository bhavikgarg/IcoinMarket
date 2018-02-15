'use strict';

angular.module('iCoinApp')
    .controller('PMHeaderCtrl', function($scope, User, Auth, Utilities, $rootScope, $cookies, AdminAccess, $cookieStore, $sce, ApiPath, $uibModal, $uibModalStack,ConfigurationService) {

        $scope.sponsor = {};
        $scope.showDefaultTask = false;
        $scope.username = Auth.getCurrentUser();
        $scope.userRole = $scope.username.role;
        $scope.getCurrentUser = Auth.getCurrentUser;
        $scope.user ={};


        if (Auth.getCurrentUser().$promise) {
            Auth.getCurrentUser().$promise.then(function(_user) {
                $scope.data = _user;
                $rootScope.memberInfo = _user;
                $scope.userRole = _user.role;
                $scope.headerAvatar = (_user.avatar) ? _user.avatar : 'assets/images/user/no-image.png';
                $rootScope.memberInfo.avatar = (_user.avatar) ? _user.avatar : 'assets/images/user/no-image.png';
                $rootScope.memberInfo.name = _user.name;
            });
        }

        $scope.getCurrentUser = Auth.getCurrentUser;

        $scope.openMenu = function(){
          angular.element(document.querySelector(".app-header-navigation")).toggleClass("show");
        }

        $scope.logout = function() {
            sessionStorage.clear();
            $rootScope.memberInfo = {};
            Auth.logout();
        };

        $scope.getUserIpInfo = function() {
            var userInfo = $cookies.get('country_info');
            if (userInfo) {
                var userIPInfo = (userInfo ? JSON.parse(atob(userInfo)) : {});                
                $scope.user.timeZone = (userIPInfo.time_zone ? userIPInfo.time_zone : '');
            } else {
                setTimeout($scope.getUserIpInfo, 2000);
            }
        };

        $scope.getUserIpInfo();

        $scope.openTimeSettingPopUp = function() {
            $scope.getSupportTime();
            var modalInstance = $uibModal.open({
                templateUrl: 'app/support/dashboard/setTime.html',
                controller: 'SupportHeaderCtrl',
                scope: $scope,
                windowClass: 'large-width',
                backdrop: 'static',
                keyboard: false
           });
        };

         $scope.closeModal = function() {
            $uibModalStack.dismissAll();
         };


        $scope.getCountries = function(callback) {
            Utilities.getCountries(function(data) {
                $scope.countryList = data.countries;
            });
        };

        $scope.getCountries();

        /*Time Zone*/
        $scope.getTimeZones = function(){
        Utilities.getTimeZones({countryCode: $scope.supportUser.timeZoneCountry},function(data) {
            $scope.timezones = data.countryZones[$scope.supportUser.timeZoneCountry].zones;
            }, function(err){
                console.log("Error occured in getting timeZone: "+JSON.stringify(err));
            });
        };
      
       $scope.updateSupportTime = function () {
             ConfigurationService.updateConfig({key: 'supportHours', value : $scope.supportUser},function (data){
                 if(data.message="updated")
                 {
                   $uibModalStack.dismissAll();   
                 }
             });
       };

        $scope.getSupportTime = function(){
          ConfigurationService.getConfig({key: 'supportHours'},function(data) {
              if(data.value)
              {
                   $scope.supportUser = {
                    startHour: new Date(data.value.startHour),
                    endHour: new Date(data.value.endHour),
                    timeZoneCountry: data.value.timeZoneCountry,
                    timezone: data.value.timezone,
               };
               $scope.getTimeZones(data.value.timeZoneCountry);
              }
              else
              {
                    $scope.supportUser = {
                      startHour: new Date(1970, 0, 1, 10, 0, 0),
                      endHour: new Date(1970, 0, 1, 20, 0, 0)
                  };
              }
          });
       };
    
    });