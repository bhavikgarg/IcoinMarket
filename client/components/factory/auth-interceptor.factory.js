angular.module('iCoinApp')
.factory('authInterceptor', function ($rootScope, $q, $cookieStore, $cookies, $location) {
    return {
      // Add authorization token to headers
      request: function (config) {
        config.headers = config.headers || {};
        if ($cookieStore.get('token')) {
          config.headers.Authorization = 'Bearer ' + $cookieStore.get('token');
      }
      if ($cookieStore.get('cipxser')) {
          config.headers._xser = 'cx-user-view';
      }
      config.headers.refuid = $cookieStore.get('refTarget');
      config.headers.refuser = $cookies.get('refUser');
      return config;
  },

      // Intercept 401s and redirect you to login AND
      // Intercept 412s (Precondition Failed) and redirect you to complete signup process
      // so user need to fill their email address or mobile number or both
      responseError: function (response) {
        if (response.status === 401) {
          $location.path('/');
                  // remove any stale tokens
                  $cookieStore.remove('token');
                  return $q.reject(response);
              } else if (response.status === 412) {
                  var userinfo = $cookieStore.get('uifo');
                  $cookieStore.put('__userinfo', userinfo);
                  $location.path('/complete-signup');
                  return $q.reject(response);
              } else if (response.status === 422) {

              } else {
                  return $q.reject(response);
              }
          }
      };
  })