'use strict';

angular.module('iCoinApp')
  .controller('AffiliatesReferralReportCtrl', function ($scope, $window, Affiliates) {
    $scope.rows = [];
    $scope.currentPage = 1;
    $scope.totalPages = 0;
    $scope.loadingText = '';
    $scope.error = '';
    $scope.pages = 1;
    $scope.loadPage = function() {
      $scope.error = '';
      $scope.loadingText = 'Please wait while loading...';
      Affiliates.get({type: 'other',page: $scope.currentPage}, function(affiliates) {
        $scope.affiliates=[];
        affiliates.data.forEach(function(affilate) {
          if(affilate.linktype != 'default') {
            $scope.affiliates.push(affilate);
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