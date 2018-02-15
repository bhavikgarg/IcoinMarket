   'use strict';

angular.module('iCoinApp')
  .controller('PortfolioManagerCtrl', function ($scope, AdminAccess, User, Utilities, $state, $timeout, $uibModal, $uibModalStack) {
      $scope.nextAnchor = 0;
      $scope.prevAnchor = 0;
      $scope.limit = 25;
      $scope.filter = { data: '' };

      AdminAccess.hasAdminAccess();
      $scope.isRefreshCall = false;
      $scope.loading = false;
      $scope.userType = 'manager';
      $scope.role = 'manager';
      // variables used
      $scope.countries = [];
      $scope.user = {};
      $scope.user.uploadDoc = '';
      $scope.saveError = '';
      $scope.saveSuccess = '';
      $scope.changeImage = false;
      $scope.user = {
          uploadDoc: '',
          country: '',
          stdcode: '',
          firstName: '',
          lastName: '',
          email: '',
          countryCode: '',
          mobile: ''
      };

      // Use the User $resource to fetch all users
      $scope.loadPage = function () {
          if ($scope.isRefreshCall && $scope.filter.data !== '') {
              return false;
          }

          User.getPortfolioManagers({ limit: $scope.limit, anchorId: $scope.nextAnchor, dataFilter: $scope.filter.data,role :$scope.role }, function (data) {
              $scope.users = data.documents;
              $scope.totalPages = data.totalPages;
              $scope.nextAnchor = data.nextAnchorId;
              $scope.prevAnchor = data.prevAnchorId;

              if (AdminAccess.isWatchUserAdmin() && $scope.filter.data === '') {
                  $timeout(function () {
                      $scope.nextAnchor = 0;
                      $scope.prevAnchor = 0;
                      $scope.isRefreshCall = true;
                      $scope.loadPage();
                  }, 10000);
              }
          });
      };

      var handleFileSelect = function (evt) {
          var file = evt.currentTarget.files[0];
          var reader = new FileReader();
          if (['image/jpeg', 'image/png'].indexOf(file.type) >= 0) {
              reader.onload = function (evt) {
                  $scope.$apply(function ($scope) {
                      $scope.user.uploadDoc = evt.target.result;
                      $scope.changeImage = true;
                  });
              };
              reader.readAsDataURL(file);
          }
      };
      angular.element(document.querySelector('#fileInput')).on('change', handleFileSelect);

      $scope.getCountries = function () {
          Utilities.getCountries(function (data) {
              $scope.countries = data.countries;
              $scope.user.country = $scope.countries[0].name;
              $scope.user.countryCode = $scope.countries[0].code;
              $scope.user.stdcode = $scope.countries[0].dial_code;
          });
      };

      $scope.getISDCodes = function () {
          Utilities.getISDCodes(function (data) {
              $scope.isdCodes = data.isdCodes;
              $scope.user.stdcode = $scope.isdCodes[0].dial_code;
          });
      };

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

      $scope.registerPortfolioManager = function (form) {
          if (form.$valid) {
              $scope.saveError = '';
              $scope.user.fullmobile = $scope.user.stdcode + '-' + $scope.user.mobile;
              $scope.user.access = 'public-read';
              $scope.loading = true;
              User.registerPortfolioManager($scope.user, function (response) {
                  if (!response.error) {
                      $scope.saveSuccess = response.message;
                      $timeout(function () {
                          $state.reload();
                      }, 2000);
                  } else {
                      $scope.saveError = response.message;
                  }
                  $scope.loading = false;
              });
          } else {
              $scope.saveError = 'Please provide appropriate inputs';
          }
      };

      $scope.loadBySearch = function () {
          $scope.isRefreshCall = false;
          $scope.loadPage();
      };

      $scope.blockUser = function (user) {
          User.remove({ id: user._id, blocked: true }, function () {
              user.isBlocked = true;
          });
      };

      $scope.unblockUser = function (user) {
          User.remove({ id: user._id, blocked: false }, function () {
              user.isBlocked = false;
          });
      };

      $scope.viewUserDoc = function (user) {
          $scope.userDoc = user.personaldoc;
          $uibModal.open({
              templateUrl: 'app/admin/user-doc-view.html',
              controller: 'PortfolioManagerCtrl',
              size: 'md',
              scope: $scope,
              backdrop: true,
              keyboard: false
          });
      };

      $scope.closeallmodals = function () {
          console.log('Done');
          $uibModalStack.dismissAll();
      };
      $scope.loadPage();
      $scope.getCountries();
      $scope.getISDCodes();
  });