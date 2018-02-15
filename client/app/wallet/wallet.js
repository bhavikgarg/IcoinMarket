'use strict';

angular.module('iCoinApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('wallet', {
        url: '/wallet',
        parent: 'app',
        templateUrl: 'app/wallet/wallet.html',
        controller: 'WalletCtrl',
        authenticate: true
      })
      .state('cashWallet', {
        url: '/cash-wallet',
        parent: 'app',
        templateUrl: 'app/wallet/cashWallet.html',
        controller: 'CashWallet',
        authenticate: true
      })
      .state('goldWallet', {
        url: '/gold-wallet',
        parent: 'app',
        templateUrl: 'app/wallet/goldWallet.html',
        controller: 'GoldWallet',
        authenticate: true
      })
      .state('silverWallet', {
        url: '/silver-wallet',
        parent: 'app',
        templateUrl: 'app/wallet/silverWallet.html',
        controller: 'SilverWallet',
        authenticate: true
      })
      .state('WithdrawalSuccess', {
        url: '/withdrawal-success/:tid',
        parent: 'app',
        templateUrl: 'app/wallet/withdrawal-success.html',
        controller: 'WithdrawalSuccessCtrl',
        authenticate: true
      })
      .state('revenueShare', {
        url : '/revenue-share',
        parent: 'app',
        templateUrl : 'app/wallet/revenue-share.html',
        controller : 'RevenueShare',
        authenticate: true
      });
  });
