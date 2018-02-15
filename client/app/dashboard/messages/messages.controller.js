'use strict';

angular.module('iCoinApp')
  .controller('MessagesCtrl', function ($scope, $http, Auth, $location) {
    $scope.username = Auth.getCurrentUser();

    $scope.isActive = function(route) {
      return route === $location.path();
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

  });
