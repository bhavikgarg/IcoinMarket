'use strict';

angular.module('iCoinApp')
  .factory('Utilities', function ($resource, ApiPath) {
    return $resource(ApiPath + '/api/utilities/:controller/:site/:limit', {
    },
    {
      'getGenre': {
        method: 'GET',
        params: {
          controller: 'genre'
        }
      },
      'isValidSponsor': {
        method: 'POST',
        params: {
          controller: 'verify-sponsor'
        }
      },
      'signupCountyStats': {
        method: 'GET',
        params: {
          controller: 'statistical'
        }
      },
      'signUpReport': {
        method: 'GET',
        params: {
          controller: 'signup-report'
        }
      },
      'getLatestSignups': {
        method: 'GET',
        params: {
          controller: 'latest-signups'
        }
      },
      'getIncomeInfo': {
        method: 'GET',
        params: {
          controller: 'virtual-calculator'
        }
      },
      'saveFile': {
        method: 'POST',
        params: {
          controller: 'save-image'
        }
      },
      'getLandingPages': {
        method: 'GET',
        params: {
          controller: 'landing-pages'
        }
      },
      'getDefaultSponsorInfo': {
        method: 'GET',
        params: {
          controller: 'default-sponsor'
        }
      },
      'getISDCodes': {
        method: 'GET',
        params: {
          controller: 'isd-codes'
        },
        cache : true
      },
      'getCountries': {
        method: 'GET',
        params: {
          controller: 'list-countries'
        },
        cache : true
      },
      'getTimeZones': {
        method: 'GET',
        params: {
          controller: 'time-zones'
        },
        cache : true
      },
      'listMaxDirects': {
        method: 'POST',
        params: {
          controller: 'max-directs'
        }
      },
      'getMaxTeamSize': {
        method: 'POST',
        params: {
          controller: 'max-team-size'
        }
      },
      'getPacksInfo': {
        method: 'POST',
        params: {
          controller: 'pack-info'
        }
      },
      'getAdvCashInfo': {
        method: 'POST',
        params: {
          controller: 'advcash-transaction'
        }
      },
      'getSignedUrl': {
        method: 'POST',
        params: {
          controller: 'url'
        }
      },
      'showSTPInfoPoup': {
        method: 'POST',
        params: {
          controller: 'stp-info-verify'
        }
      },
      'registerSponsorSession': {
        method: 'POST',
        params: {
          controller: 'register-sponsor'
        }
      },
      'productSubTypes': {
        method: 'GET',
        params: {
          controller: 'product-subtypes'
        }
      },
      'getStaticContent': {
        method: 'GET',
        params: {
          controller: 'static-content'
        }
      },
      'getFBClient' : {
        method : 'GET',
        params : {
          controller : 'clientid',
          site : 'facebook'
        }
      },
      'getPaypalAccount' : {
        method: 'GET',
        params: {
          controller: 'paypal-account'
        }
      },
      'getCryptoData' : {
        method: 'GET',
        params: {
          controller: 'crypto-data'
        }
      },
      'getCryptoChartData' : {
        method: 'GET',
        params: {
          controller: 'crypto-chart-data'
        }
      }

    });
  });
