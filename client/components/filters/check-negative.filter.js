angular.module('iCoinApp')
.filter('neg', function () {
    return function (input) {
      return parseInt(input) < 0;
    };
  });