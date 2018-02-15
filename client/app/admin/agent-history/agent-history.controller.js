'use strict';

angular.module('iCoinApp').controller('AgentLogCtrl', function($scope, $stateParams, $uibModal, $uibModalStack, User, AdminAccess) {

    AdminAccess.hasAdminAccess();
    $scope.isSoloAddAdmin = AdminAccess.isSoloAddAdmin;
    $scope.isFinanceAdmin = AdminAccess.isFinanceAdmin;
    $scope.isWatchUserAdmin = AdminAccess.isWatchUserAdmin;
    $scope.isModeratorAdmin = AdminAccess.isModeratorAdmin;
    $scope.isSupervisorAdmin = AdminAccess.isSupervisorAdmin;

    $scope.agentlog = {};
    $scope.agentlogInfo = {};
    $scope.currentPage = 1;
    $scope.totalPages = 0;

    $scope.loadPage = function() {

        User.getAgentLogs({
            page: $scope.currentPage
        }, function(info) {
            $scope.agentlogInfo = info.data;
            $scope.totalPages = info.rows;
        });
    };

    $scope.loadPage();
})