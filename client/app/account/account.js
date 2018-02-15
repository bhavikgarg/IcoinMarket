'use strict';

angular.module('iCoinApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('login', {
        url: '/',
        templateUrl: 'app/account/login/login.html',
        controller: 'LoginCtrl',
        authenticate: false
      })
      .state('signup', {
        url: '/signup',
        templateUrl: 'app/account/signup/signup.html',
        controller: 'SignupCtrl',
        authenticate: false
      })
      .state('signupwithparams', {
        url: '/signup/:refcode',
        templateUrl: 'app/account/signup/signup.html',
        controller: 'SignupCtrl',
        authenticate: false
      })
      .state('settings', {
        url: '/settings',
        templateUrl: 'app/account/settings/settings.html',
        controller: 'SettingsCtrl',
        authenticate: true
      })
      .state('verifyemail', {
        url: '/verify/email/:token',
        templateUrl: 'app/account/verifyemail/verify.html',
        controller: 'VerifyEmailCtrl',
        authenticate: false
      })
      .state('provideEmailMobile', {
        url: '/complete-signup',
        templateUrl: 'app/account/verifyemail/complete-signup.html',
        controller: 'preconditionCtrl',
        authenticate: false
      })
      .state('signupWelcome', {
        url: '/welcome',
        templateUrl: 'app/account/verifyemail/signup-welcome.html',
        controller: 'signupWelcomeCtrl',
        authenticate: false
      })
      .state('forgetpassword', {
        url: '/forget-password',
        templateUrl: 'app/account/verifyemail/forget-password.html',
        controller: 'ForgetPasswordCtrl',
        authenticate: false
      })
      .state('forgetchangepassword', {
        url: '/change-password/:passtoken',
        templateUrl: 'app/account/verifyemail/change-password.html',
        controller: 'ChangePasswordCtrl',
        authenticate: false
      })
      .state('setBusinessUserPassword', {
        url: '/set-password/:userid',
        templateUrl: 'app/account/verifyemail/set-password.html',
        controller: 'SetPasswordCtrl',
        authenticate: false
      })
      .state('setPortfolioManagerPassword', {
          url: '/set-portfolio-manager-password/:userid',
          templateUrl: 'app/account/verifyemail/set-portfolio-manager-password.html',
          controller: 'SetPortfolioManagerPasswordCtrl',
          authenticate: false
      });
  });