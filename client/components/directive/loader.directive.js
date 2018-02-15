angular.module('iCoinApp')
.directive('loading', function () {
    return {
      restrict: 'E',
      //replace: true,
      //template: '<div class="loading" style="max-height: 320px;height:320px; max-width:824px; position: relative;margin-left: auto; margin-right: auto;margin-top: auto;margin-bottom: auto;display: block;"><img class="loaderImage" src="http://www.nasa.gov/multimedia/videogallery/ajax-loader.gif" />LOADING...</div>',
      template: '<div class="loading" style="max-height: 320px;height:320px; max-width:824px; position: relative;margin-left: auto; margin-right: auto;margin-top: auto;margin-bottom: auto;display: block;"><img class="loaderImage" src="http://www.nasa.gov/multimedia/videogallery/ajax-loader.gif" style="position: absolute; margin: auto;top: 0;left: 0;right: 0; bottom: 0;"/>LOADING...</div>',

      link: function (scope, element) {
        scope.$watch('loading', function (val) {
          if (val){
            $(element).show();
        }
        else{
            $(element).hide();
        }
    });
    }
};
});