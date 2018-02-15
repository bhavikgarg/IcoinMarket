'use strict';

angular.module('iCoinApp')
    .controller('AffiliatesBannersCtrl', function($scope, $window, Affiliates) {
        $scope.banners = [];
        var _baseOrigin = $window.location.origin;
        var __origin = _baseOrigin + '/refb';
        $scope.loadBanners = function() {
            $scope.banners = [];
            Affiliates.getBanners(function(data) {
                //$scope.banners = data.banners;
                data.banners.forEach(function(banner) {
                    var _banner = banner;
                    var imagePath = banner.image;
                    if (imagePath && /^http(s{0,1}):\/\//.test(imagePath) === false) {
                        imagePath = _baseOrigin + '/' + imagePath;
                    }

                    _banner.viewUrl = __origin + '/SPONSOR_ID/BANNER_ID';
                    _banner.userViewScript = '';
                    _banner.userTitle = '';
                    _banner.viewscript = '<div><a href="' + _banner.viewUrl + '" target="_blank"><img src="' + imagePath + '" alt="Compnay" height="' + banner.height + '" width="' + banner.width + '" /></a></div>';
                    $scope.banners.push(_banner);
                });
            });
        };

        $scope.createBannerCampaign = function(key) {
            var _banner = $scope.banners[key];
            Affiliates.createBannerPromotion({
                title: _banner.userTitle,
                bannerInfo: {
                    id: _banner.id,
                    target: _banner.target,
                    createdat: _banner.createdat
                }
            }, function(data) {
                var imagePath = _banner.image;
                var _viewUrl = __origin + '/' + data.memberid + '/' + data.uniqueid;
                if (imagePath && /^http(s{0,1}):\/\//.test(imagePath) === false) {
                    imagePath = _baseOrigin + '/' + imagePath;
                }

                _banner.userViewScript = '<div><a href="' + _viewUrl + '" target="_blank"><img src="' + imagePath + '" alt="Compnay" height="' + _banner.height + '" width="' + _banner.width + '" /></a></div>';
            });
        };

        $scope.loadBanners();
    });