'use strict';

angular.module('iCoinApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('affiliates', {
        url: '/affiliates/referrals',
        parent: 'app',
        templateUrl: 'app/affiliates/referralcampaigns/affiliates.html',
        controller: 'AffiliatesCtrl',
        authenticate: true
      })
      .state('affilateReferralReport', {
        url: '/affiliates/referral/report',
        parent: 'app',
        templateUrl: 'app/affiliates/referralcampaignreport/referral-reports.html',
        controller: 'AffiliatesReferralReportCtrl',
        authenticate: true
      })
      .state('affilateBanner', {
        url: '/affiliates/banners',
        parent: 'app',
        templateUrl: 'app/affiliates/banners/banners.html',
        controller: 'AffiliatesBannersCtrl',
        authenticate: true
      })
      .state('affilateBannerReport', {
        url: '/affiliates/banners/report',
        parent: 'app',
        templateUrl: 'app/affiliates/bannerreports/banners-reports.html',
        controller: 'AffiliatesBannersReportCtrl',
        authenticate: true
      })
      .state('affilateDefaultPage', {
        url: '/affiliates',
        parent: 'app',
        templateUrl: 'app/affiliates/myreferrallink/default-referral.html',
        controller: 'AffiliatesDefaultCtrl',
        authenticate: true
      })
      .state('emailSamples', {
        url: '/email-samples',
        parent: 'app',
        templateUrl: 'app/affiliates/emailsamples/email-samples.html',
        authenticate: true
      })
      .state('smsBlast', {
        url: '/sms-blast',
        parent: 'app',
        templateUrl: 'app/affiliates/smsblast/sms-blast.html',
        authenticate: true
      });


  });
