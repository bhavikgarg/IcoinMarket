'use strict';

angular.module('iCoinApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('admin.adminUsers', {
          url: '/administrations/admin-users',
          templateUrl: 'app/admin/administrations/admin-users/admin-users.html',
          controller: 'AdminUsersCtrl',
          authenticate: true
      })
      .state('admin.compOffUsers', {
          url: '/administrations/comp-off-users',
          templateUrl: 'app/admin/administrations/comp-off-users/comp-off-users.html',
          controller: 'CompOffUsersCtrl',
          authenticate: true
      })
      .state('admin.topCommissionUsers', {
        url: '/administrations/top-commission-users',
        templateUrl: 'app/admin/administrations/top-commission-users/top-commission-users-list.html',
        controller: 'TopCommissionUsersCtrl',
        authenticate: true
     })
  });