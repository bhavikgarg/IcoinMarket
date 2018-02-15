'use strict';

angular.module('iCoinApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('genealogy', {
        url: '/myteam/genealogy/grid-view',
        parent: 'app',
        templateUrl: 'app/myteam/genealogy/genealogy.html',
        controller: 'GenealogyCtrl',
        authenticate: true
      })
      .state('genealogyList', {
        url: '/myteam/listview/list-view',
        parent: 'app',
        templateUrl: 'app/myteam/listview/listview.html',
        controller: 'GenealogyListCtrl',
        authenticate: true
      })
      .state('genealogyFront', {
        url: '/myteam/frontview/front-view',
        parent: 'app',
        templateUrl: 'app/myteam/frontview/frontview.html',
        controller: 'GenealogyFrontCtrl',
        authenticate: true
      });
  });
