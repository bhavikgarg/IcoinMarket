'use strict';

angular.module('iCoinApp')
  .factory('Tasks', function ($resource, ApiPath) {
    return $resource(ApiPath + '/api/tasks/:id/:controller', {
      id: '@_id'
    },
    {
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
        }
      },
      'update': {
        method: 'PUT',
        params: {
        }
      },
      'addUserDoneTask': {
        method: 'POST',
        params: {
          controller: 'user-task'
        }
      },
      inactive: {
        method: 'DELETE',
        params: {

        }
      },
      'getUserTaks': {
        method: 'GET',
        params: {
          controller: 'user-tasks'
        }
      }
	  });
  });
