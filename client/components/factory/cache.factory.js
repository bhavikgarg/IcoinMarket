angular.module('iCoinApp')
    .factory('Cache', function($cacheFactory) {
        return $cacheFactory('icm-cache');
    });