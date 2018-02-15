'use strict';

angular.module('iCoinApp')
  .controller('SupportUsersReportCtrl', function ($scope, User, AdminAccess) {
    $scope.commissionData = '';
    $scope.loadingContent = '';

    $scope.tillDate = '';
    $scope.fromDate = '';
    $scope.nextAnchor = 0;
    $scope.prevAnchor = 0;
    $scope.limit = 25;
    $scope.isRefreshCall = false;

    $scope.dateFormat = 'yyyy-MM-dd';
    $scope.fromDateOptions = {
      formatYear: 'yy',
      startingDay: 1,
      showWeeks: false,
      //minDate: new Date(),
      maxDate: new Date()
    };

    $scope.fromDatePopup = {
      opened: false
    };
    $scope.tillDateOptions = {
      formatYear: 'yy',
      startingDay: 1,
      showWeeks: false,
      minDate: $scope.fromDate,
      maxDate: new Date()
    };

    $scope.tillDatePopup = {
      opened: false
    };

    $scope.$watch('fromDate', function (nv) {
      $scope.tillDateOptions.minDate = nv;
    });

    $scope.$watch('tillDate', function (nv) {
      if(nv)
        $scope.fromDateOptions.maxDate = new Date(nv.getTime()-(86400000));
    });

    $scope.OpentillDate = function () {
      $scope.tillDatePopup.opened = !$scope.tillDatePopup.opened;
      $scope.fromDatePopup.opened = false;
    };


    $scope.OpenfromDate = function () {
      $scope.fromDatePopup.opened = !$scope.fromDatePopup.opened;
      $scope.tillDatePopup.opened = false;
    };

    $scope.loadPage = function(pageIndex) {
        if ($scope.isRefreshCall && $scope.filter.data !== '') {
                return false;
            }
            $scope.pageId = 1;
            if (pageIndex) {
                $scope.pageId = pageIndex;
            }
      
      User.callersReport( {limit: $scope.limit, anchorId: $scope.nextAnchor, page : $scope.pageId, callstatus: $scope.callStatus, callerId: $scope.callerId, tillDate:$scope.tillDate, fromDate: $scope.fromDate}, function(response) {
          $scope.callerslogsList=response.result;
          $scope.totalPages = response.totalPages;
          console.log(response.result);
       });
    };

     User.supportUsersList({},function(data){
       $scope.supportUsersList=data.result;
    });


     $scope.searchUsers = function () {
            $scope.nextAnchor = undefined;
            $scope.loadPage();
     };

     $scope.loadBySearch = function () {
            $scope.isRefreshCall = false;
            $scope.searchUsers();
     };
     
     $scope.loadPage();

  })