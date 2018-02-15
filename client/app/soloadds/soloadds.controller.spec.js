'use strict';

describe('Controller: SoloaddsCtrl', function () {

  // load the controller's module
  beforeEach(module('iCoinApp'));

  var SoloaddsCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    SoloaddsCtrl = $controller('SoloaddsCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
