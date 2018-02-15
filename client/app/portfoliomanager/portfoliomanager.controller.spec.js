'use strict';

describe('Controller: PortfoliomanagerCtrl', function () {

  // load the controller's module
  beforeEach(module('iCoinApp'));

  var PortfoliomanagerCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    PortfoliomanagerCtrl = $controller('PortfoliomanagerCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
