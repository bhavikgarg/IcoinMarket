'use strict';

angular.module('iCoinApp')
    .controller('DailyTrainingCtrl', function($scope, Utilities, Auth, Uploadmedia, $uibModal, $uibModalStack, User) {
        $scope.isLoggedIn = Auth.isLoggedIn;
        $scope.userRole = Auth.getCurrentUser() && Auth.getCurrentUser().role;
        if (!$scope.userRole) {
            var currentUser = User.get(function(userData) {
                Auth.setCurrentUser(userData);
                $scope.userRole = userData.role;
            });
        }
        // $scope.message = 'Hello';
        // console.log('Hello');
        // Utilities.getStaticContent({
        //   type: 'video',
        //   subtype: 'daily-training'
        // }, function(res) {
        //   $scope.staticContent = res.videos;
        // });

        $scope.saveMediaList = [];
        $scope.getsaveMedia = function() {
            Uploadmedia.getsaveMedia({
                mediauploadfor: 'Training Videos'
            }, function(data) {
                $scope.saveMediaList = (data.data);
            });
        };

        $scope.getsaveMedia();
        $scope.openmodal = function(title, fileurl) {
            $scope.url = fileurl;
            $scope.vediotitle = title;
            $uibModal.open({
                templateUrl: 'app/training/videos-popup.html',
                scope: $scope,
                size: 'md',
                backdrop: 'static',
                keyboard: false
            });
        };

        $scope.closeallmodals = function() {
            $uibModalStack.dismissAll();
        };
    });