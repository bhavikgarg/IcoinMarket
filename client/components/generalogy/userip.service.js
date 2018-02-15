'use strict';

angular.module('iCoinApp')
  .factory('UserIPService', function () {
    return {
      get: function(callback) {
        var cb = callback || angular.noop;

        jQuery.get('https://freegeoip.net/json/', cb);
      }
    };
  });
