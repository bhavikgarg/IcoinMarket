'use strict';

angular.module('iCoinApp')
  .factory('GenealogyService', function ($resource, ApiPath) {
    return $resource(ApiPath + '/api/genealogys/:id/:controller/:listlevel/:referenceUser/:page/:viewas/:dir/:dd/:from/:to/:minusers/:maxusers/:rank/:mingoldpacks/:maxgoldpacks/:minsilverpacks/:maxsilverpacks/:searchfield/:search', {

      id: '@_id'
    },
    {
      place: {
        method: 'POST',
        params: {
          controller:'create'
        }
      },
      get: {
        method: 'GET',
        params: {
          id:'me'
        }
      },

      listView: {
        method: 'GET',
        params: {
          controller:'list-view'
        }
      },

      levelView: {
        method: 'GET',
        params: {
          controller:'level-view'
        }
      },

      exportView: {
        method: 'POST',
        params: {
          controller:'export-members'
        }
      },

      listDirects: {
        method: 'POST',
        params: {
          controller: 'list-directs'
        }
      },

      listAllTimeDirects: {
        method: 'POST',
        params: {
          controller: 'list-all-members'
        }
      },

      getMySignups: {
        method: 'GET',
        params: {
          controller: 'total-signups'
        }
      }
	  });
  });
