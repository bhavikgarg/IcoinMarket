'use strict';

angular.module('iCoinApp')
    .controller('AdminAffilateBannersListCtrl', function($scope, Affiliates, AdminAccess) {

        AdminAccess.hasAdminAccess();
        $scope.isSoloAddAdmin = AdminAccess.isSoloAddAdmin;
        $scope.isFinanceAdmin = AdminAccess.isFinanceAdmin;
        $scope.isWatchUserAdmin = AdminAccess.isWatchUserAdmin;
        $scope.isModeratorAdmin = AdminAccess.isModeratorAdmin;
        $scope.isSupervisorAdmin = AdminAccess.isSupervisorAdmin;

        $scope.banners = [];

        $scope.loadBanners = function() {
            $scope.banners = [];
            Affiliates.getBanners(function(data) {
                $scope.banners = data.banners;
            });
        };

        $scope.deleteBanner = function(banner) {
            Affiliates.deleteBanner({
                id: banner.id
            }, function() {
                $scope.loadBanners();
            });
        };

        $scope.loadBanners();
    });