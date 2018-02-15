angular.module('iCoinApp')
    .controller('SupportAdminCtrl', function($scope, $rootScope, User, Auth, Utilities, $cookies, $timeout, AdminAccess, $cookieStore, $sce, ApiPath, $uibModal, $uibModalStack, socket,$ngConfirm) {

        $scope.limit = 25;
        $scope.filter = {text: ''};
        $scope.user = {};

        $scope.statusList = [
            "Not Answering",
            "Wrong Number",
            "Answering"
        ];

        Auth.getCurrentUser().$promise.then(function (user) {
           $scope.getAssignedUserDetails();
        });

        AdminAccess.hasAdminAccess();
        $scope.isSupportLogin = AdminAccess.isSupportLogin;

        $scope.getCountries = function(callback) {
            Utilities.getCountries(function(data) {
                $scope.countries = data.countries;
            });
        };

        $scope.getCountries();

        $scope.getUserIpInfo = function() {
            var userInfo = $cookies.get('country_info');
            if (userInfo) {
                var userIPInfo = (userInfo ? JSON.parse(atob(userInfo)) : {});
                $scope.user.country = (userIPInfo.country_name ? userIPInfo.country_name : '');
                $scope.user.countryCode = (userIPInfo.country_code ? userIPInfo.country_code : '');
                $scope.timeZone = (userIPInfo.time_zone ? userIPInfo.time_zone : '');
            } else {
                setTimeout($scope.getUserIpInfo, 2000);
            }
        };

        $scope.getUserIpInfo();

        $scope.pickUser = function(userid) {
            User.pickUser({
                userid: userid
            }, function(response) {
                if (!response.success) { // Unable to pick user
                    if (response.freezeUser) {
                        $scope.latestSignup.filter(function (entry) {
                            if (entry.userid == userid) {
                                entry.disabled = true;
                            }
                        });
                        $scope.users.filter(function (user) {
                            if (user._id == userid) {
                                $scope.totalPages=($scope.totalPages-1);
                                user.disabled = true;
                            }
                        });
                    }
                     $ngConfirm(response.message, 'Warning');
                } else {
                    $scope.latestSignup.filter(function (entry) {
                        if (entry.userid == userid) {
                            entry.disabled = true;
                        }
                    });
                    var userIndex;
                    $scope.users.filter(function (user, index) {
                        if (user._id == userid) {
                            $scope.totalPages=($scope.totalPages-1);
                            userIndex = index;
                        }
                    });
                    $scope.users.splice(userIndex,1);
                    $scope.selectedusers = response.data;
                }
                console.log(response);
            }, pickUserFailureCallback);
        };

        function pickUserFailureCallback (err) {
            console.log(err);
            $ngConfirm("Error while trying to pick this user.", 'Warning');
        };

        $scope.getLatestSignupTable = function() {
            Utilities.getLatestSignups({
                page: 1
            }, function(data) {
                $scope.latestSignup = data.users; //((data.users.length > 10) ? data.users.splice(0, 10) : data.users);
                $scope.latestSignup2 = data.users;
                $scope.companySignups = data.companySignups;
                $scope.totalsignups = data.usersCount;
            });
        };

        $scope.getLatestSignupTable();


        /*Time Zone*/
        $scope.getTimeZones = function(countryCode){
        Utilities.getTimeZones({countryCode: countryCode},function(data) {
            $scope.timezones = data.countryZones[countryCode].zones;
            $scope.timezone = data.countryZones[countryCode].zones[0];
            }, function(err){
                console.log("Error occured in getting timeZone: "+JSON.stringify(err));
            });
        };

        $scope.getTimeZones($scope.user.countryCode);

        /*DateTime Picker Code*/
        $scope.endDateBeforeRender = endDateBeforeRender;
        $scope.endDateOnSetTime = endDateOnSetTime;
        $scope.startDateBeforeRender = startDateBeforeRender;
        $scope.startDateOnSetTime = startDateOnSetTime;

        function startDateOnSetTime() {
            $scope.$broadcast('start-date-changed');
            angular.element('#start-date-dropdown').hide();
        }

        function endDateOnSetTime() {
            $scope.$broadcast('end-date-changed');
            angular.element('#end-date-dropdown').hide();
        }

        $scope.openEndDropdown = function () {
            angular.element('#end-date-dropdown').toggle();
        };
        $scope.openStartDropdown = function () {
            angular.element('#start-date-dropdown').toggle();
        };

        function startDateBeforeRender($dates) {
            if ($scope.filter.dateRangeEnd) {
                var activeDate = moment($scope.filter.dateRangeEnd);

                $dates.filter(function (date) {
                    return date.localDateValue() >= activeDate.valueOf();
                }).forEach(function (date) {
                    date.selectable = false;
                });
            }
            $dates.filter(function (date) {
                return date.localDateValue() <= new Date().valueOf() - 24 * 60 * 60 * 1000;
            }).forEach(function (date) {
                date.selectable = false;
            });
        }

        function endDateBeforeRender($view, $dates) {
            if ($scope.filter.dateRangeStart) {
                var activeDate = moment($scope.filter.dateRangeStart).subtract(1, $view).add(1, 'minute');

                $dates.filter(function (date) {
                    return date.localDateValue() <= activeDate.valueOf();
                }).forEach(function (date) {
                    date.selectable = false;
                });
            }
        }
        /*Datetime Picker ends*/

        // Use the User $resource to fetch all users
        $scope.loadPage = function(pageIndex) {
            var filters = {};
            $scope.loading = true;
            if ($scope.filter.dateRangeStart) {
                filters.contactTimeFrom = $scope.filter.dateRangeStart.getTime();
            }

            if ($scope.filter.dateRangeEnd) {
                filters.contactTimeTill = $scope.filter.dateRangeEnd.getTime();
            }

            if ($scope.filter.countryCode) {
                filters.countryCode = $scope.filter.countryCode;
            }

            if ($scope.filter.text) {
                filters.text = $scope.filter.text;
            }

            if (pageIndex) {
                filters.pageId = pageIndex;
            }

            User.getNonVerifiedUsers(filters, function(data) {
                $scope.users = data.documents;

                if (data.totalPages) {
                    $scope.totalPages = data.totalPages;
                }

            });
            $scope.loading = false;
        };

        $scope.updateDates = function(data){

        }

        $scope.loadPage();

        $scope.showUserPages = function(user) {
            var adminUserId = AdminAccess.getUserId();
            var proxyId = btoa(user._id + (adminUserId && adminUserId !== '' ? ('-' + adminUserId) : ''));
            var token = $cookieStore.get('token');
            $scope.proxyUser = $sce.trustAsResourceUrl(ApiPath + '/api/users/user-proxy?proxyId=' + proxyId + '&access_token=' + token);
            $cookieStore.put('cipxser', 1);
            $uibModal.open({
                templateUrl: 'app/support/dashboard/userdashboardbysupport.html',
                // controller: 'SupportAdminCtrl',
                size: 'lg',
                scope: $scope,
                windowClass: 'large-width',
                backdrop: 'static',
                keyboard: false
            });
        };

        $scope.closeallmodals = function() {
            console.log('Done');
            $uibModalStack.dismissAll();
        };

        $scope.clearClientSession = function() {
            $cookieStore.remove('cipxser');
            User.clearCXView(function() {
                $scope.closeallmodals();
            });
        };

        $scope.getAssignedUserDetails = function(key) {
            if ($rootScope.memberInfo.assignedUser) {
                User.getById({
                    reference: $rootScope.memberInfo.assignedUser
                }, function(info) {
                    $scope.selectedusers = info;
                });
            }
        };

        $scope.updateUserCallStatus = function(statusIndex) {
            User.updateUserCallStatus({
                userid: $scope.selectedusers._id,
                callStatus: $scope.statusList[statusIndex]
            }, function(response) {
                console.log(response);
                if (response.success) {
                    $scope.selectedusers = {};
                    console.log(response.message);
                } else {
                    $ngConfirm(response.message, 'Warning');
                    // alert(response.message);
                }
            });
        };
        $scope.notificationIds = [];

        $scope.$on('socket:notification', function(ev, notifications) {
            if (notifications.length > 0) {
                var currentTime = new Date(notifications[0].signupDate);
                angular.forEach(notifications, function(notification, index) {
                    if ($scope.notificationIds.indexOf(notification.id) == -1) {
                        $scope.notificationIds.push(notification.id);
                        var showNotificationTime = new Date(notification.signupDate).getTime() - currentTime;
                        $timeout(function() {
                            $scope.latestSignup.unshift(notification);
                            $scope.totalsignups++;
                        }, showNotificationTime);
                    }
                });
            }
        });

        $scope.$on('$destroy', function(event) {
            socket.removeListener('notification', function() {
                console.log('notification listener removed');
            });
        });

    })