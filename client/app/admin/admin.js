'use strict';

angular.module('iCoinApp')
    .config(function($stateProvider) {
        $stateProvider
            .state('admin', {
                url: '/admin',
                templateUrl: 'app/admin/admin.html',
                abstract: true
            })
            .state('admin.dashboard', {
                url: '/dashboard',
                templateUrl: 'app/admin/dashboard/dashboard.html',
                controller: 'AdminCtrl',
                authenticate: true
            })
            .state('admin.adminuseredit', {
                url: '/user/:id',
                templateUrl: 'app/admin/edituser.html',
                controller: 'AdminEditUserCtrl',
                authenticate: true
            })
            .state('admin.admin_products', {
                url: '/products',
                templateUrl: 'app/products/admin/list.html',
                controller: 'AdminProductsCtrl',
                authenticate: true
            })
            .state('admin.admin_productcreate', {
                url: '/product/create',
                templateUrl: 'app/products/admin/create.html',
                controller: 'AdminProductCreateCtrl',
                authenticate: true
            })
            .state('admin.admin_productedit', {
                url: '/product/:id',
                templateUrl: 'app/products/admin/create.html',
                controller: 'AdminProductEditCtrl',
                authenticate: true
            })

            .state('admin.admin_affilatebanners', {
                url: '/affiliates/banner',
                templateUrl: 'app/admin/affiliates-banners/create-banner.html',
                controller: 'AdminAffilateBannersCtrl',
                authenticate: true
            })
            .state('admin.admin_affilatebannerslist', {
                url: '/affiliates/banners',
                templateUrl: 'app/admin/affiliates-banners/banners-list.html',
                controller: 'AdminAffilateBannersListCtrl',
                authenticate: true
            })

            .state('admin.admin_details', {
                url: '/soloadds',
                templateUrl: 'app/soloadds/admin/index.html',
                controller: 'AdminSoloAddList',
                authenticate: true
            })
            .state('admin.bankWire', {
                url: '/bank-wire/:status',
                templateUrl: 'app/products/admin/bank_wire.html',
                controller: 'BankWireListsCtrl',
                authenticate: true
            })
            .state('admin.tasks', {
                url: '/tasks',
                templateUrl: 'app/admin/task_list.html',
                controller: 'TasksCtrl',
                authenticate: true
            })
            .state('admin.AdvCashPendingPayments', {
                url: '/advcash/pendings',
                templateUrl: 'app/admin/advcashpending-approval.html',
                controller: 'AdvCashPendingPaymentsCtrl',
                authenticate: true
            })
            .state('admin.AgentLogs', {
                url: '/agent-logs',
                templateUrl: 'app/admin/agent-history/agent-history.html',
                controller: 'AgentLogCtrl',
                authenticate: true
            })
            .state('admin.updateCurrencyRate', {
                url: '/update-currency-rate',
                templateUrl: 'app/admin/update-currency-rate.html',
                controller: 'updateCurrencyRateCtrl',
                authenticate: true
            })
            .state('admin.RevenueShareCutOf', {
                url: '/revenue-cutof',
                templateUrl: 'app/admin/revenue-cutof.html',
                controller: 'RevenueShareCutOfCtrl',
                authenticate: true
            })
            .state('admin.ChangeSponsor', {
                url: '/sponsor',
                templateUrl: 'app/admin/changesponsor/change-sponsor.html',
                controller: 'ChangeSponsorCtrl',
                authenticate: true
            })
            .state('admin.AdminKyc', {
                url: '/kyc',
                templateUrl: 'app/admin/admin-kyc.html',
                controller: 'AdminKycCtrl',
                authenticate: true
            })
            .state('admin.TextAdsModerate', {
                url: '/text-ads',
                templateUrl: 'app/admin/text-ads-moderate.html',
                controller: 'AdminTextAdsModerate',
                authenticate: true
            })
            .state('admin.SoloEmailState', {
                url: '/soloemails',
                templateUrl: 'app/admin/soloemail.html',
                controller: 'SoloemailAdminCtrl',
                authenticate: true
            })
            .state('admin.DailyLoginAdState', {
                url: '/dailyads',
                templateUrl: 'app/admin/dailyads.html',
                controller: 'DailyAdsAdminCtrl',
                authenticate: true
            })
            .state('admin.paypal', {
                url: '/paypal/:status',
                templateUrl: 'app/products/admin/paypal.html',
                controller: 'PaypalListsCtrl',
                authenticate: true
            })
            .state('admin.premiumUsers', {
                url: '/premium-users',
                templateUrl: 'app/admin/premium-users.html',
                controller: 'PremiumUsersListCtrl',
                authenticate: true
            })
            .state('admin.statistics', {
                url: '/statistics',
                templateUrl: 'app/admin/utilization-statistics/utilization-statistics.html',
                controller: 'UtilizationStatisticsCtrl',
                authenticate: true
            })
            .state('admin.businessHouse', {
                url: '/business-house',
                templateUrl: 'app/admin/business-house.html',
                controller: 'BusinessHouseCtrl',
                authenticate: true
            })
            .state('admin.uploadmedia', {
                url: '/upload-media',
                templateUrl: 'app/admin/uploadmedia/upload-media.html',
                controller: 'UploadmediaCtrl',
                authenticate: true
            })
    });