'use strict';

angular.module('iCoinApp')
  .controller('SettingsCtrl', function ($scope, $location, $timeout, User, Auth) {
    $scope.errors = {};

    $scope.verifyPassAndConfirmPass = function() {
      if($scope.user.confirmPassword==='' && $scope.user.newPassword===''){
         $scope.passwordMatch = ($scope.user.confirmPassword === $scope.user.newPassword);
         $scope.showMissmatchError = !$scope.passwordMatch;
      }
    };

    $scope.confirmerror=false;
    $scope.showMatchError = function() {
      $scope.confirmerror=true;
      if($scope.user.confirmPassword != null){
        $scope.showMissmatchError = !($scope.user.confirmPassword === $scope.user.newPassword);
      }else{
        if($scope.user.confirmPassword == undefined || $scope.user.newPassword == undefined)
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

    $scope.changePassword = function(form) {
      if($scope.user.confirmPassword === $scope.user.newPassword){
        $scope.submitted = true;
        if(form.$valid) {
          Auth.changePassword( $scope.user.oldPassword, $scope.user.newPassword )
          .then( function() {
            $scope.message = 'Password successfully changed.';
            sessionStorage.clear();
            $timeout(function(){
              $location.path('/userprofile');
            }, 1000);
          })
          .catch( function() {
            form.password.$setValidity('mongoose', false);
            $scope.errors.other = 'Incorrect password';
            $scope.message = '';
          });
        }
      }else{
        $scope.showMissmatchError = true;
      }
		};
  });
