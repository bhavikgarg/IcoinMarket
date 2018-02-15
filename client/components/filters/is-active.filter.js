angular.module('iCoinApp')
.filter('isActive', function ($location) {
    return function (input) {
      return input === $location.path();
  };
});