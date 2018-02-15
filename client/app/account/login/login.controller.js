'use strict';

angular.module('iCoinApp')
  .controller('LoginCtrl', function ($scope, Auth, User, $location, $rootScope, $window, $cookies,$uibModalStack, UserQuery, $uibModal, ApiPath, $state, CAPTCHAKEY, vcRecaptchaService) {

    $scope.user = {};
    $scope.errors = {};
    var authParams = UserQuery.getQuery();
    $scope.isZendeskCall = authParams.hasOwnProperty('brand_id') && authParams.hasOwnProperty('return_to') && authParams.hasOwnProperty('timestamp');

    if(Auth.isLoggedIn()) {

      if($scope.isZendeskCall) {
        var _token   = $cookies.get('token').replace(/\"/g, '');
        var returnTo = decodeURIComponent(authParams.return_to);
        if(UserQuery.isOsTicketSSORequest(returnTo)) {
          $window.location.href = UserQuery.getOsTicketAuthRedirectPath() + _token + '&return_to=' + authParams.return_to;
        }
        else {
          $window.location.href = returnTo + '?__t=' + _token;
        }
      }
      else {
        $scope.username = Auth.getCurrentUser();
        $scope.userRole = $scope.username.role;
        if(Auth.isAdmin() && $scope.userRole === 'manager')
          $location.path('/pmadmin');
        else if(Auth.isAdmin() && $scope.userRole == 'support')
           $location.path('/chatboard');
        else if(!Auth.isAdmin() && $scope.userRole == 'finance')
           $location.path('/admin/dashboard');
        else if(!Auth.isAdmin() && $scope.userRole == 'user')
          $location.path('/dashboard');
        else
            $location.path('/admin/dashboard');
      }
    }
    $scope.response = null;
    $scope.widgetId = null;
    $scope.model = {
        key: CAPTCHAKEY
    };
    $scope.setResponse = function (response) {
        console.info('Response available');
        $scope.response = response;
        if($scope.response) {
          $scope.captcha_error = '';
        }
    };
    $scope.setWidgetId = function (widgetId) {
        $scope.widgetId = widgetId;
    };
    $scope.cbExpiration = function() {
        console.info('Captcha expired. Resetting response object');
        vcRecaptchaService.reload($scope.widgetId);
        $scope.response = null;
     };
    $scope.email = '';
    $scope.resend = function(frmObj) {
      $scope.submitted = true;
      $scope.resenderror = '';
      if(frmObj.$valid && $scope.email) {
        User.resendVerification({email: $scope.email}, function(data) {
          if(data.error){
            $scope.resenderror = data.error;
          }
          else if(data.send){
            $scope.resenderror = 'We have just sent you a verification link';
            $uibModalStack.dismissAll();
            $scope.resendverficationsent = true;
             setTimeout(function () {
              angular.element('#resendVerification').modal('hide');
              $window.location.href = '/';
            }, 1000);
          } else {
            $scope.resenderror = 'Please try again after sometime';
          }
        });
      }
      else {
        $scope.resenderror = 'Fix above errors!';
      }
    };

    $scope.loginLoader=false;
    $scope.loginButton=false;

    $scope.login = function(form) {
      $scope.submitted = true;
      $scope.loginLoader=true;
      $scope.loginButton=true;
      // if(form.$valid && $scope.response) {
      if(form.$valid) {
        Auth.login({
          email: $scope.user.email,
          password: $scope.user.password,
          key : $scope.response
        })
        .then( function() {
          var regPassExp = /^(?=.*[a-zA-Z])(?=.*[0-9]).+$/;
          if(!$scope.user.password.match(regPassExp)) {
            sessionStorage.weakPassword = true;
          }
          // Logged in, redirect to home
          Auth.getCurrentUser().$promise.then(function(usr) {
            if($scope.isZendeskCall) {
              var _token = $cookies.get('token').replace(/\"/g, '');
              var returnTo = decodeURIComponent(authParams.return_to);
              if(UserQuery.isOsTicketSSORequest(returnTo)) {
                $window.location.href = UserQuery.getOsTicketAuthRedirectPath() + _token + '&return_to=' + authParams.return_to;
              }
              else {
                $window.location.href = returnTo + '?__t=' + _token;
              }
            }
            else {
              var _redirect = '/dashboard';
              if(Auth.getAdminRoles().indexOf(usr.role) >= 0) {
                if(usr.role == 'support')
                    _redirect = '/chatboard';
                else if(usr.role == 'finance')
                    _redirect='/admin/dashboard';
                else if(usr.role == 'manager')
                    _redirect='/pmadmin';
                else
                    _redirect = '/admin/dashboard';
              }
              else if (Auth.getBusinessRoles().indexOf(usr.role) >= 0) {
                _redirect = '/wallet';
              }

              // Remove modal backdrop after login as it is not required after that
              angular.element('.modal-backdrop.fade.in').remove();
              $cookies.put('cinvsvd', 0);
              $location.path(_redirect);
            }
          });
        })
        .catch( function(err) {
          $scope.errors.other = err.data.message;
          $scope.loginLoader=false;
          $scope.loginButton=false;
          $scope.cbExpiration();
        });
      }
    };

    $scope.loginOauth = function(provider) {
      $cookies.put('cinvsvd', 0);
      $window.location.href = ApiPath + '/auth/' + provider;
    };

    if($scope.isZendeskCall) {
      angular.element('#myLoginModal').modal('show');
    }

    // forget password functionality
    $scope.fpemail = '';
    $scope.isValid = false;
    $scope.forgetPassword = function(frmObj) {
      if(frmObj.$valid) {
        User.forgetPassword({email: $scope.fpemail}, function(data) {
          if(data.isValid) {
            $scope.message = 'Check your email for instructions to reset your password';
            setTimeout(function () {
              angular.element('#forgetPasswordModal').modal('hide');
              $window.location.href = '/';
            }, 1000);
          }
          else {
            $scope.message = 'This email is not registered with Icoin Market';
            $scope.isValid = false;
          }
        });
      }
      else {
        $scope.message = 'Enter a valid email';
        $scope.isValid = false;
      }
    };
  });
