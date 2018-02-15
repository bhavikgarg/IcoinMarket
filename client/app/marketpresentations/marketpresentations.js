'use strict';

angular.module('iCoinApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('marketpresentations', {
        url: '/marketpresentations',
        templateUrl: 'app/marketpresentations/marketpresentations.html',
        controller: 'MarketpresentationsCtrl',
        authenticate: false
      });
});
