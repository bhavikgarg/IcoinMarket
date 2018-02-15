'use strict';
angular.module('iCoinApp')
  .factory('ConfigurationService', function ($resource, ApiPath) {
    return $resource(ApiPath + '/api/configuration/:id/:controller', {
      id: '@_id'
    },
    {
      'updateConfig': {
        method: 'POST',
        params: {
          controller:'update-config'
        }
      },
      'getConfig': {
        method: 'GET',
        params: {
          controller:'get-config'
        }
      }
	  });
  });
