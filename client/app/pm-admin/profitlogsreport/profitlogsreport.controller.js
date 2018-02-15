angular.module('iCoinApp')
    .controller('ProfitLogsReportCtrl', function ($scope, $rootScope, User, Auth, CommitmentsService, $cookies, AdminAccess, $ngConfirm) {
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
        if($scope.tillDate && $scope.fromDate){
          $scope.tillDate = new Date($scope.tillDate);
          $scope.tillDate.setHours(23,59,59,0);
          $scope.tillDate1 = new Date($scope.tillDate.getTime()).toISOString();
          $scope.fromDate = new Date($scope.fromDate);
          $scope.fromDate.setHours(0,0,0,0);
          $scope.fromDate1 = new Date($scope.fromDate.getTime()).toISOString();
        }
      
      User.profitLogsReport( {limit: $scope.limit, anchorId: $scope.nextAnchor, page : $scope.pageId, portfolioManagerId: $scope.portfolioManager, tillDate:$scope.tillDate1, fromDate: $scope.fromDate1}, function(response) {
          $scope.profitLogsList=response.result;
          $scope.totalPages = response.totalPages;
          console.log(response.result);
       });
    };

     User.portfolioManagersList({},function(data){
       $scope.portfolioManagersList=data.result;
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

    });