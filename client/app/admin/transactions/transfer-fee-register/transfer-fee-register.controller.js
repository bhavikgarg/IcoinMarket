'use strict';

angular.module('iCoinApp')
  .controller('TransferFeeRegisterCtrl', function($scope, Purchase, AdminAccess) {
    AdminAccess.hasAdminAccess();
    $scope.isSoloAddAdmin = AdminAccess.isSoloAddAdmin;
    $scope.isFinanceAdmin = AdminAccess.isFinanceAdmin;
    $scope.isWatchUserAdmin = AdminAccess.isWatchUserAdmin;
    $scope.isModeratorAdmin     = AdminAccess.isModeratorAdmin;
    $scope.isSupervisorAdmin    = AdminAccess.isSupervisorAdmin;

    $scope.currentPage = 1;
    $scope.filter = {data: ''};
    $scope.transferInfo = {}
    $scope.totalPages = 0;
    $scope.transferInfoFee = 0;

    $scope.loadPage = function() {
      var query = {page: $scope.currentPage};
      if($scope.filter.data != '') {
        query.fdata = $scope.filter.data;
      }

      Purchase.transferFeeRegister(query, function(info) {
        $scope.transferInfo = info.data;
        $scope.totalPages = info.rows;
        $scope.transferInfoFee = roundNumber(info.totalTransfer, 4);
      });
    }

    $scope.filterRecords = function() {
      $scope.currentPage = 1;
      $scope.loadPage();
    }

    $scope.loadPage();
  });