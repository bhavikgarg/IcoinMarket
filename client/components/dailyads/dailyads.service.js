'use strict';

angular.module('iCoinApp')
  .factory('DailyAds', function ($resource, ApiPath) {
    return $resource(ApiPath + '/api/dailyads/:id/:controller', {
      id: '@_id'
    },
    {
      'updateDailyAds': {
        method: 'PATCH',
        params: {
          controller: 'dailyad-update'
        }
      },
      'getDailyAdsInfo': {
        method: 'POST',
        params: {
          controller: 'dailyad-content'
        }
      },
      'isDateAvailable': {
        method: 'POST',
        params: {
          controller: 'dailyad-brodcast-valid'
        }
      },
      'getTodaysAd': {
        method: 'GET',
        params: {
          controller: 'today-dailyad'
        }
      },
      'blockAd': {
        method: 'DELETE',
        params: {
        }
      },
      'getBookedDates': {
        method: 'GET',
        params: {
          controller: 'dailyads-booked-dates'
        }
      }
	  });
  });
