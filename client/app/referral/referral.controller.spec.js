'use strict';

describe('Controller: ReferralCtrl', function () {

  // load the controller's module
  beforeEach(module('iCoinApp'));

  var ReferralCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    ReferralCtrl = $controller('ReferralCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
