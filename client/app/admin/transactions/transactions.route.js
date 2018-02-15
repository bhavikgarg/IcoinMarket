'use strict';

angular.module('iCoinApp')
  .config(function ($stateProvider) {
    $stateProvider
    .state('admin.PurchaseRequests', {
        url: '/transactions/purchases',
        templateUrl: 'app/admin/transactions/purchases/purchase-list.html',
        controller: 'PurchaseRequestsCtrl',
        authenticate: true
    })
    .state('admin.purchaseRequests', {
        url: '/transactions/purchases',
        templateUrl: 'app/admin/transactions/purchases/purchase-list.html',
        controller: 'PurchaseRequestsCtrl',
        authenticate: true
    })
    .state('admin.withdrawlRequests', {
        url: '/transactions/withdrawals',
        templateUrl: 'app/admin/transactions/withdrawals/withdrawals-list.html',
        controller: 'WithdrawlRequestsCtrl',
        authenticate: true
    })
    .state('admin.adcwithdrawlRequests', {
        url: '/transactions/adc-withdrawals',
        templateUrl: 'app/admin/transactions/withdrawals/adc-withdrawals-list.html',
        controller: 'AdcWithdrawlRequestsCtrl',
        authenticate: true
    })
    .state('admin.transferFeeRegister', {
          url: '/transactions/transfer-fee-register',
          templateUrl: 'app/admin/transactions/transfer-fee-register/transfer-fee-register.html',
          controller: 'TransferFeeRegisterCtrl',
          authenticate: true
    })
     .state('admin.commitments', {
          url: '/transactions/commitments',
          templateUrl: 'app/admin/transactions/commitments/commitment-list.html',
          controller: 'CommitmentCtrl',
          authenticate: true
    })
     .state('admin.profitlogsreport', {
          url: '/transactions/profitlogsreport',
          templateUrl: 'app/pm-admin/profitlogsreport/profitlogsreport.html',
          controller: 'ProfitLogsReportCtrl',
          authenticate: true
    });
  });
