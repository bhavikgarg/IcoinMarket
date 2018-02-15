'use strict';

angular.module('iCoinApp')
  .controller('NotificationsCtrl', function ($scope, $http, Auth, $location) {
    $scope.username = Auth.getCurrentUser();

    $scope.isActive = function(route) {
      return route === $location.path();
    };

    $http.get('data.json')
    .then(function(data){
      $scope.data = data.userDetails;
      $scope.notifications = data.userDetails[0].notifications;
    }).error(function(err){
      console.log(err);
    });

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
