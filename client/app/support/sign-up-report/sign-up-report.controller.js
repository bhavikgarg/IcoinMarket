'use strict';

angular.module('iCoinApp')
  .controller('SignUpReportCtrl', function($scope, Purchase, Utilities) {
    $scope.statisticsError = '';
    $scope.duration = {};
    $scope.startDate = new Date();
    $scope.endDate = new Date();
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

    $scope.setDate = function(year, month, day) {
      $scope.startDate = new Date(year, month, day);
      $scope.endDate = new Date(year, month, day);
    };

    $scope.formats = ['dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd.MM.yyyy', 'shortDate'];
    $scope.format = $scope.formats[0];
    $scope.altInputFormats = ['M!/d!/yyyy'];

    $scope.getDetailsByDate = function() {
      $scope.duration = {
        startDate : $scope.startDate.getTime(),
        endDate : $scope.endDate.getTime()
      }
      $scope.signUpReport();
    }

    $scope.signUpReport = function() {
      Utilities.signUpReport($scope.duration,function(data) {
        $scope.countries = data.stats;
      });
    }
    $scope.signUpReport();


    $scope.open1 = function() {
      $scope.popup1.opened = true;
    };

    $scope.open2 = function() {
      $scope.endDateOptions.minDate = $scope.startDate;
      $scope.popup2.opened = true;
    };

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

  })
