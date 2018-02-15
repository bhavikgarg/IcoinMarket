'use strict';

angular.module('iCoinApp')
  .controller('TopCommissionUsersCtrl', function ($scope, User, AdminAccess) {

    AdminAccess.hasAdminAccess();
    $scope.isSoloAddAdmin = AdminAccess.isSoloAddAdmin;
    $scope.isFinanceAdmin = AdminAccess.isFinanceAdmin;
    $scope.isWatchUserAdmin = AdminAccess.isWatchUserAdmin;
    $scope.isModeratorAdmin = AdminAccess.isModeratorAdmin;
    $scope.isSupervisorAdmin = AdminAccess.isSupervisorAdmin;
    $scope.commissionData = '';
    $scope.loadingContent = '';

    User.getTopCommissionUsers({

    }, function (data) {
      $scope.commissionData = data.data;
    });
  })