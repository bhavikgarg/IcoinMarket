'use strict';

angular
    .module('iCoinApp')
    .controller('AdminKycCtrl',
    function ($scope, $state, $sce, $cookieStore, $http, $location, $uibModal, $uibModalStack, $timeout, Auth, User, Usermeta, AdminAccess) {
        $scope.nextAnchor = 0;
        $scope.prevAnchor = 0;
        $scope.currentAnchor = 1;
        $scope.limit = 50;
        var currentStatusScope = 'UNVERIFIED';

        AdminAccess.hasAdminAccess();
        $scope.isSuperAdmin = AdminAccess.isSuperAdmin;
        $scope.isSoloAddAdmin = AdminAccess.isSoloAddAdmin;
        $scope.isFinanceAdmin = AdminAccess.isFinanceAdmin;
        $scope.isWatchUserAdmin = AdminAccess.isWatchUserAdmin;
        $scope.isModeratorAdmin = AdminAccess.isModeratorAdmin;
        $scope.isSupervisorAdmin = AdminAccess.isSupervisorAdmin;
        $scope.canSeeUserBackOffice = AdminAccess.canSeeUserBackOffice;
        $scope.isRefreshCall = false;

        // Use the User $resource to fetch all users
        $scope.loadPage = function () {
            if (currentStatusScope === 'UNVERIFIED' && $scope.isSupervisorAdmin()) {
                currentStatusScope = 'VERIFIED';
            }
            else if (currentStatusScope === 'UNVERIFIED' && $scope.isModeratorAdmin()) {
                currentStatusScope = 'PENDING';
            }

            Usermeta.getKycRecords({
                limit: $scope.limit,
                page: $scope.currentAnchor,
                flag: currentStatusScope,
                searchParam: null
            }, function (data) {
                $scope.usermetas = data.result.data;
                //$scope.totalPages = (data.result.data.total / data.result.data.limit) ;
                $scope.nextAnchor = data.result.nextAnchorId;
                $scope.prevAnchor = data.result.prevAnchorId;
                $scope.currentPage = data.result.currentAnchorId;
                $scope.totalPages = data.result.total;
                $scope.pageLimit = data.result.limit;
                $scope.serialNum = (($scope.currentPage - 1) * $scope.pageLimit);
            });
        };
        $scope.loadPage(currentStatusScope);

        $scope.changeStatus = function (status) {
            currentStatusScope = status;
            $scope.loadPage();
        };

        $scope.passlevel = function (obj) {
            $scope.currentAnchor = obj.currentPage;
            $scope.loadPage();
        };

        $scope.jumpOnPage = '';
        $scope.jumpToPage = function () {
            var jumpToPage = (($scope.jumpOnPage == '' || $scope.jumpOnPage == 0 || isNaN($scope.jumpOnPage) || parseInt(jumpToPage) <= 0) ? $scope.currentAnchor : parseInt($scope.jumpOnPage));

            var maxLimit = parseInt(($scope.totalPages / $scope.pageLimit));
            maxLimit = (((maxLimit * $scope.pageLimit) < $scope.totalPages) ? (maxLimit + 1) : maxLimit);

            jumpToPage = ((jumpToPage > maxLimit) ? maxLimit : jumpToPage);
            $scope.jumpOnPage = jumpToPage;
            $scope.passlevel({ currentPage: jumpToPage });
        };

        $scope.search = function () {
            Usermeta.getKycRecords({
                limit: $scope.limit,
                page: $scope.currentAnchor,
                flag: currentStatusScope,
                searchParam: $scope.filter.data
            }, function (data) {
                $scope.usermetas = data.result.data;
                //$scope.totalPages = (data.result.data.total / data.result.data.limit) ;
                $scope.nextAnchor = data.result.nextAnchorId;
                $scope.prevAnchor = data.result.prevAnchorId;
                $scope.currentPage = data.result.currentAnchorId;
                $scope.totalPages = data.result.total;
                $scope.pageLimit = data.result.limit;
                $scope.serialNum = (($scope.currentPage - 1) * $scope.pageLimit);
            });
        };

        $scope.showUserPages = function (userId) {
            $scope.currentUserId = userId;
            $uibModal.open({
                templateUrl: 'app/admin/user-kyc.html',
                controller: 'AdminUserKycCtrl',
                size: 'lg',
                scope: $scope,
                windowClass: 'large-width',
                backdrop: 'static',
                keyboard: false
            });
        };

        $scope.closeModal = function () {
            $uibModalStack.dismissAll();
        };

        // force close already opened dialogs
        $scope.closeModal();
    })
    .controller('AdminUserKycCtrl',
    function ($scope, $state, $sce, $cookieStore, $http, $location, $uibModal, $uibModalStack, $timeout, Auth, User, Usermeta, AdminAccess, Utilities, ApiPath, growl) {

        AdminAccess.hasAdminAccess();
        $scope.isSuperAdmin = AdminAccess.isSuperAdmin;
        $scope.isSoloAddAdmin = AdminAccess.isSoloAddAdmin;
        $scope.isFinanceAdmin = AdminAccess.isFinanceAdmin;
        $scope.isWatchUserAdmin = AdminAccess.isWatchUserAdmin;
        $scope.isModeratorAdmin = AdminAccess.isModeratorAdmin;
        $scope.isSupervisorAdmin = AdminAccess.isSupervisorAdmin;
        $scope.canSeeUserBackOffice = AdminAccess.canSeeUserBackOffice;

        $scope.hasPreviousMeta = false;
        $scope.previousMeta = [];

        $scope.userDetails = '';
        $scope.fetchUserKyc = function () {
            Usermeta.getUserKycRecord({
                id: $scope.currentUserId
            }, function (data) {
                $scope.userDetails = data.result;
                $scope.getSignedUrl(data.result.s3asset.selfie, function (data) {
                    $scope.userSelfie = $sce.trustAsResourceUrl(data);
                });
                $scope.getSignedUrl(data.result.s3asset.id_1, function (data) {
                    $scope.userGovid = $sce.trustAsResourceUrl(data);
                });

                $scope.getPreviousMetas(data.result._id);
            });

        };
        $scope.fetchUserKyc();

        $scope.getSignedUrl = function (url, cb) {
            $http.post(ApiPath + '/api/kyc/get-signed-url', { url: url }).then(function (res) {
                if (res.data.error) {
                    growl.addErrorMessage('Error : ' + res.data.message, { ttl: 5000 });
                } else {
                    cb(res.data.result.url);
                }
            }, function () {
                growl.addErrorMessage('Something went wrong. Please try again', { ttl: 5000 });
            });
        };

        $scope.save = function () {
            //var user = Auth.getCurrentUser();

            if ($scope.userDetails.assetsStatus.selfie !== 'ACCEPTED' || $scope.userDetails.assetsStatus.id_1 !== 'ACCEPTED') {
                if ($scope.isSupervisorAdmin()) {
                    $scope.userDetails.admin.flag = 'REJECTED';
                }
                if ($scope.isModeratorAdmin()) {
                    $scope.userDetails.moderator.flag = 'REJECTED';
                }
            }

            if ($scope.isSuperAdmin() || $scope.isSupervisorAdmin()) {
                console.log($scope.userDetails);
                $http.post(ApiPath + '/api/kyc/update-user-kyc', {
                    userId: $scope.userDetails.user.id,
                    status: $scope.userDetails.admin.flag,
                    comments: $scope.userDetails.admin.comments,
                    rejectReason: $scope.userDetails.admin.rejectReason,
                    assetsStatus: $scope.userDetails.assetsStatus
                }).then(function (res) {
                    console.log(res.data);
                    if (res.data.error) {
                        growl.addErrorMessage('Error : ' + res.data.message, { ttl: 5000 });
                    } else {
                        growl.addErrorMessage('User KYC updated', { ttl: 5000 });
                        $uibModalStack.dismissAll();
                        $state.reload();
                    }
                }, function () {
                    growl.addErrorMessage('Something went wrong. Please try again', { ttl: 5000 });
                });
            }

            if ($scope.isModeratorAdmin()) {
                $http.post(ApiPath + '/api/kyc/update-user-kyc', {
                    userId: $scope.userDetails.user.id,
                    status: $scope.userDetails.moderator.flag,
                    comments: $scope.userDetails.moderator.comments,
                    rejectReason: $scope.userDetails.moderator.rejectReason,
                    assetsStatus: $scope.userDetails.assetsStatus
                }).then(function (res) {
                    console.log(res.data);
                    if (res.data.error) {
                        growl.addErrorMessage('Error : ' + res.data.message, { ttl: 5000 });
                    } else {
                        growl.addErrorMessage('User KYC updated', { ttl: 5000 });
                        $uibModalStack.dismissAll();
                        $state.reload();
                    }
                }, function () {
                    growl.addErrorMessage('Something went wrong. Please try again', { ttl: 5000 });
                });
            }
        };

        $scope.closeUserKyc = function () {
            $uibModalStack.dismissAll();
        };

        $scope.getPreviousMetas = function (reqId) {
            Usermeta.getPreviousMetas({ metaid: reqId }, function (data) {
                if (!data.error) {
                    $scope.hasPreviousMeta = true;
                    $scope.previousMeta = data.result;
                }
            });
        };

        $scope.displayTable = false;
        $scope.displayPreviousMeta = function () {
            $scope.displayTable = true;
        };

        $scope.loadImage = function (key, type) {
            var data = $scope.previousMeta[key];
            $scope.getSignedUrl(((type == 1) ? data.s3asset.selfie : data.s3asset.id_1), function (data) {
                angular.element('#img-' + type + '-' + key).attr('src', data).show();
                angular.element('#img-btn-' + type + '-' + key).hide();
            });
        };
    });
