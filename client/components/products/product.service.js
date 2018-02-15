'use strict';

angular.module('iCoinApp')
  .factory('Products', function ($resource, ApiPath) {
    return $resource(ApiPath + '/api/products/:id/:controller', {
      id: '@_id'
    },
    {
      'getProductTypes': {
        method: 'GET',
        params: {
          controller: 'producttypes'
        }
      },
      'create': {
        method: 'POST',
        params: {
          controller:'create'
        }
      },
      'get': {
        method: 'GET',
        params: {
        }
      },
      'getItem': {
        method: 'GET',
        params: {
          controller: 'show'
        }
      },
      'update': {
        method: 'PUT',
        params: {
          controller:'update'
        }
      },
      'remove': {
        method: 'DELETE',
        params: {
          controller:'remove'
        }
      }
	  });
  });
