'use strict';

angular.module('iCoinApp')
    .config(function($stateProvider) {
        $stateProvider
            .state('support-admin', {
                templateUrl: 'app/support/support-template.html',
                abstract: true
            })
            .state('chatBoard', {
                url: '/chatboard',
                parent: 'support-admin',
                templateUrl: 'app/support/dashboard/dashboard.html',
                controller: 'SupportAdminCtrl',
                authenticate: true
            }) 
            .state('signupreport', {
                url: '/signupreport',
                parent: 'support-admin',
                templateUrl: 'app/support/sign-up-report/sign-up-report.html',
                controller: 'SignUpReportCtrl',
                authenticate: true
            })
            .state('supportusersreport', {
                url: '/callers-report',
                parent: 'support-admin',
                templateUrl: 'app/support/support-users-report/support-users-report.html',
                controller: 'SupportUsersReportCtrl',
                authenticate: true
         });

    });