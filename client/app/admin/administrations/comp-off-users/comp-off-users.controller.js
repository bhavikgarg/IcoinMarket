'use strict';

angular.module('iCoinApp')
  .controller('CompOffUsersCtrl', function ($scope, $state, $sce, $cookieStore, $http, $location, $uibModal, $uibModalStack, $timeout, Auth, User, AdminAccess, Utilities, ApiPath, growl) {
    $scope.limit = 25;
    $scope.filter = { data: '' };
    $scope.pagination = {
      currentPage: 1,
      totalPages: 0
    }
    $scope.addCompoffSuccess = '', $scope.addCompoffError = '';

    AdminAccess.hasAdminAccess();
    $scope.isSoloAddAdmin = AdminAccess.isSoloAddAdmin;
    $scope.isFinanceAdmin = AdminAccess.isFinanceAdmin;
    $scope.isWatchUserAdmin = AdminAccess.isWatchUserAdmin;
    $scope.isModeratorAdmin = AdminAccess.isModeratorAdmin;
    $scope.isSupervisorAdmin = AdminAccess.isSupervisorAdmin;
    $scope.canSeeUserBackOffice = AdminAccess.canSeeUserBackOffice;
    $scope.isRefreshCall = false;

    $scope.selectedLevel = "-1";
    $scope.userDetail = "";

    // Use the User $resource to fetch all users
    $scope.loadPage = function () {
      if ($scope.isRefreshCall && $scope.filter.data != '') {
        return false;
      }

      User.getCompOffUsers({ page: $scope.pagination.currentPage, dataFilter: $scope.filter.data }, function (data) {
        $scope.compOffUsers = data.documents;
        $scope.pagination.totalPages = data.totalPages;
      });
    }

    $scope.loadBySearch = function () {
      $scope.isRefreshCall = false;
      $scope.loadPage();
    }

    $scope.enableCompOffUser = function (key, userid) {
      if (userid) {
        User.updateCompoffStatus({ userid: userid, isEnabled: true }, function (response) {
          if (!response.error) {
            $scope.compOffUsers[key].isEnabled = true;
          }
        })
      }
    }

    $scope.disableCompOffUser = function (key, userid) {
      if (userid) {
        User.updateCompoffStatus({ userid: userid, isEnabled: false }, function (response) {
          if (!response.error) {
            $scope.compOffUsers[key].isEnabled = false;
          }
        })
      }
    }

    $scope.searchUser = function () {
      $scope.userDetail = {};
      $scope.addCompoffError = '', $scope.addCompoffSuccess = '';
      User.query({ limit: 1, dataFilter: $scope.searchedUser, type: 'compoff' }, function (data) {
        if (data[0].error && data[0].error === true) {
          $scope.userDetailError = data[0].message;
          $scope.userDetail = "";
        } else {
          if(data[0].documents.length){
            $scope.userDetail = data[0].documents[0];
            $scope.selectedLevel = data[0].level.toString();
            $scope.userDetailError = "";
          }
          else{
            $scope.userDetailError = data[0].message;
            $scope.userDetail = "";
          }
        }
      }, function (error) {
          growl.addErrorMessage('Error : ' + res.data.message, { ttl: 5000 });
      });
    }

    $scope.addUserToCompOffList = function () {
      $scope.addCompoffError = '', $scope.addCompoffSuccess = '';
      if ($scope.userDetail) {
        User.addUserToCompOffList({ userid: $scope.userDetail._id, level: $scope.selectedLevel }, function (response) {
          if (response.error) {
            $scope.addCompoffError = response.message;
          } else {
            $scope.addCompoffSuccess = response.message;
            growl.addSuccessMessage(response.message , {ttl: 5000} );
            $scope.closeallmodals();
            //$scope.compOffUsers.push(response.data);
            //$scope.pagination.totalPages = $scope.pagination.totalPages + 1;
            //$scope.loadBySearch();
            //  User.getCompOffUsers({ page: $scope.pagination.currentPage, dataFilter: $scope.filter.data }, function (data) {
            //   $scope.compOffUsers = data.documents;
            //   $scope.pagination.totalPages = data.totalPages;
            // });
            $state.reload();
            // $scope.loadPage();
          }
        });
      } else {
        $scope.addCompoffError = 'Please provide user information to add';
      }
    }

    $scope.addToCompOffModal = function () {
      var modalInstance = $uibModal.open({
        templateUrl: 'app/admin/administrations/comp-off-users/add-to-comp-off.html',
        controller: 'CompOffUsersCtrl',
        size: 'sm',
        windowClass: 'large-width',
        backdrop: 'static',
        keyboard: false
      });
    }

    $scope.editCompOffUser = function(){
        var selectedUser = $scope.selectedUser;
        console.log(selectedUser);
        if (selectedUser.userid) {
            User.updateCompoffStatus({ userid: selectedUser.userid, level: selectedUser.level }, function (response) {
                if(response.error){
                    $scope.editCompOffError = response.message;
                }
                else{
                    $scope.editCompOffSuccess = response.message;
                    growl.addSuccessMessage(response.message , {ttl: 5000} );
                    $scope.closeallmodals();
                    // $state.reload();
                    $scope.loadPage();
                } 
            })
        }
    }

    $scope.deleteCompOffUser = function(key, userid){
         if (userid) {
            User.updateCompoffStatus({ userid: userid, isDeleted: true }, function (response) {
                if(response.error){
                    $scope.deleteCompOffError = response.message;
                }
                else{
                    $scope.deleteCompOffSuccess = response.message;
                    growl.addSuccessMessage(response.message , {ttl: 5000} );
                    $scope.closeallmodals();
                    $scope.loadPage();
                } 
            })
        }
    }

    $scope.openEditUserPopup = function(key,userid){
        $scope.selectedUser = $scope.compOffUsers[key];
        var modalInstance = $uibModal.open({
        templateUrl: 'app/admin/administrations/comp-off-users/edit-comp-off-users.html',
        controller: 'CompOffUsersCtrl',
        size: 'sm',
        windowClass: 'large-width',
        backdrop: 'static',
        keyboard: false,
        scope: $scope,
      });
    }

    $scope. xxx = function(){
         
    }

    $scope.closeallmodals = function () {
      $uibModalStack.dismissAll();
    }

    $scope.loadPage();
  });