angular.module('iCoinApp')
.directive('modalShow', function () {
    return {
      restrict: 'A',
      link: function (scope, element) {
        $(element).bind('hide.bs.modal', function () {
          angular.element('#my-modal iframe').remove();    // youtube video close
      });
    }
};
});