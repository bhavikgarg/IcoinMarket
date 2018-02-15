'use strict';

angular.module('iCoinApp')
  .service('QueryDateFormat', function() {
    var monthArr = {
      '0':'01',
      '1':'02',
      '2':'03',
      '3':'04',
      '4':'05',
      '5':'06',
      '6':'07',
      '7':'08',
      '8':'09',
      '9':'10',
      '10':'11',
      '11':'12'
    };

    return {
      getDate: function(_date) {
        var _dd = parseInt(_date.getDate());
        return (_dd > 10 ? _dd : '0'+_dd);
      },
      getMonth: function(_date) {
        return monthArr[_date.getMonth()];
      }
    };
  })
  .controller('LeaderboardCtrl', function ($scope, Utilities, QueryDateFormat) {

    $scope.directs    = [{'last7Days': '', 'last30Days': '', 'allTime': ''}];
    $scope.maxTeam    = [{'last7Days': '', 'last30Days': '', 'allTime': ''}];
    $scope.directsLoading = true;
    $scope.maxTeamLoading = true;

    var currentDate   = new Date();
    var last7DayDate  = new Date();
    var last30DayDate = new Date();

    last7DayDate.setDate(last7DayDate.getDate() - 7);
    last30DayDate.setMonth(last30DayDate.getMonth() - 1);

    currentDate   = currentDate.getFullYear() + '-' + QueryDateFormat.getMonth(currentDate) + '-' + QueryDateFormat.getDate(currentDate);

    last7DayDate  = last7DayDate.getFullYear() + '-' + QueryDateFormat.getMonth(last7DayDate) + '-' + QueryDateFormat.getDate(last7DayDate);

    last30DayDate = last30DayDate.getFullYear() + '-' + QueryDateFormat.getMonth(last30DayDate) + '-' + QueryDateFormat.getDate(last30DayDate);

   Utilities.listMaxDirects({
      'last7d': last7DayDate,
      'last30d': last30DayDate,
      'today': currentDate
    }, function(data) {
      $scope.directsLoading = (data.maxDirects.length === 0);

      var members = data.maxDirects.allTime;
      var _last7Days = data.maxDirects.last7days || [];
      var _last30Days = data.maxDirects.last30days || [];
      $scope.directs = [];
      var flagUrl = data.maxDirects.flagUrl;
      for(var idx in members){

        if(
          (members[idx].users === 0 && _last7Days[idx] && _last30Days[idx]) ||
          (members[idx].users > 0)
        ) {
          $scope.directs.push({
            'last7Days': {
              name: (_last7Days[idx] ? _last7Days[idx].name : ' - '),
              showFlag: ((_last7Days[idx] ? _last7Days[idx].country.toLowerCase() : 'oth')!=='oth'),
              country: flagUrl.replace('FLAG_COUNTRY_CODE',(_last7Days[idx] ? _last7Days[idx].country.toLowerCase() : 'oth'))
            },
            'last30Days': {
              name: (_last30Days[idx] ? _last30Days[idx].name : ' - '),
              showFlag: ((_last30Days[idx] ? _last30Days[idx].country.toLowerCase() : 'oth')!=='oth'),
              country: flagUrl.replace('FLAG_COUNTRY_CODE',(_last30Days[idx] ? _last30Days[idx].country.toLowerCase() : ' oth '))
            },
            'allTime': {
              name: members[idx].name,
              showFlag: ((members[idx] ? members[idx].country.toLowerCase() : 'oth')!=='oth'),
              country: flagUrl.replace('FLAG_COUNTRY_CODE',(members[idx].country ? members[idx].country.toLowerCase() : 'oth'))
            }
          });
        }
      }
    });

   Utilities.getMaxTeamSize({
      'last7d': last7DayDate,
      'last30d': last30DayDate,
      'today': currentDate
    }, function(data) {
      $scope.maxTeamLoading = (data.maxTeamSize.length === 0);

      var members = data.maxTeamSize.allTime;
      var _last7Days = data.maxTeamSize.last7days || [];
      var _last30Days = data.maxTeamSize.last30days || [];
      $scope.maxTeam = [];
      var flagUrl = data.maxTeamSize.flagUrl;
      for(var idx in members){

        if(
          (members[idx].users === 0 && _last7Days[idx] && _last30Days[idx]) ||
          (members[idx].users > 0)
        ) {
          $scope.maxTeam.push({
            'last7Days': {
              name: (_last7Days[idx] ? _last7Days[idx].name : ' - '),
              showFlag: ((_last7Days[idx] ? _last7Days[idx].country.toLowerCase() : 'oth')!=='oth'),
              country: flagUrl.replace('FLAG_COUNTRY_CODE',(_last7Days[idx] ? _last7Days[idx].country.toLowerCase() : 'oth'))
            },
            'last30Days': {
              name: (_last30Days[idx] ? _last30Days[idx].name : ' - '),
              showFlag: ((_last30Days[idx] ? _last30Days[idx].country.toLowerCase() : 'oth')!=='oth'),
              country: flagUrl.replace('FLAG_COUNTRY_CODE',(_last30Days[idx] ? _last30Days[idx].country.toLowerCase() : ' oth '))
            },
            'allTime': {
              name: members[idx].name,
              showFlag: ((members[idx] ? members[idx].country.toLowerCase() : 'oth')!=='oth'),
              country: flagUrl.replace('FLAG_COUNTRY_CODE',(members[idx].country ? members[idx].country.toLowerCase() : 'oth'))
            }
          });
        }
      }
    });
  });
