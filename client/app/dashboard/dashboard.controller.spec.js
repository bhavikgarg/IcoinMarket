'use strict';

describe('Controller: DashboardCtrl', function () {

  // load the controller's module
  beforeEach(module('iCoinApp'));

  var DashboardCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    DashboardCtrl = $controller('DashboardCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });

  it('should demonstrate using when (200 status)', inject(function($http) {

    var $scope = {};

    /* Code Under Test */
    $http.get('data.json')
    .then(function(data){
      $scope.data = data;
      $scope.countries = data.topcountries;
    }).error(function(err){
      console.log(err);
    });
    /* End */

    $httpBackend
      .when('GET', 'data.json')
      .respond(200, { foo: 'bar' });

    $httpBackend.flush();

    expect($scope.valid).toBe(true);
    expect($scope.response).toEqual({ foo: 'bar' });

  }));


});
