'use strict';

angular.module('iCoinApp')
  .factory('Affiliates', function ($resource, ApiPath) {
    return $resource(ApiPath + '/api/affiliates/:id/:controller/:username/:uniqueid', {
      id: '@_id'
    },
    {
      get: {
        method: 'GET',
        params: {
        }
      },

      addDefault: {
        method: 'POST',
        params: {
          controller: 'default-affilate'
        }
      },

      create: {
        method: 'POST',
        params: {
        }
      },

      update: {
        method: 'PUT',
        params: {}
      },

      removeAffilate: {
        method: 'delete',
        params: {
        }
      },

      findByTarget: {
        method: 'GET',
        params: {
          controller: 'valid-referral'
        }
      },

      createBanner: {
        method: 'POST',
        params: {
          controller: 'create-banner'
        }
      },

      getBanners: {
        method: 'GET',
        params: {
          controller: 'affilate-banners'
        }
      },

      deleteBanner: {
        method: 'DELETE',
        params: {
          controller: 'remove-banner'
        }
      },

      createBannerPromotion: {
        method: 'POST',
        params: {
          controller: 'create-banner-promotion'
        }
      },

      getHists: {
        method: 'GET',
        params: {
          controller: 'total-hits'
        }
      },
      updateVisit: {
        method: 'GET',
        params: {
          controller: 'update-visit'
        }
      }
      });
  });
