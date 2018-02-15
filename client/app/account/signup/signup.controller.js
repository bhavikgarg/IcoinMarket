'use strict';

angular.module('iCoinApp')
  .controller('SignupCtrl', function ($scope, Auth, Utilities, $location, $window, $cookies, $http, $stateParams, $timeout, $uibModal, $uibModalStack, PostOnAweber, ReferralHelpers, User, ApiPath, vcRecaptchaService, CAPTCHAKEY, CryptoHelper) {

    $scope.welcomeApiUrl = ApiPath + '/welcome';

    $scope.user = {};
    $scope.errors = {};
    $scope.passwordMatch = true;
    $scope.showMissmatchError = false;
    $scope.validUserName = -1;
    $scope.stdcode = '+';
    $scope.lockallbuttons = true;
    // $scope.user.email = $location.search().email;
    // $scope.info = window.atob($location.search().info);
    $scope.referralHash = ($stateParams.refcode || null);
    $scope.referralHash = ($scope.referralHash ? decodeURIComponent($scope.referralHash) : $scope.referralHash);
    if($location.search().info){
      $scope.info = window.atob($location.search().info);
      $scope.infoData = $scope.info.split('&');
      $scope.filterEmail = $scope.infoData[0].split('=');
      $scope.user.email = $scope.filterEmail[1];
      // $scope.filterPassword = $scope.infoData[1].split('=');
      // $scope.user.password = $scope.filterPassword[1];
      console.log($scope.user.email);
    }

    var sponsor = $cookies.get('refUser');
    $scope.hasRefCookie = (sponsor ? true : false);
    $scope.sponsor = (sponsor ? ReferralHelpers.decodeReference(sponsor) : '');
    $scope.sponsor = $scope.sponsor.split('>');
    // $scope.categories = [];
    $scope.sponsor = {
      name: $scope.sponsor[1],
      id: $scope.sponsor[4],
      target: $scope.sponsor[3]
    };
    $scope.invalidSponsor = false;
    $scope.customSponsor  = $scope.sponsor.id;
    $scope.customTarget   = $scope.sponsor.target;

    // Utilities.getGenre(function(data) {
    //   $scope.genres = data.genres;
    //   $scope.categories = $scope.genres.map(function(item) { return item.key; });
    // });

    $scope.disableForPost = false;

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
        console.log('Response'+ $scope.response);
    };
    $scope.setWidgetId = function (widgetId) {
        console.info('Created widget ID: %s', widgetId);
        $scope.widgetId = widgetId;
    };
    $scope.cbExpiration = function() {
        console.info('Captcha expired. Resetting response object');
        vcRecaptchaService.reload($scope.widgetId);
        $scope.response = null;
     };

    $scope.register = function(form) {
      $scope.submitted = true;
      var userInfo = $cookies.get('country_info');
      var userIPInfo   =  (userInfo ? JSON.parse(atob(userInfo)) : '');
      var mobileNumber        = $scope.user.stdcode + '-' + $scope.user.contact;
      var isValidMobileNumber = (/^(\+|\-)(\d\s{0,1})(\d{0,4})$/.test($scope.user.stdcode) && /^\d{5,10}$/.test($scope.user.contact));
      console.log(isValidMobileNumber, /^(\+|\-)(\d\s{0,1})(\d{0,4})$/.test($scope.user.stdcode),  /^\d{5,10}$/.test($scope.user.contact));
      console.log(form.$valid);
      if(!$scope.response) {
        $scope.captcha_error = 'Captcha validation failed';
      }
      else{
        $scope.captcha_error = '';
      }
      if(!isValidMobileNumber) {
        $scope.errorMessage = 'Mobile no is not valid';
      } else
        if($scope.user.confirmpassword === $scope.user.password) {

        }

      if(form.$valid && $scope.user.confirmpassword === $scope.user.password && isValidMobileNumber && $scope.response) {
        $scope.disableForPost = true;

        Auth.createUser({
          password: CryptoHelper.encrypt($scope.user.password),
          email: CryptoHelper.encrypt($scope.user.email),
          ip: userIPInfo.ip,
          countryCode: ($scope.user.countryCode || userIPInfo.country_code),
          countryName: ($scope.user.country || userIPInfo.country_name),
          name: $scope.user.firstName + ' ' + $scope.user.lastname,
          mobile: mobileNumber,
          address: $scope.user.address,
          accountname: $scope.user.accountName,
          accountno: $scope.user.accountNo,
          bankname: $scope.user.bankname,
          branch: $scope.user.branch,
          code: $scope.user.code,
          // categories: $scope.categories,
          state: $scope.user.state,
          country: $scope.user.country,
          pincode: $scope.user.pincode,
          username: $scope.user.username,
          city: $scope.user.city,
          customSponsor: $scope.customSponsor,
          customTarget: $scope.customTarget,
          referralHash: $scope.referralHash,
          key : $scope.response
        })
        .then( function(response) {
          if(response.error)
          {
            if(response.message.indexOf('email') !== -1){
                $scope.signup='app/account/signup/step1.html';
            }
            $scope.errors.error = response.message;
            $scope.disableForPost = false;
            $scope.cbExpiration();
            return false;
          }
          else{
              $cookies.put('resactlnk', ReferralHelpers.encodeReference(JSON.stringify({un: $scope.user.username, ue: $scope.user.email})));

              $uibModal.open({
                templateUrl: 'app/account/signup/security-popup.html',
                windowClass: 'large-width',
                backdrop: 'static',
                keyboard: true
              });
              setTimeout(function(){
                // Account created, redirect to home
                $uibModalStack.dismissAll();
                if(PostOnAweber) {
                  angular.element('#icmsignupgetresponse').submit();
                }
                else {
                  $location.path('/welcome');
                }
              }, 5000);
          }


        })
        .catch( function(err) {
          $scope.errors = {};

          if(err && err.data) {
            err = err.data;
            // Update validity of form fields that match the mongoose errors
            angular.forEach(err.errors, function(error, field) {
              form[field].$setValidity('mongoose', false);
              $scope.errors[field] = error.message;
            });
            $scope.disableForPost = false;
          }
          else if(err && err.errors && err.errors.hasOwnProperty('mobile')) {
            $scope.errors.mobile = err.errors.mobile.message;
            $scope.disableForPost = false;
          }
          else {
            $scope.errors.email = 'Please use different email address';
            $scope.signup='app/account/signup/step1.html';
            $scope.disableForPost = false;
          }
        });
      }
    };

    $scope.loginOauth = function(provider) {
      if(!$scope.lockallbuttons) {
        $cookies.put('cinvsvd', 0);
        $window.location.href = ApiPath + '/auth/' + provider + '?token=' + btoa($scope.referralHash);
      }
    };

    $scope.signup='app/account/signup/step1.html';

    $scope.verifyEmail = function(){
      User.signupVerifyEmail({email: $scope.user.email}, function(res) {
        if(res.user == true){
          $scope.errors.email = 'Please use different email address';
        }else{
          $scope.errors.email = '';
        }
      });
    };

    $scope.next = function() {
      if(!$scope.lockallbuttons) {
        // User.signupVerifyEmail({email: $scope.user.email}, function(res) {
        //   if(res.user == true){
        //     $scope.errors.email = 'Please use different email address';
        //   }else{
            $scope.signup='app/account/signup/step2.html';
            $scope.errors.email = '';
        //   }
        // });
      }
    };

    $scope.validateSponsor = function(obj) {
      $scope.customSponsor = obj.customSponsor;
      Utilities.isValidSponsor({sponsor: $scope.customSponsor}, function(data) {
        $scope.invalidSponsor = false;
        if(data.user == null) {
          $scope.invalidSponsor = ($scope.customSponsor !== '');
          $scope.sponsor.name = '';
        }
        else {

          $scope.sponsor = {
            name: data.user.name,
            id: data.user.id
          };

          $scope.createSponsorSession();
        }
      });
    };

    $scope.verifyPassAndConfirmPass = function() {
      if($scope.user.confirmpassword === '' && $scope.user.password === ''){
         $scope.passwordMatch = ($scope.user.confirmpassword === $scope.user.password);
         $scope.showMissmatchError = !$scope.passwordMatch;
      }
    };

    $scope.confirmerror=false;
    $scope.showMatchError = function() {
      $scope.confirmerror=true;

      if($scope.user.confirmpassword != null){
        $scope.showMissmatchError = !($scope.user.confirmpassword === $scope.user.password);
      }else{
        if($scope.user.confirmpassword == undefined || $scope.user.password == undefined)
        {
          $scope.showMissmatchError = false;
        }
      }
    };
    $scope.passworderror=false;
    $scope.passLengthError = function(){
      $scope.passworderror=true;
    };

    $scope.strengthBar = false;
    $scope.minLength = false;
    $scope.passStrength = function(pass){
      var passRegExp = /^(?=.*[a-zA-Z])(?=.*[0-9]).+$/;
      //Password Strength
      if(pass ==  undefined) {
        $scope.strengthBar = false;
        $scope.passwordLength = 0;
        $scope.colorClass = '';
        $scope.minLength = false;
        $scope.alphaNum = false;
        $scope.passError = false;
      }else {
        $scope.strengthBar = true;
        //Error Text Color
        if(pass.length > 7){
          $scope.minLength = true;
        }else{
          $scope.minLength = false;
        }
        if(pass.match(passRegExp)){
          $scope.alphaNum = true;
        }else{
          $scope.alphaNum = false;
        }

        //Password Strength
        if((pass.length < 8 && !pass.match(passRegExp)) || (pass.length > 7 && !pass.match(passRegExp)) || (pass.length < 8 && pass.match(passRegExp))) {
          $scope.passwordLength = 20;
          $scope.colorClass = 'progress-bar-danger';
          $scope.strength = 'Weak';
          $scope.textColor = 'text-danger';
          $scope.passError = true;
        }else if((pass.length > 7 && pass.length < 11) && pass.match(passRegExp)) {
          $scope.passwordLength = 60;
          $scope.colorClass = 'progress-bar-warning';
          $scope.strength = 'Medium';
          $scope.textColor = 'text-warning';
          $scope.passError = false;
        }else if((pass.length > 10 && pass.length < 14) && pass.match(passRegExp)) {
          $scope.passwordLength = 80;
          $scope.colorClass = 'progress-bar-info';
          $scope.strength = 'Good';
          $scope.textColor = 'text-info';
          $scope.passError = false;
        }else if(pass.length > 14 && pass.match(passRegExp)) {
          $scope.passwordLength = 100;
          $scope.colorClass = 'progress-bar-success';
          $scope.strength = 'Strong';
          $scope.textColor = 'text-success';
          $scope.passError = false;
        }
      }

    };

    $scope.getUserIpInfo = function() {
      var userInfo = $cookies.get('country_info');
      if(userInfo) {
        var userIPInfo   =  (userInfo ? JSON.parse(atob(userInfo)) : {});
        $scope.user.country = (userIPInfo.country_name ? userIPInfo.country_name : '');
        $scope.user.state   = (userIPInfo.region_name ? userIPInfo.region_name : '');
        $scope.user.city    = (userIPInfo.city ? userIPInfo.city : '');
        $scope.user.pincode = (userIPInfo.zip_code ? userIPInfo.zip_code : '');
      }
      else {
        setTimeout($scope.getUserIpInfo, 2000);
      }
    };

    $scope.verifyUserName = function() {
      if(typeof $scope.user.username !== 'undefined' && $scope.user.username != null && $scope.user.username !== '' && $scope.user.username.trim() !== '' ) {
        Auth.isValidUserName({username: $scope.user.username}, function(response) {
          $scope.validUserName = (response && response.isValid && response.isValid == true);
          $scope.disableForPost = !$scope.validUserName;
        });
      }
      else {
        $scope.validUserName = false;
        $scope.submitted = false;
      }
    };

    if(!$scope.hasRefCookie) {
      Utilities.getDefaultSponsorInfo(function(data) {
        $scope.validateSponsor({customSponsor: data.username});
      });
    }

    $scope.getISDCodes = function() {
      Utilities.getISDCodes(function(data) {
        $scope.isdCodes = data.isdCodes;
      });
    };

    $scope.getISDCodes();

    $scope.getCountries = function(callback) {
      Utilities.getCountries(function(data) {
        $scope.countries = data.countries;
        callback();
        // $scope.user.country = $scope.countries[0].name;
        // $scope.user.countryCode = $scope.countries[0].code;
        // $scope.user.stdcode = $scope.countries[0].dial_code;
      });
    };

    $scope.getCountries(function () {
      $scope.setISDCode();
    });

     $scope.setISDCode = function () {
          $scope.countries.forEach(function (country) {
              if (country.name === $scope.user.country) {
                  $scope.user.stdcode = country.dial_code;
              }
          });
      };
      $scope.setCountryCode = function () {
          $scope.countries.forEach(function (country) {
              if (country.name === $scope.user.country) {
                  $scope.user.countryCode = country.code;
                  $scope.setISDCode();
              }
          });
      };

    $scope.setCountry = function () {
           $scope.countries.forEach(function (country) {
              if (country.dial_code === $scope.user.stdcode) {
                  $scope.user.country = country.name;
              }
          });
      };

    $scope.goBack = function() {
      $scope.signup='app/account/signup/step1.html';
    };

    $scope.reset = function() {
      $scope.user = {};
      $scope.getUserIpInfo();
      $scope.showMissmatchError = false;
    };

    $scope.goBack = function() {
      $scope.signup='app/account/signup/step1.html';
    };

    $scope.createSponsorSession = function() {
      Utilities.registerSponsorSession($scope.sponsor, function(info) {
        $scope.lockallbuttons = info.error;
      });
    };

    if($scope.hasRefCookie) {
      $scope.createSponsorSession();
    }

    $scope.getUserIpInfo();
  });
