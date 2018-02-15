'use strict';

angular.module('iCoinApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('portfoliomanager', {
        url: '/portfoliomanager',
        parent: 'app',
        templateUrl: 'app/portfoliomanager/portfoliomanager.html',
        controller: 'PortfoliomanagerCtrl',
        authenticate: true
      });
  });
