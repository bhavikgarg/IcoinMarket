'use strict';

angular.module('iCoinApp')
  .controller('AffiliatesBannersReportCtrl', function($scope, Affiliates) {

    $scope.rows = [];
    $scope.currentPage = 1;
    $scope.totalPages = 0;
    $scope.loadingText = '';
    $scope.error = '';
    $scope.pages = 1;

    $scope.loadPage = function() {
      $scope.error = '';
      $scope.loadingText = 'Please wait while loading...';
      Affiliates.get({type: 'banner',page: $scope.currentPage}, function(affiliates) {
        $scope.banners = [];
        affiliates.data.forEach(function(affilate) {
          if(affilate.linktype != 'default') {
            $scope.banners.push(affilate);
          }
        });
        $scope.viewLimit   = affiliates.limit;
        $scope.totalPages  = affiliates.rows;
        $scope.loadingText = '';
        if( $scope.totalPages > 10) {
          $scope.pages = Math.ceil($scope.totalPages/10);
        }
      });
    };

    // Go to Specific Page
    $scope.updatePage = function() {
      if($scope.getPage) {
        if($scope.getPage > $scope.pages) {
          $scope.error = 'Page not found';
        }else {
          $scope.currentPage = $scope.getPage;
          $scope.loadPage();
        }
      }
    };

    $scope.loadPage();
  });
