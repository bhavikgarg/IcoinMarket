'use strict';

angular.module('iCoinApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('dailyTraining', {
        url: '/daily-training',
        templateUrl: 'app/training/daily-training.html',
        controller: 'DailyTrainingCtrl',
        authenticate: false
      })
  });
