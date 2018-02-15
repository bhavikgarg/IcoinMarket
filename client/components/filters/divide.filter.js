angular.module('iCoinApp')
    .filter('divide', function () {
        return function (input, sec_arg) {
              if (typeof input === 'undefined'){
                    input = 0;
              }
              if (typeof sec_arg === 'undefined'){
                    sec_arg = 1;
              }
              //var inputNum = parseInt(input, 10);
              //var secNum = parseInt(sec_arg, 10);
              return input / sec_arg;
        };
    });