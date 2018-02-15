'use strict';

angular.module('iCoinApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('referral', {
        url: '/referral/link/:ref/:target/:source',
        templateUrl: 'app/referral/referral.html',
        controller: 'ReferralCtrl',
        authenticate: false
      })
      .state('newLinkReferral', {
        url: '/refl/:target/:source',
        templateUrl: 'app/referral/referral.html',
        controller: 'LinkBannerReferralCtrl',
        authenticate: false
      })
      .state('newBannerReferral', {
        url: '/refb/:target/:source',
        templateUrl: 'app/referral/referral.html',
        controller: 'LinkBannerReferralCtrl',
        authenticate: false
      });
  });
