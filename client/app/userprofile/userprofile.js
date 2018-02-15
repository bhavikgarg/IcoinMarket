'use strict';

angular.module('iCoinApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('userprofile', {
        url: '/userprofile',
        templateUrl: 'app/userprofile/userprofile.html',
        controller: 'UserprofileCtrl',
        authenticate: true
      });
  });
