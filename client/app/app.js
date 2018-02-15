'use strict';

angular.module('iCoinApp', [
      'ngCookies',
      'ngResource',
      'ngSanitize',
      'ui.router',
      'ui.bootstrap',
      'ui.bootstrap.tooltip',
      'googlechart',
      'angular.morris-chart',
      'angularMoment',
      'ngImgCrop',
      'ngScrollbars',
      'angular-growl',
      'angular-confirm',
      'flow',
      'textAngular',
      'ng.deviceDetector',
      'checklist-model',
      'timer',
      'angularBootstrapNavTree',
      'datatables',
      'angular.filter',
      'youtube-embed',
      'ngMaterial',
      'md.data.table',
      'angular-live-helper-chat',
      'textAngular',
      'ngTawkTo',
      'vcRecaptcha',
      'ja.qr',
      'dndLists',
      'ngImageCompress',
      'btford.socket-io',
      'cgNotify',
      'ngclipboard',
      'ui.bootstrap.datetimepicker',
      'cp.ngConfirm'
      // 'nvd3ChartDirectives',
      // 'angular.morris-chart'
])
      .constant('DefaultAvatar', 'assets/images/user/no-image.png')
      .constant('LaunchDate', '2016/03/16 14:00:00')
      .constant('PostOnAweber', true)
      // .constant('ApiPath', 'http://138.197.103.162')
      .constant('ApiPath', 'http://icoindevelop.com:9000')
      //.constant('ApiPath', 'http://staging.ads.cash')  // Your API PATH must not include '/' at last
      .constant('PageLimit', 25)
      .constant('ShowMaintenancePage', false)
      .constant('ShowWelcomeMessage', true)
      .constant('fbClientId', '603172949881641')
      .constant('TAWKTO_ID', '58a288c6a9e5680aa3b07b2c')
      .constant('CAPTCHAKEY', '6Lco5SUUAAAAAHlkg32NA99T9JT3D9RsH1ZMiHes')
      .constant('CRYPTO_KEY', 'SUNNeVpFdFJabkdFTTB3MFZGazNXV3RDZmgwOQ==')
      .constant('MIN_WITHDRAWAL_LIMIT', 25)
      .constant('MAX_WITHDRAWAL_LIMIT', 500)
      .constant('BU_MIN_COMMISSION_LIMIT', 5)
      .constant('BU_MAX_COMMISSION_LIMIT', 7.5)
      .constant('GC_USE', 0.75)
      .constant('FLAG_URL', 'https://login.icoinmarket.com/assets/images/flags/x/FLAG_COUNTRY_CODE.gif')
      .constant('NO_LIMIT_FUND_TRANSFER_USERS', ['569764a66110ef9f6810c2ea'])
      .constant('API_CONSTANTS', {
        MIN_ADC_WITHDRAWAL_LIMIT : 100,
        MAX_ADC_WITHDRAWAL_LIMIT : 10000,
        COUNTRIES_FOR_MOBILE_VERIFICATION : ['IN', 'US', 'UK']
      })
      .config(function ($stateProvider, $urlRouterProvider, $locationProvider, $httpProvider, $sceDelegateProvider) {
            $urlRouterProvider.otherwise('/');
            $locationProvider.html5Mode(true);
            $locationProvider.hashPrefix('!');
            $httpProvider.defaults.withCredentials = true;
            $httpProvider.interceptors.push('authInterceptor');
            $sceDelegateProvider.resourceUrlWhitelist(['self', 'https://www.facebook.com/**']); // for white-listing

            $stateProvider
              .state('app', {
                templateUrl: 'app/app.html',
                abstract: true,
                controller: 'AppCtrl'
              })
      })
      .controller('AppCtrl', ['$scope', '$rootScope', 'socket', 'growl', '$timeout', 'notify', 'FLAG_URL', function ($scope, $rootScope, socket, growl, $timeout, notify, FLAG_URL) {

            $scope.notificationIds= [];

            $scope.$on('socket:notification', function (ev, notifications) {
                console.log('Notification data ', notifications);
                if (notifications.length > 0) {
                    var currentTime = new Date(notifications[0].signupDate);
                    angular.forEach(notifications, function (notification, index) {
                      if ($scope.notificationIds.indexOf(notification.id) == -1) {
                            $scope.notificationIds.push(notification.id);
                            var showNotificationTime = new Date(notification.signupDate).getTime() - currentTime;
                            console.log('notification' + (index+1) + ' will be shown after ' + (showNotificationTime/1000)  + 'seconds');
                            $timeout(function () {
                                  console.log(notification.name);
                                  $scope.notifyPopup(notification);
                                  $rootScope.$broadcast('new-signup', notification);
                            }, showNotificationTime);
                      }
                    });
                }
            });

            $scope.notifyPopup = function (notification) {
                var messageTemplate = '';
                var imgUrl = '';
                var noImageUrl = 'assets/images/user/no-image.png';
                if (notification.country) {
                    imgUrl = FLAG_URL.replace('FLAG_COUNTRY_CODE', notification.country.toLowerCase());
                }
                messageTemplate = '<div class="col-md-12 dashboard-Notify"><div class="col-md-2 col-sm-2 image"><img ng-src="' + imgUrl + '" style="border-radius: 50%" height="60" width="60" src="' + noImageUrl + '">'+
                '</div><div class="col-md-9 col-sm-10 col-xs-12 content"><b class="ng-binding who">' + notification.name + '</b><br /><span class="what">Joined ICOIN Market Recently</span></div></div>';

                notify({
                    messageTemplate: messageTemplate,
                    classes: $scope.classes,
                    scope:$scope,
                    // templateUrl: $scope.template,
                    message: '',
                    position: 'right',
                    duration :8000
                });
            };

            $scope.$on('$destroy', function (event) {
              socket.removeListener('notification', function () {
                console.log('notification listener removed');
              });
            });
      }])
      .controller('browserCtrl', ['$scope', '$http', 'deviceDetector', 'ApiPath', function ($scope, $http, deviceDetector, ApiPath) {
            var vm = this;
            $scope.latestVersion = {};
            $http.get(ApiPath + '/browser-version.json').then(function (res) {
                  var bwVersion = res.data;
                  $scope.latestVersion = bwVersion;
                  vm.olderVersion = false;
                  vm.data = deviceDetector;
                  var version = vm.data.browser_version;
                  var currentVersion = version.split('.');
                  var configVersion = [];

                  switch (vm.data.browser) {
                        case 'chrome':
                              configVersion = bwVersion.chrome.versions;
                              break;
                        case 'safari':
                              configVersion = bwVersion.safari.versions;
                              break;
                        case 'firefox':
                              configVersion = bwVersion.firefox.versions;
                              break;
                        case 'opera':
                              configVersion = bwVersion.opera.versions;
                              break;
                        case 'ms-edge':
                              configVersion = bwVersion.msEdge.versions;
                              break;
                        case 'msie':
                              configVersion = bwVersion.msie.versions;
                              break;
                  }
                  if (configVersion.indexOf(parseInt(currentVersion[0])) < 0) {
                        vm.olderVersion = true;
                  }
                  if (parseInt(configVersion[2]) < parseInt(currentVersion[0])) {
                        vm.olderVersion = false;
                  }
            });
      }])
      .service('UserQuery', function ($window) {
            return {
                  getQuery: function () {
                        var _query = $window.location.search;
                        var queryObj = {};

                        if (_query !== '') {
                              _query = _query.replace('?', '').split('&');
                              var len = _query.length;

                              for (var idx = 0; idx < len; idx++) {
                                    var n = _query[idx].split('=');
                                    queryObj[n[0]] = n[1];
                              }
                        }

                        return queryObj;
                  },
                  getOsTicketAuthRedirectPath: function () {
                        return 'https://support.icoinmarket.com/jwt.php?jwt=';
                  },
                  isOsTicketSSORequest: function (redirectTo) {
                        return (redirectTo.indexOf('support') >= 0);
                  }
            };
      })
      .run(function ($rootScope, $location, $http, $window, Auth, User, GeneralogyCreate, UserIPService, $cookies, $urlRouter, $state, UserQuery) {

            var userIpInfo = $cookies.get('country_info');
            $rootScope.memberInfo = null;

            if (typeof userIpInfo === 'undefined' || userIpInfo === '' || userIpInfo === null) {
                  UserIPService.get(function (response) {
                        var expTime = new Date();
                        expTime.setTime(expTime.getTime() + (24 * 60 * 60 * 1000));
                        $cookies.put('country_info', btoa(JSON.stringify(response)), {
                              'expires': expTime
                        });
                  });
            }

            /* handle facebook like and unlike event */
            // var fbLikeItems = '';
            // window.fbAsyncInit = function() {
            //  window.FB.Event.subscribe('edge.create', function(href,widget) {
            //      console.log('you  have successfully liked the post!!');
            //      growl.addSuccessMessage("You have successfully liked the post", {ttl: 5000});
            //      var id = '',viewTime='',dayLimit='',viewed='';
            //
            //      if(widget){
            //        id = (widget.attributes.getNamedItem('data-custom-id') ? widget.attributes.getNamedItem('data-custom-id').value : '');
            //        viewTime = (widget.attributes.getNamedItem('data-custom-viewtime') ? widget.attributes.getNamedItem('data-custom-viewtime').value : '');
            //      }
            //        if(fbLikeItems.indexOf(id) > -1) {
            //          return false;
            //          }
            //          Campaign.updateView({
            //            _id: id,
            //            type:'fblike',
            //            viewcount: parseInt(viewTime)
            //          });
            //     fbLikeItems=fbLikeItems+','+id;
            //     angular.element('#'+id).addClass('fadeout');
            //  });
            //   window.FB.Event.subscribe('edge.remove', function(response) {
            //      console.log('There should not be unlike !!');
            //   });
            // };

            // Redirect to login if route requires auth and you're not logged in
            $rootScope.$on('$stateChangeStart', function (event, next) {
                  //var authParams = UserQuery.getQuery();
                  //var isSSOCall  = authParams.hasOwnProperty('brand_id') && authParams.hasOwnProperty('return_to') && authParams.hasOwnProperty('timestamp');
                  var isSSOCall = (next.url.indexOf('support') !== -1);

                  var allowedNext = [
                        'login', 'signup', 'signupwithparams', 'settings','provideEmailMobile', 'signupWelcome', 'verifyemail', 'forgetpassword',
                        'forgetchangepassword', 'TermsOfService','ContactUs','PrivacyPolicy','referral', 'newLinkReferral', 'newBannerReferral',
                        'BankWireInvoice', 'purchasesuccess', 'WithdrawalSuccess', 'admin.withdrawlRequests', 'PDFDownloadPage', 'browserlist',
                        'dailyTraining', 'setBusinessUserPassword', 'setPortfolioManagerPassword','marketpresentations','myDashboard'
                  ];

                  if ($rootScope.memberInfo == null && allowedNext.indexOf(next.name) < 0) {
                        event.preventDefault();
                  }
                  if (isSSOCall && allowedNext.indexOf(next.name) >= 0) {
                        var loginToken = $cookies.get('token'),
                              hasLoginToken = (loginToken && typeof loginToken !== 'undefined' && loginToken !== '');
                        if (hasLoginToken) {
                              event.preventDefault();
                        }
                  }

                  Auth.isLoggedInAsync(function (loggedIn) {
                        //@TODO Cookie Teer
                        if (
                              (next.authenticate && !loggedIn && typeof $cookies.get('token') === 'undefined') ||
                              (next.authenticate && loggedIn && typeof $cookies.get('token') === 'undefined')
                        ) {
                              Auth.logout();
                              $rootScope.memberInfo = null;
                        } else {
                              if ($rootScope.memberInfo === null && loggedIn && next.authenticate) {

                                    $rootScope.memberInfo = loggedIn;
                                    if (!isSSOCall) {
                                          $state.go(next.name, null, {
                                                notify: true
                                          });
                                    } else {
                                          var _token = $cookies.get('token').replace(/\"/g, '');
                                          //var returnTo = decodeURIComponent(authParams.return_to);
                                          var returnTo = next.url;
                                          if (UserQuery.isOsTicketSSORequest(returnTo)) {
                                                window.location.href = UserQuery.getOsTicketAuthRedirectPath() + _token;
                                          } else {
                                                window.location.href = returnTo + '?__t=' + _token;
                                          }
                                    }
                              }
                        }
                  });
            });
      });