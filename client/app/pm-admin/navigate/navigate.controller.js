'use strict';

angular.module('iCoinApp')
.controller('PmNavigationCtrl', function ($scope, $rootScope, Auth,$state,$location) {
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

      $scope.getClass = function (path) {
          return ($state.includes(path)) ? 'active-menu' : '';
      }
      
      $scope.closeMenu = function(){
        angular.element(document.querySelector("#mobile-menu")).toggleClass("show");
      }
})