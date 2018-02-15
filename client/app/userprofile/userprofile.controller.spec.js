'use strict';

describe('Controller: UserprofileCtrl', function () {

  // load the controller's module
  beforeEach(module('iCoinApp'));

  var UserprofileCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    UserprofileCtrl = $controller('UserprofileCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
