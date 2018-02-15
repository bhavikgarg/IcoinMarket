'use strict';

angular.module('iCoinApp')
  .controller('footer', function($scope, $timeout, Auth, tawkToService, TAWKTO_ID){
    var vm = this;
    //YOUR TAWK.TO ID GOES HERE
    vm.id = TAWKTO_ID;
    vm.visitor = {};
    vm.loaded = false;
    vm.currentUser = null;

    function setVisitor() {
      if(Auth.isLoggedIn() && Auth.getCurrentUser()) {
        vm.currentUser = Auth.getCurrentUser();
        vm.visitor = tawkToService.setVisitor(vm.currentUser.name, vm.currentUser.email);
      }
      else{
          vm.visitor = tawkToService.setVisitor('ngTawkTo Demo User', 'demo@demo.com');
      }
    }


    $scope.$on('TAWKTO:onLoad', function () {
      $scope.$apply(setVisitor);
      vm.loaded = true;
    });
    $scope.year = new Date().getFullYear();

  });
