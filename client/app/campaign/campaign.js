'use strict';

angular.module('iCoinApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('campaignview', {
        url: '/campaign-view/:type',
        templateUrl: 'app/campaign/campaign.html',
        controller: 'CampaignViewCtrl',
        authenticate: true
      })
      .state('campaignpreview', {
        url: '/campaign-preview/:id',
        templateUrl: 'app/campaign/campaign-preview.html',
        controller: 'CampaignPreviewCtrl',
        authenticate: true
      })
      .state('taskList', {
        url: '/tasks',
        templateUrl: 'app/campaign/task.html',
        controller: 'TaskCtrl',
        authenticate: true
      })
      .state('taskDetail', {
        url: '/task-detail/:taskid',
        templateUrl: 'app/campaign/taskDetail.html',
        controller: 'TaskControlDetail',
        authenticate: true
      });
  });
