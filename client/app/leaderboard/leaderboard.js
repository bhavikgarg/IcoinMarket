'use strict';

angular.module('iCoinApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('leaderboard', {
        url: '/leaderboard',
        parent: 'app',
        templateUrl: 'app/leaderboard/leaderboard.html',
        controller: 'LeaderboardCtrl',
        authenticate: true
      });
  });
