'use strict';

describe('Controller: TrainingCtrl', function () {

  // load the controller's module
  beforeEach(module('iCoinApp'));

  var TrainingCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    TrainingCtrl = $controller('TrainingCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
