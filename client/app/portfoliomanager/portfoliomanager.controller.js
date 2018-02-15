'use strict';

angular.module('iCoinApp')
    .controller('PortfoliomanagerCtrl', function($scope, Utilities, QueryDateFormat, User, AdminAccess) {
        $scope.nextAnchor = 0;
        $scope.prevAnchor = 0;
        $scope.limit = 25;
        $scope.filter = {
            data: ''
        };
        $scope.loadPage = function() {
            if ($scope.isRefreshCall && $scope.filter.data !== '') {
                return false;
            }
            User.getPortfolioManagers({
                limit: $scope.limit,
                anchorId: $scope.nextAnchor,
                dataFilter: $scope.filter.data
            }, function(data) {
                $scope.users = data.documents;
                $scope.totalPages = data.totalPages;
                $scope.nextAnchor = data.nextAnchorId;
                $scope.prevAnchor = data.prevAnchorId;

                if (AdminAccess.isWatchUserAdmin() && $scope.filter.data === '') {
                    $timeout(function() {
                        $scope.nextAnchor = 0;
                        $scope.prevAnchor = 0;
                        $scope.isRefreshCall = true;
                        $scope.loadPage();
                    }, 10000);
                }
            });
        };
        // AdminAccess.hasAdminAccess();
        // $scope.isSoloAddAdmin = AdminAccess.isSoloAddAdmin;
        // $scope.isFinanceAdmin = AdminAccess.isFinanceAdmin;
        // $scope.isWatchUserAdmin = AdminAccess.isWatchUserAdmin;
        // $scope.isModeratorAdmin = AdminAccess.isModeratorAdmin;
        // $scope.isSupervisorAdmin = AdminAccess.isSupervisorAdmin;
        // $scope.canSeeUserBackOffice = AdminAccess.canSeeUserBackOffice;
        $scope.isRefreshCall = false;
        $scope.loading = false;

        // $scope.loadBySearch = function() {
        //     $scope.isRefreshCall = false;
        //     $scope.loadPage();
        // };

        // $scope.loadPage();
    });