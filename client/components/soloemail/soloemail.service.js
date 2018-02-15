'use strict';

angular.module('iCoinApp')
  .factory('SoloEmails', function ($resource, ApiPath) {
    return $resource(ApiPath + '/api/soloemails/:id/:controller', {
      id: '@_id'
    },
    {
      'updateSoloEmail': {
        method: 'PATCH',
        params: {
          controller: 'soloemail-update'
        }
      },
      'getSoloEmailInfo': {
        method: 'POST',
        params: {
          controller: 'soloemail-content'
        }
      },
      'isDateAvailable': {
        method: 'POST',
        params: {
          controller: 'soloemail-brodcast-valid'
        }
      },
      'blockSoloEmail': {
        method: 'DELETE',
        params: {
        }
      },
      'getBlockedDates': {
        method: 'GET',
        params: {
          controller: 'soloemail-blocked-dates'
        }
      }
	  });
  });
