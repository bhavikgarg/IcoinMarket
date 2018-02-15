'use strict';

angular.module('iCoinApp')
  .factory('CryptoMarket', function ($resource, ApiPath) {
    return $resource(ApiPath + '/api/cryptomarketdata/:controller/:site/:limit', { }, {
        'getCryptoData' : {
          method: 'GET',
          params: {
            controller: 'crypto-currency-data'
          }
        },
        'getCryptoChartData' : {
          method: 'GET',
          params: {
            controller: 'crypto-currency-chart-data'
          }
        }
    });
  });