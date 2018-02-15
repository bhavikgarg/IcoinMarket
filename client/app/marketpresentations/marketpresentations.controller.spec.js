'use strict';

describe('Controller: MarketpresentationsCtrl', function () {

  // load the controller's module
  beforeEach(module('iCoinApp'));

  var TrainingCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    MarketpresentationsCtrl = $controller('MarketpresentationsCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
