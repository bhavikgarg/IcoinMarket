'use strict';

angular.module('iCoinApp')
  .controller('VerifyEmailCtrl', function ($scope, $stateParams, Auth, $location) {

    $scope.verificationCode = '';
    $scope.errorMessage = 'Please wait...';
    $scope.isVerified = false;
    $scope.verifyEmail = function() {

      Auth.verifyEmail({
        token: $stateParams.token,
        code: $scope.verificationCode
      }, function(data) {

        if(data._id === $stateParams.token) { //&& data.customText == $scope.verificationCode) {
          $scope.isVerified = true;
        }
        else {
          $scope.errorMessage = 'Invalid request';
        }
      });
    };

    $scope.verifyEmail();
  })

  .controller('preconditionCtrl', function($scope, $stateParams, ApiPath, Auth, User, $location, $window, $cookieStore, $cookies, Utilities, PostOnAweber, Affiliates, ReferralHelpers, $timeout) {
    // var info    = $cookies.get('__userinfo');
    // $scope.user = JSON.parse(info);

    $scope.welcomeApiUrl = ApiPath + '/welcome';

    $scope.errors = {};
    $scope.message = '';
    $scope.validUserName = -1;

    User.getBasicInfo(function(data) {
      $scope.user = data;
      var mobile = $scope.user.mobile;
      mobile = (mobile ? mobile.split('-') : '');
      var stdcode = (mobile[0] ? mobile[0] : '+');
      mobile = (mobile[1] ? (mobile[1] * 1) : '');

      $scope.user.mobile = mobile;
      $scope.submitted = false;
      $scope.user.stdcode = stdcode;

      $timeout(function() {
        $scope.setUserReferal();
      }, 500);
    });

    // Remove modal backdrop after login as it is not required after that
    angular.element('.modal-backdrop.fade.in').remove();
    setTimeout(function() {angular.element('.modal-backdrop.fade.in').remove();}, 1000);
    $cookieStore.remove('cinvsvd');
    $cookieStore.remove('cinvsv');

    $scope.showSponsorField   = false;
    $scope.validateSponsorMsg = 'Please wait while verifing your sponsor...';

    $scope.setUserReferal = function() {
      $scope.validateSponsorMsg = 'Please wait while verifing your sponsor...';
      User.setReferral({
        refToken: $cookies.get('refTarget'),
        refUser: $cookies.get('refUser'),
        userInfo: $scope.user.id,
        userName: $scope.user.name,
        userEmail: $scope.user.email,
        userUName: $scope.user.username,
      }, function(resp) {
        $scope.submitted = false;
        if(resp && !resp.error) {
          $scope.showSponsorField   = false;
          $scope.validateSponsorMsg = '';
          $cookieStore.remove('refTarget');
          $cookieStore.remove('refUser');
        } else {
          $scope.showSponsorField   = true;
          $scope.validateSponsorMsg = 'Unable to verify your sponsor';
        }
      });
    };

    $scope.checkEmail = function(callback){
      User.signupVerifyEmail({email: $scope.user.email, uid: $scope.user.id}, function(res) {
        if(res.user == true){
          $scope.errors.email = 'Please use different email address';
        }else{
          $scope.errors.email = '';
        }
        if(typeof callback === 'function') {
          callback();
        }
      });
    };

    $scope.setSponsor = function() {
      var refInfo   = $scope.user.referrallink.split('?ref=');
      var refTarget = (refInfo.length > 1 ? refInfo[1].split('&') : '');
      var query = '';
      if(refTarget !== '' && refTarget.length > 1) {
        $cookieStore.put('refTarget', refTarget[0]);
        $scope.setUserReferal();
      }
      else {
        refInfo   = $scope.user.referrallink.split('/banner/');
        var refInfo1  = $scope.user.referrallink.split('/referral/link/user/');
        refTarget = (refInfo.length > 1 ? refInfo[1].split('/') : (refInfo1.length > 1 ? refInfo1[1].split('/') : ''));
        if(refTarget !== '' && refTarget.length > 1) {
          $cookieStore.put('refTarget', refTarget[0]);
          $scope.setUserReferal();
        }
        else {
          refInfo   = $scope.user.referrallink.split('?id=');
          refTarget = (refInfo.length > 1 ? refInfo[1].split('&') : '');
          if(refTarget !== '' && refTarget.length > 1) {
            query = {memberid: refTarget[0], linkid: 1};
            Affiliates.findByTarget(query, function(referral) {
              if(!referral.error) {
                $cookieStore.put('refTarget', referral.target);
                $cookieStore.put('refUser', referral.refhash);
                $scope.setUserReferal();
              }
            });
          }
          else {
            refInfo   = $scope.user.referrallink.split('/refl/');
            refTarget = (refInfo.length > 1 ? refInfo[1].split('/') : '');
            if(refTarget !== '' && refTarget.length > 1) {

              query = {memberid: refTarget[0], linkid: refTarget[1]};
              Affiliates.findByTarget(query, function(referral) {
                if(!referral.error) {
                  $cookieStore.put('refTarget', referral.target);
                  $cookieStore.put('refUser', referral.refhash);
                  $scope.setUserReferal();
                }
              });
            }
          }
        }
      }
    };

    $scope.updateUser = function(frmObj) {
      // $scope.checkEmail(function() {
         //if(frmObj.$valid && $scope.validUserName && $scope.errors.email == '')
         $scope.errorMessage = '';
         if(frmObj.$valid && $scope.errors.email == undefined || $scope.errors.email === '') {
          User.update({
            _id: $scope.user.id,
            email: $scope.user.email,
            mobile: $scope.user.stdcode + '-' + $scope.user.mobile,
            username: $scope.user.username,
            countryName: $scope.user.countryName,
            countryCode: $scope.user.countryCode,
            provider: $scope.user.provider
          }, function(data) {
            if(data.error) {
              $scope.errorMessage = data.message;
              $scope.submitted = false;
            } else {
              $scope.submitted = false;
              if(data.name === $scope.user.name && data.role !== 'admin') {
                if(PostOnAweber) {
                  angular.element('#icmsignupgetresponse').submit();
                }
                else {
                  $window.location.href = '/dashboard';
                }
              }
              if(data.name === $scope.user.name && data.role === 'admin') {
                $window.location.href = '/admin/dashboard';
              }
              // if($scope.user.provider == 'facebook') {
              //   $scope.setUserReferal();
              // }
            }
          }, function() {
            $scope.message = 'This Mobile Number is already in use.';
            $scope.submitted = false;
          });
         }
      // });
      $scope.submitted = true;
    };

    $scope.verifyUserName = function() {
      if(typeof $scope.user.username !== 'undefined' && $scope.user.username != null && $scope.user.username !== '' && $scope.user.username.trim() !== '' && $scope.user.username.length >= 6) {
        Auth.isValidUserName({username: $scope.user.username}, function(response) {
          $scope.validUserName = (response && response.isValid && response.isValid == true);
          $scope.submitted = false;
        });
      }
      else {
        $scope.validUserName = false;
      }
    };

    $scope.getISDCodes = function() {
      Utilities.getISDCodes(function(data) {
        $scope.isdCodes = data.isdCodes;
      });
    };

    $scope.getISDCodes();

    $scope.getCountries = function() {
      Utilities.getCountries(function(data) {
        $scope.countries = data.countries;
        $scope.user.countryName = $scope.countries[0].name;
        $scope.user.countryCode = $scope.countries[0].code;
        $scope.user.stdcode = $scope.countries[0].dial_code;
      });
    };

    $scope.getCountries();

    $scope.setCountryCode = function() {
      $scope.countries.forEach(function(country) {
        if(country.name === $scope.user.countryName) {
          $scope.user.countryCode = country.code;
        }
      });
    };

     $scope.setISDCode = function () {
          $scope.countries.forEach(function (country) {
              if (country.name === $scope.user.countryName) {
                  $scope.user.stdcode = country.dial_code;
              }
          });
      };
      $scope.setCountryCode = function () {
          $scope.countries.forEach(function (country) {
              if (country.name === $scope.user.countryName) {
                  $scope.user.countryCode = country.code;
                  $scope.setISDCode();
              }
          });
      };

    $scope.setCountry = function () {
           $scope.countries.forEach(function (country) {
              if (country.dial_code === $scope.user.stdcode) {
                  $scope.user.countryName = country.name;
              }
          });
      };
  })
  .controller('signupWelcomeCtrl', function($scope, $stateParams, $cookies, User, Auth, ReferralHelpers) {
    $scope.showDashboardButton = Auth.isLoggedIn;
    $scope.user = {email: ''};
    $scope.postemail = '';
    $scope.submitted = true;
    $scope.canChangeEmail = true;
    $scope.username = Auth.getCurrentUser();
    $scope.userRole = $scope.username.role; 
    
    $scope.resendActivationLink = function() {
      $scope.message = '';
      var userInfo = $cookies.get('resactlnk');
          userInfo = (userInfo ? JSON.parse(ReferralHelpers.decodeReference(userInfo)) : {});

      if(userInfo.un && userInfo.ue) {

        User.sendAgainVerificationLink({
          uname:  userInfo.un+'',
          uemail: ($scope.postemail || userInfo.ue+'')
        }, function(resp) {
          $scope.message = 'We have just sent you a verification email, Please check your e-mail';
          if(!resp.send && !resp.message) {
            $scope.message = 'Sorry ! Unable to send verification email, Please contact support system';
          }
          if (!resp.send && resp.message) {
            $scope.canChangeEmail = false;
            $scope.message = resp.error;
          }
        });
      }
    };

    $scope.changeEmail = function(form) {

      $scope.emailChangeMessage = '';
      var userInfo = $cookies.get('resactlnk');
          userInfo = (userInfo ? JSON.parse(ReferralHelpers.decodeReference(userInfo)) : {});

      if(form.$valid && userInfo.un && userInfo.ue && $scope.user.email !== '' && $scope.canChangeEmail) {

        User.changeEmailAddress({
          uname:  userInfo.un+'',
          uemail: ($scope.postemail || userInfo.ue+''),
          nemail: form.email.$viewValue+''
        }, function(resp) {
          $scope.emailChangeMessage = 'Your email address is updated, Please click on "Resend Verification Email" to receive activation link';
          if(!resp.update) {
            if(!resp.message) {
              $scope.emailChangeMessage = 'Sorry ! Unable to update your email address, Please contact support system';
            }
            else {
              $scope.emailChangeMessage = resp.error;
            }
          }
          else {
            $scope.postemail = form.email.$viewValue+'';
            $cookies.put('resactlnk', ReferralHelpers.encodeReference(JSON.stringify({un: userInfo.un+'', ue: $scope.postemail})));
          }
        });
      }
      else {
        $scope.submitted = true;
        if(!$scope.canChangeEmail) {
          $scope.emailChangeMessage = 'Sorry ! You have already verified your account with us';
        }
      }
    };
  })
  .controller('ForgetPasswordCtrl', function($scope, $stateParams, $timeout, User, $location) {
    $scope.email = '';
    $scope.isValid = true;
    $scope.forgetPassword = function(frmObj) {
      if(frmObj.$valid) {
        User.forgetPassword({email: $scope.email}, function(data) {
          if(data.isValid) {
            $scope.message = 'We have sent you link to reset password';
            $location.path('/login');
          }
          else {
            $scope.message = 'Cannot process this request..Try again later !!!';
            $scope.isValid = false;
          }
        });
      }
      else {
        $scope.isValid = false;
      }
    };

    angular.element('.modal-backdrop.fade.in').remove();
  })
  .controller('ChangePasswordCtrl', function($scope, $stateParams, $timeout, User, $location, CryptoHelper) {

    $scope.inValidMessage = 'Please wait...';
    $scope.pleaseWait = true;
    $scope.notMatched = false;
    $scope.showMissmatchError = false;
    $scope.user = {
      password: '',
      cpassword: ''
    };

    User.forgetPassEmail({token: $stateParams.passtoken}, function(data) {
      if(data.isValid) {
        $scope.pleaseWait = false;
        $scope.user.token = data.token;
      }
      else {
        $scope.inValidMessage = 'Your forget password link is either expired or invalid.';
      }
    });

    $scope.matchPass = function() {
      $scope.notMatched = ($scope.user.password !== $scope.user.cpassword);
      return ($scope.user.password !== $scope.user.cpassword);
    };

    $scope.verifyPassAndConfirmPass = function() {
      if($scope.user.password === '' && $scope.user.password === ''){
         $scope.passwordMatch = ($scope.user.cpassword === $scope.user.password);
         $scope.showMissmatchError = !$scope.passwordMatch;
      }
    };

    $scope.confirmerror=false;
    $scope.showMatchError = function() {
      $scope.confirmerror=true;
      if($scope.user.cpassword != null){
        $scope.showMissmatchError = !($scope.user.cpassword === $scope.user.password);
      }else{
        if($scope.user.cpassword == undefined || $scope.user.password == undefined)
        {
          $scope.showMissmatchError = false;
        }
      }
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

    $scope.changePassword = function(frmObj) {
      if($scope.user.cpassword === $scope.user.password){
        if(frmObj.$valid) {
          $scope.user.password =  CryptoHelper.encrypt($scope.user.password);
          $scope.user.cpassword = CryptoHelper.encrypt($scope.user.cpassword);
          User.changeForgetPassword($scope.user, function(data) {
            if(!data.error) {
              $scope.message = 'Password successfully changed.';
              $timeout(function(){
                $location.path('/login');
              }, 1000);
            }
            else {
              $scope.pleaseWait = true;
              $scope.inValidMessage = 'Sorry, Invalid request!!';
            }
          });
        }
      }else{
        $scope.showMissmatchError = true;
      }
    };

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

    angular.element('.modal-backdrop.fade.in').remove();
  })

  .controller('SetPasswordCtrl', function($scope, $stateParams, $timeout, $location, User) {
    $scope.inValidMessage = '';
    $scope.notMatched = false;
    $scope.showMissmatchError = false;
    $scope.user = {
      password: '',
      cpassword: '',
      userid : $stateParams.userid
    };

    $scope.matchPass = function() {
      $scope.notMatched = ($scope.user.password !== $scope.user.cpassword);
      return ($scope.user.password !== $scope.user.cpassword);
    };

    $scope.verifyPassAndConfirmPass = function() {
      if($scope.user.password === '' && $scope.user.password === ''){
         $scope.passwordMatch = ($scope.user.cpassword == $scope.user.password);
         $scope.showMissmatchError = (!$scope.passwordMatch);
      }
    };

    $scope.confirmerror=false;
    $scope.showMatchError = function() {
      $scope.confirmerror=true;
      if($scope.user.cpassword != null){
        $scope.showMissmatchError = !($scope.user.cpassword === $scope.user.password);
      }else{
        if($scope.user.cpassword == undefined || $scope.user.password == undefined)
        {
          $scope.showMissmatchError = false;
        }
      }
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

    $scope.setPassword = function(form) {
      if($scope.user.cpassword === $scope.user.password){
        if(form.$valid) {
          $scope.inValidMessage = '';
          User.setPassword($scope.user, function(data) {
            if(!data.error) {
              $scope.message = data.message;
              $timeout(function(){
                $location.path('/login');
              }, 1000);
            }
            else {
              $scope.pleaseWait = true;
              $scope.inValidMessage = data.message;
            }
          });
        }
      }else{
        $scope.showMissmatchError = true;
      }
    };
  })

  .controller('SetPortfolioManagerPasswordCtrl', function($scope, $stateParams, $timeout, $location, User) {
      $scope.inValidMessage = '';
      $scope.notMatched = false;
      $scope.showMissmatchError = false;
      $scope.user = {
        password: '',
        cpassword: '',
        userid : $stateParams.userid
      };

      $scope.matchPass = function() {
        $scope.notMatched = ($scope.user.password != $scope.user.cpassword);
        return ($scope.user.password != $scope.user.cpassword);
      };

      $scope.verifyPassAndConfirmPass = function() {
        if($scope.user.password === '' && $scope.user.password === ''){
           $scope.passwordMatch = ($scope.user.cpassword == $scope.user.password);
           $scope.showMissmatchError = !$scope.passwordMatch;
        }
      };

      $scope.confirmerror=false;
      $scope.showMatchError = function() {
        $scope.confirmerror=true;
        if($scope.user.cpassword != null){
          $scope.showMissmatchError = !($scope.user.cpassword == $scope.user.password);
        }else{
          if($scope.user.cpassword == undefined || $scope.user.password == undefined)
          {
            $scope.showMissmatchError = false;
          }
        }
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

      $scope.setPMPassword = function(form) {
        if($scope.user.cpassword === $scope.user.password){
          if(form.$valid) {
            $scope.inValidMessage = '';
            User.setPortfolioManagerPassword($scope.user, function(data) {
              if(!data.error) {
                $scope.message = data.message;
                $timeout(function(){
                  $location.path('/login');
                }, 1000);
              }
              else {
                $scope.pleaseWait = true;
                $scope.inValidMessage = data.message;
              }
            });
          }
        }else{
          $scope.showMissmatchError = true;
        }
      };
    });
