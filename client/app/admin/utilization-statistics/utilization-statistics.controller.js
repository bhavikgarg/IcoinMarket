'use strict';

angular.module('iCoinApp')
  .controller('UtilizationStatisticsCtrl', function($scope, Purchase) {
    $scope.totalCIGoldCoins = 0,
    $scope.totalAdsCashCoins = 0,
    $scope.totalUSD = 0,
    $scope.totalCommitments = 0,
    $scope.totalWithdrawls = 0,
    $scope.statisticsError = '';
    $scope.duration = {};
    $scope.startDate = new Date();
    $scope.endDate = new Date();

    $scope.clear = function() {
      $scope.startDate = null;
      $scope.endDate = null;
    };

    $scope.endDateOptions = {
      formatYear: 'yy',
      maxDate: new Date(),
      startingDay: 1
    };

    $scope.startDateOptions = {
      formatYear: 'yy',
      maxDate: new Date(),
      startingDay: 1
    };

    // Disable weekend selection
    function disabled(data) {
      var date = data.date,
        mode = data.mode;
      return mode === 'day' && (date.getDay() === 0 || date.getDay() === 6);
    }

    $scope.open1 = function() {
      $scope.popup1.opened = true;
    };

    $scope.open2 = function() {
      $scope.endDateOptions.minDate = $scope.startDate;
      $scope.popup2.opened = true;
    };

    $scope.setDate = function(year, month, day) {
      $scope.startDate = new Date(year, month, day);
      $scope.endDate = new Date(year, month, day);
    };

    $scope.formats = ['dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd.MM.yyyy', 'shortDate'];
    $scope.format = $scope.formats[0];
    $scope.altInputFormats = ['M!/d!/yyyy'];

    $scope.popup1 = {
      opened: false
    };

    $scope.popup2 = {
      opened: false
    };

    var tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    var afterTomorrow = new Date();
    afterTomorrow.setDate(tomorrow.getDate() + 1);
    $scope.events = [
      {
        date: tomorrow,
        status: 'full'
      },
      {
        date: afterTomorrow,
        status: 'partially'
      }
    ];

    function getDayClass(data) {
      var date = data.date,
        mode = data.mode;
      if (mode === 'day') {
        var dayToCheck = new Date(date).setHours(0,0,0,0);

        for (var i = 0; i < $scope.events.length; i++) {
          var currentDay = new Date($scope.events[i].date).setHours(0,0,0,0);

          if (dayToCheck === currentDay) {
            return $scope.events[i].status;
          }
        }
      }
      return '';
    }

    $scope.getDetailsByDate = function() {
      //var userTzOffset = new Date().getTimezoneOffset(); // -330 for India
      if($scope.endDate && $scope.startDate){
          $scope.endDate = new Date($scope.endDate);
          $scope.endDate.setHours(23,59,59,0);
          $scope.endDate1 = new Date($scope.endDate.getTime()).toISOString();
          $scope.startDate = new Date($scope.startDate);
          $scope.startDate.setHours(0,0,0,0);
          $scope.startDate1 = new Date($scope.startDate.getTime()).toISOString();
        }
      $scope.duration = {
        startDate : $scope.startDate1,
        endDate : $scope.endDate1
      }
      $scope.getStatistics();
    }

    $scope.getStatistics = function() {
      Purchase.getStatistics($scope.duration,function(data) {
        if(data.error) {
          $scope.statisticsError = data.message;
        }
        // $scope.totalCIGoldCoins = data.Tcigoldcoin;
        // $scope.totalAdsCashCoins = data.Tadscash;
        $scope.totalUSD = data.Tusd;
        // $scope.pendingCIGoldCoins = data.Pcigoldcoin;
        // $scope.pendingAdsCashCoins = data.Padscash;
        $scope.pendingUSD = data.Pusd;
        // $scope.cancelledCIGoldCoins = data.Ccigoldcoin;
        // $scope.cancelledAdsCashCoins = data.Cadscash;
        $scope.cancelledUSD = data.Cusd;

        $scope.totalCommitments = data.commitments;
        $scope.totalWithdrawls = data.withdrawls;
      });
    }
    $scope.getStatistics();
  })
