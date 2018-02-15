'use strict';

angular.module('iCoinApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('soloadds', {
        url: '/soloadds',
        templateUrl: 'app/soloadds/soloadds.html',
        controller: 'SoloaddsCtrl',
        authenticate: true
      });
  });
