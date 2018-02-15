angular.module('iCoinApp')
.filter('dotted', function () {
    return function (input) {
      if (typeof input === 'undefined'){
        return '';
    }
    if (input && input.length <= 0){
        return '';
    }
    return input.charAt(0) + '...' + input.slice(-1);
};
});