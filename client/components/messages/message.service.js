'use strict';

angular.module('iCoinApp')
  .factory('MessageService', function ($resource, ApiPath) {
    return $resource(ApiPath + '/api/team-communications/:id/:controller', {
      id: '@_id'
    },
    {
      'sendMessage': {
        method: 'POST',
        params: {
          controller:'create'
        }
      },
      'sendMessageToAll': {
        method: 'POST',
        params: {
          controller:'createForAll'
        }
      },
      'get': {
        method: 'GET',
        params: {
        }
      },
      'updateFlags': {
        method: 'PUT',
        params: {
        }
      },
      trashMessage: {
        method: 'DELETE',
        params: {
        }
      }
	  });
  });
