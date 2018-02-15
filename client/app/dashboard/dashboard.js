'use strict';

angular.module('iCoinApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('dashboard', {
        url: '/dashboard',
        parent: 'app',
        templateUrl: 'app/dashboard/dashboard.html',
        controller: 'DashboardCtrl',
        authenticate: true
      })
      .state('notifications', {
        url: '/notifications',
        templateUrl: 'app/dashboard/notifications/notifications.html',
        controller: 'NotificationsCtrl',
        authenticate: true
      })
      .state('messages', {
        url: '/messages',
        templateUrl: 'app/dashboard/messages/messages.html',
        controller: 'MessagesCtrl',
        authenticate: true
      })
      .state('walkthrough', {
        url: '/walkthrough',
        templateUrl: 'app/dashboard/walkthrough.html',
        controller: 'WalkthroughCtrl',
        authenticate: false
      })
      .state('yourreferrallinks', {
        url: '/your-referral-links',
        templateUrl: 'app/dashboard/your-referral-links.html',
        controller: 'YourReferralLinksCtrl',
        authenticate: true
      })
      .state('corporatepresentation', {
        url: '/corporate-presentation',
        templateUrl: 'app/dashboard/corporate-presentation.html',
        controller: 'CorporatePresentationCtrl',
        authenticate: true
      })
      .state('joincorporatefacebookgroup', {
        url: '/join-corporate-facebook-group',
        templateUrl: 'app/dashboard/join-corporate-facebook-group.html',
        controller: 'JoinCorporateFacebookGroupCtrl',
        authenticate: true
      })
      .state('marketingTools', {
        url: '/marketing-tools',
        templateUrl: 'app/dashboard/marketing-tools.html',
        controller: 'MarketingToolsCtrl',
        authenticate: true
      })
      /* .state('goldAdvertising', {
        url: '/gold-advertising',
        templateUrl: 'app/dashboard/gold-advertising.html',
        controller: 'GoldAdvertisingCtrl'
      })
      .state('silverAdvertising', {
        url: '/silver-advertising',
        templateUrl: 'app/dashboard/silver-advertising.html',
        controller: 'SilverAdvertisingCtrl'
      })*/
      /* .state('commission', {
        url: '/commission',
        templateUrl: 'app/dashboard/commission.html',
        controller: 'CommissionCtrl'
      }) */
      .state('getMoreCoins', {
        url: '/get-more-coins',
        templateUrl: 'app/dashboard/get-more-coins.html',
        controller: 'GetMoreCoinsCtrl',
        authenticate: true
      })
      .state('getGoldCoin', {
        url: '/get-gold-coins',
        templateUrl: 'app/dashboard/get-gold-coins.html',
        controller: 'GetGoldCoinsCtrl',
        authenticate: true
      })
      .state('getSilverCoins', {
        url: '/get-silver-coins',
        templateUrl: 'app/dashboard/get-silver-coins.html',
        controller: 'GetSilverCoinsCtrl',
        authenticate: true
      })
      .state('walkthroughReferralLinks', {
        url: '/walkthrough-referral-links',
        templateUrl: 'app/dashboard/statics/walkthrough-referral-links.html',
        controller: 'WalkthroughReferralLinksCtrl',
        authenticate: false
      })
      .state('walkthroughMarketingTools', {
        url: '/walkthrough-marketing-tools',
        templateUrl: 'app/dashboard/statics/walkthrough-marketing-tools.html',
        controller: 'WalkthroughMarketingToolsCtrl',
        authenticate: false
      })
      .state('walkthroughLeaderboard', {
        url: '/walkthrough-leaderboard',
        templateUrl: 'app/dashboard/statics/walkthrough-leaderboard.html',
        controller: 'WalkthroughLeaderboardCtrl',
        authenticate: false
      })
      .state('walkthroughIntroduction', {
        url: '/walkthrough-introduction',
        templateUrl: 'app/dashboard/statics/walkthrough-introduction.html',
        controller: 'WalkthroughIntroductionCtrl',
        authenticate: false
      })
      .state('walkthroughIntroductionSpanish', {
        url: '/walkthrough-spanish-introduction',
        templateUrl: 'app/dashboard/statics/walkthrough-spanish-introduction.html',
        controller: 'WalkthroughIntroductionSpanishCtrl',
        authenticate: false
      })
      .state('walkthroughsupportcc', {
        url: '/walkthrough-support-cc',
        templateUrl: 'app/dashboard/statics/walkthrough-support-cc.html',
        controller: 'WalkthroughSupportccCtrl',
        authenticate: false
      })
      .state('walkthroughsilvergoldadvertising', {
        url: '/walkthrough-silver-gold-advertising',
        templateUrl: 'app/dashboard/statics/walkthrough-silver-gold-advertising.html',
        controller: 'WalkthroughSilverGoldAdvertisingCtrl',
        authenticate: false
      })
      .state('walkthroughdashboardpresentations', {
        url: '/walkthrough-dashboard-presentations',
        templateUrl: 'app/dashboard/statics/walkthrough-dashboard-presentations.html',
        controller: 'WalkthroughDashboardPresentationsCtrl',
        authenticate: false
      })
      .state('walkthroughtenads', {
        url: '/walkthrough-ten-ads',
        templateUrl: 'app/dashboard/statics/walkthrough-ten-ads.html',
        controller: 'WalkthroughTenAdsCtrl',
        authenticate: false
      })
      .state('PDFDownloadPage', {
        url: '/pdf-download',
        templateUrl: 'app/dashboard/statics/pdf-download.html',
        controller: 'PDFDownloadCtrl',
        authenticate: false
      })
      .state('DashboardCIKorean', {
        url: '/dashboard-ci-korean',
        templateUrl: 'app/dashboard/statics/dashboard-ci-korean.html',
        controller: 'DashboardCIKoreanCtrl',
        authenticate: false
      })
      .state('HowItWorksCIKorean', {
        url: '/how-it-works-ci-korean',
        templateUrl: 'app/dashboard/statics/how-it-works-ci-korean.html',
        controller: 'HowItWorksCIKoreanCtrl',
        authenticate: false
      })
      .state('CIPresentationFilipino', {
        url: '/ci-presentation-filipino',
        templateUrl: 'app/dashboard/statics/ci-presentation-filipino.html',
        controller: 'CIPresentationFilipinoCtrl',
        authenticate: false
      })
      .state('ConceptPresentationEnglish', {
        url: '/concept-presentation-english',
        templateUrl: 'app/dashboard/statics/concept-presentation-english.html',
        controller: 'ConceptPresentationEnglishCtrl',
        authenticate: false
      })
      .state('CIPresentationSpanish', {
        url: '/ci-presentation-spanish',
        templateUrl: 'app/dashboard/statics/ci-presentation-spanish.html',
        controller: 'CIPresentationSpanishCtrl',
        authenticate: false
      })
      .state('CIPresentationTaglish', {
        url: '/ci-presentation-taglish',
        templateUrl: 'app/dashboard/statics/ci-presentation-taglish.html',
        controller: 'CIPresentationTaglishCtrl',
        authenticate: false
      })
      .state('CIPresentationGreece', {
        url: '/ci-presentation-greece',
        templateUrl: 'app/dashboard/statics/ci-presentation-greece.html',
        controller: 'CIPresentationGreeceCtrl',
        authenticate: false
      })
      .state('TermsOfService', {
        url: '/terms-of-service',
        templateUrl: 'app/dashboard/statics/terms-of-service.html',
        controller: 'TermsOfServiceCtrl',
        authenticate: false
      })
      .state('PrivacyPolicy', {
        url: '/PrivacyPolicy',
        templateUrl: 'app/dashboard/statics/privacypolicy.html',
        controller: 'PrivacyPolicyCtrl',
        authenticate: false
      })
       .state('ContactUs', {
        url: '/ContactUs',
        templateUrl: 'app/dashboard/statics/contactus.html',
        controller: 'ContactUsCtrl',
        authenticate: false
      })
      .state('KnowMore', {
        url: '/know-more',
        templateUrl: 'app/dashboard/statics/know-more.html',
        controller: 'KnowMoreCtrl',
        authenticate: false
      })
      .state('support', {
        url: '/support',
        templateUrl: 'app/dashboard/statics/support.html',
        controller: 'SupportCtrl',
        authenticate: true
      })
      .state('browserlist', {
        url: '/browsers-list',
        templateUrl: 'app/dashboard/statics/browserlist.html',
        controller: 'browserListCtrl',
        authenticate: false
      });
  });
