'use strict';

angular.module('iCoinApp')
  .factory('SoloAdds', function ($resource, ApiPath) {
    return $resource(ApiPath + '/api/soloadds/:id/:controller', {
      id: '@_id'
    },
    {
      'createSoloAdd': {
        method: 'POST',
        params: {
        }
      },
      'updateSoloAdd': {
        method: 'PATCH',
        params: {
        }
      }
	  });
  });
