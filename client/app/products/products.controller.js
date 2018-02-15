'use strict';

angular.module('iCoinApp')
  .controller('ProductsCtrl', function ($scope, Auth, $location) {
    $scope.username = Auth.getCurrentUser();

    $scope.isActive = function(route) {
      return route === $location.path();
    };

    $scope.amount = function(a, b, c){
      console.log(a, b, c);
    };

  });
