'use strict';

angular.module('iCoinApp')
    .controller('MarketpresentationsCtrl', function($scope, Auth, Uploadmedia, User) {
        $scope.isLoggedIn = Auth.isLoggedIn;
        $scope.userRole = Auth.getCurrentUser() && Auth.getCurrentUser().role;

        if (!$scope.userRole) {
            var currentUser = User.get(function(userData) {
                Auth.setCurrentUser(userData);
                $scope.userRole = userData.role;
            });
        }
        $scope.saveMediaList = [];
        $scope.getsaveMedia = function() {
            Uploadmedia.getsaveMedia({
                mediauploadfor: 'Market Presentations'
            }, function(data) {
                $scope.saveMediaList = (data.data);
            });
        };

        $scope.getsaveMedia();

    });