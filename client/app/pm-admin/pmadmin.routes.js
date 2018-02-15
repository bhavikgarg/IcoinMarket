'use strict';

angular.module('iCoinApp')
    .config(function($stateProvider) {
        $stateProvider
            .state('pm-admin', {
                templateUrl: 'app/pm-admin/pmadmin-template.html',
                abstract: true
            })
            .state('pmAdmin', {
                url: '/pmadmin',
                parent: 'pm-admin',
                templateUrl: 'app/pm-admin/dashboard/dashboard.html',
                controller: 'PMAdminCtrl',
                authenticate: true
            })
            .state('mydashboard', {
                url: '/mydashboard',
                parent: 'pm-admin',
                templateUrl: 'app/pm-admin/mydashboard/mydashboard.html',
                controller: 'MyDashboardCtrl',
                authenticate: true
            }).state('profitlogsreport', {
                url: '/profitlogsreport',
                parent: 'pm-admin',
                templateUrl: 'app/pm-admin/profitlogsreport/profitlogsreport.html',
                controller: 'ProfitLogsReportCtrl',
                authenticate: true
            });
    });