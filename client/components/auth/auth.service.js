'use strict';

angular.module('iCoinApp')
  .factory('Auth', function Auth($location, $state, $rootScope, $http, User, GeneralogyCreate, $cookieStore, $cookies, $q, ApiPath, ReferralHelpers, CryptoHelper) {
    var currentUser = {};
    var adminRoles  = ['admin', 'solo', 'finance', 'watchuser', 'moderator', 'supervisor','support', 'manager'];
    var businessRoles  = ['exchanger', 'trainer'];

    if($cookieStore.get('token')) {
      if(!$rootScope.memberInfo || $rootScope.memberInfo === null) {
        currentUser = User.get();
      }
      else {
        currentUser = $rootScope.memberInfo;
      }
    }

    return {

      getAdminRoles: function() {
        return adminRoles;
      },

      getBusinessRoles : function(){
        return businessRoles;
      },

      /**
       * Authenticate user and save token
       *
       * @param  {Object}   user     - login info
       * @param  {Function} callback - optional
       * @return {Promise}
       */
      login: function(user, callback) {
        var cb = callback || angular.noop;
        var deferred = $q.defer();

        var options= {
                  // email: CryptoHelper.encrypt(user.email),
                  email: user.email,
                  password: CryptoHelper.encrypt(user.password),
                  key : user.key
                };

        $http.post(ApiPath + '/auth/local', options).
        then(function(result) {
          $cookieStore.put('token', result.data.token);
          currentUser = User.get();
          deferred.resolve(result.data);
          return cb();
        },function(err) {
          // this.logout();
          deferred.reject(err);
          return cb(err);
        }.bind(this));

        return deferred.promise;
      },


      /**
       * Delete access token and user info
       *
       * @param  {Function}
       */
      logout: function() {
        var ck = $cookies.getAll();
        if(ck.cipxser && ck.cipxser !== '') {
          $cookieStore.remove('cipxser');
          User.clearCXView(function() {
            $cookieStore.remove('cipxser');
            $state.go('login');
          });
        }
        else {
          User.clearCXView(function() {
            $cookieStore.remove('cipxser');
            $cookieStore.remove('token');
            $state.go('login');
          });
          $cookieStore.remove('cipxser');
          $cookieStore.remove('cinvsvd');
          currentUser = {};
        }
        $cookieStore.remove('uifo');
      },

      /**
       * Create a new user
       *
       * @param  {Object}   user     - user info
       * @param  {Function} callback - optional
       * @return {Promise}
       */
      createUser: function(user, callback) {
        var cb = callback || angular.noop;
        var referenceUser = user.referralHash || $cookies.get('refUser');

        if(typeof referenceUser !== 'undefined' && referenceUser !== '') {
          referenceUser = ReferralHelpers.decodeReference(referenceUser);
          referenceUser = referenceUser.split('>');//@TODO doubt
        }
        else {
          referenceUser = [];
          console.log('__pr', referenceUser);
        }

        return User.save(user,
          function(data) {
            //$cookieStore.put('token', data.token);
            //currentUser = User.get();
            user.token = data.token;
            // console.log('Upading Referral Links ....');
            // GeneralogyCreate.placeInTree(user, referenceUser, function() {
            //   $cookies.remove('refUser');
            //   return cb(user);
            // });
          },
          function(err) {
            this.logout();
            return cb(err);
          }.bind(this)).$promise;
      },

      /**
       * Change password
       *
       * @param  {String}   oldPassword
       * @param  {String}   newPassword
       * @param  {Function} callback    - optional
       * @return {Promise}
       */
      changePassword: function(oldPassword, newPassword, callback) {
        var cb = callback || angular.noop;

        return User.changePassword({ id: currentUser._id }, {
          oldPassword: CryptoHelper.encrypt(oldPassword),
          newPassword: CryptoHelper.encrypt(newPassword)
        }, function(user) {
          return cb(user);
        }, function(err) {
          return cb(err);
        }).$promise;
      },

      /**
       * Gets all available info on authenticated user
       *
       * @return {Object} user
       */
      getCurrentUser: function() {
        return currentUser;
      },

      setCurrentUser: function (user) {
        currentUser = user;
      },

      /**
       * Check if a user is logged in
       *
       * @return {Boolean}
       */
      isLoggedIn: function() {
        var loginToken    = $cookies.get('token'),
            hasLoginToken = (loginToken && typeof loginToken !== 'undefined' && loginToken !== '');
        return (currentUser.hasOwnProperty('role') && hasLoginToken);
      },

      /**
       * Waits for currentUser to resolve before checking if user is logged in
       */
      isLoggedInAsync: function(cb) {
        var loginToken    = $cookies.get('token'),
            hasLoginToken = (loginToken && typeof loginToken !== 'undefined' && loginToken !== '');
        if(currentUser.hasOwnProperty('$promise') && hasLoginToken) {
          currentUser.$promise.then(function(user) {
            cb(user);
          }).catch(function() {
            cb(false);
          });
        } else if(currentUser.hasOwnProperty('role') && hasLoginToken) {
          cb(currentUser);
        } else {
          cb(false);
        }
      },

      dummpy: function() {
        var token = $cookies.get('token');
        var refUser = $cookies.get('refUser');
        var refId = $cookies.get('refToken');

        console.log( 'token', token );
        console.log( 'refUser', refUser );
        console.log( 'refId', refId );
      },

      /**
       * Check if a user is an admin
       *
       * @return {Boolean}
       */
      isAdmin: function() {
        return (adminRoles.indexOf(currentUser.role) >= 0);
        // return (currentUser.role === 'admin' || currentUser.role === 'solo' || currentUser.role === 'finance' || currentUser.role === 'watchuser');
      },

      /**
       * Get auth token
       */
      getToken: function() {
        return $cookieStore.get('token');
      },

      verifyEmail: function(data, callback) {

        var cb = callback || angular.noop;
        User.verifyEmail(data, cb);
      },

      isValidUserName: function(data, callback) {
        var cb = callback || angular.noop;
        User.verifyUserName(data, cb);
      },

      getUserRole: function() {
        return (currentUser.role) ? currentUser.role : null;
      }
    };

   });
