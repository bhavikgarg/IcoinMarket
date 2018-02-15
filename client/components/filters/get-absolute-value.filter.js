angular.module('iCoinApp')
.filter('abs', function () {
    return function (input) {
      return Math.abs(input);
    };
  });