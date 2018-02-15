'use strict';

angular.module('iCoinApp')
  .controller('DashboardCtrl', function ($scope, $rootScope, $state, $http, Cache, $filter, Auth, $location, $window, $timeout, Utilities, CryptoMarket, Affiliates, GeneralogyCreate, $cookies, $uibModal, $uibModalStack, Purchase, PacksInfo, SponsorVerifier, User, $cookieStore, Usermeta, ShowMaintenancePage, ShowWelcomeMessage,notify,$ngConfirm, ConfigurationService,CommitmentsService) {
    $scope.userInfo = Auth.getCurrentUser();
    $scope.getCurrentUser = Auth.getCurrentUser();
    $scope.isLoggedIn = Auth.isLoggedIn;
    Auth.getCurrentUser().$promise.then(function (user) {
      $scope.userRole = user.role;
      if (user.role != 'user') {
         $location.path('/');
      }
    });
    $scope.latestSignup = [];

    $scope.stats = {
      '24H': {
        totalHits: 0,
        totalSignups: 0,
        totalFirstLevelSignups: 0
      },
      '7D': {
        totalHits: 0,
        totalSignups: 0,
        totalFirstLevelSignups: 0
      },
      '1M': {
        totalHits: 0,
        totalSignups: 0,
        totalFirstLevelSignups: 0
      },
      'all': {
        totalHits: 0,
        totalSignups: 0,
        totalFirstLevelSignups: 0
      }
    };

    $scope.virtualCalculatorInfo = [
    {CurrentRecruits:0,GenerationLevel:1,Pack1:0,Pack100:0,Pack200:0,Pack400:0,Pack1000:0,Pack2000:0,Pack4000:0},
    {CurrentRecruits:0,GenerationLevel:2,Pack1:0,Pack100:0,Pack200:0,Pack400:0,Pack1000:0,Pack2000:0,Pack4000:0},
    {CurrentRecruits:0,GenerationLevel:3,Pack1:0,Pack100:0,Pack200:0,Pack400:0,Pack1000:0,Pack2000:0,Pack4000:0}
    ];

    $scope.country= {};
    $scope.date= {};
    $scope.data  = $scope.userInfo;
    $scope.user={};
    $scope.user.country={};

    $scope.closeModal = function () {
      $uibModalStack.dismissAll();
    };

    $scope.usdWallet = {};
    Purchase.getPurchasedPacksInfo({type: 'usd'}, function(data) {
        Cache.put("usd_balance", data.balance);
      $scope.usdWallet.balance = data.balance;
    });


    $scope.getLatestSignupTable = function () {
      Utilities.getLatestSignups({ page: 1 }, function (data) {
        $scope.latestSignup = ((data.users.length > 10) ? data.users.splice(0, 10) : data.users);
        $scope.latestSignup2 = data.users;
        $scope.companySignups = data.companySignups;
        $scope.totalsignups=data.usersCount;
      });

      // Utilities.getLatestSignups({page: 2}, function(data) {
      //   $scope.latestSignup2 = data.users;
      //   $scope.companySignups = data.companySignups;
      // });
    };

    $scope.virtualCalculatorSum = {
      'Lock100': 0,
      'Lock1000': 0,
      'Lock10000': 0,
    };
    Utilities.getIncomeInfo(function(resp) {
      $scope.virtualCalculatorInfo = [];
      resp.data.forEach(function(row) {
        $scope.virtualCalculatorInfo.push({
          GenerationLevel: row.GenerationLevel,
          CurrentRecruits: row.CurrentRecruits,
          Lock100:(row.Pack1*100),
          Lock1000:(row.Pack1*1000),
          Lock10000:(row.Pack1*10000)
        });

        $scope.virtualCalculatorSum = {
          'Lock100': ($scope.virtualCalculatorSum['Lock100']    + (row.Pack1 * 100)),
          'Lock1000': ($scope.virtualCalculatorSum['Lock1000']  + (row.Pack1 * 1000)),
          'Lock10000': ($scope.virtualCalculatorSum['Lock10000'] + (row.Pack1 * 10000))
        }
      });
    });

    $scope.getStatsInfo = function(_time) {
      $scope.timeView = _time;

      Affiliates.getHists({viewas: _time}, function(data) {
        $scope.stats[_time].totalHits = (data && data.totalHits ? (data.totalHits) : 0);
      });

      GeneralogyCreate.getMySignupsInfo({viewas: _time}, function(data) {
        $scope.stats[_time].totalSignups = (data && data.totalSignups ? (data.totalSignups) : 0);
        $scope.stats[_time].totalFirstLevelSignups = (data && data.totalFirstLevelSignups ? (data.totalFirstLevelSignups) : 0);
      });
    }

    $scope.getStatsInfo('all');

    $scope.$on('new-signup', function ($event, data){
        $scope.latestSignup.unshift(data);
        $scope.latestSignup = (($scope.latestSignup.length > 10) ? $scope.latestSignup.splice(0, 10) : $scope.latestSignup);
        $scope.totalsignups++;
    });

    $scope.getNotPlayAgain = function () {
      var playagain = $cookies.get('cinvsvd');
      return (playagain === 1 ? 1 : 0);
    };

    $scope.notShowAgain = function () {
      angular.element('#my-modal iframe').remove();
      $uibModalStack.dismissAll();
    };

    $scope.english = {
      url: 'https://www.youtube.com/watch?v=j65Yjnuw-vA&t=40s',
      player: null,
      vars: {
        autoplay: 1
      }
    };

    $scope.spanish = {
      url: 'https://www.youtube.com/watch?v=j65Yjnuw-vA&t=40s',
      player: null
    };

    $scope.russian = {
      url: 'https://www.youtube.com/watch?v=j65Yjnuw-vA&t=40s',
      player: null
    };

    $scope.usermeta = { status: 'APPROVED' };
    $scope.getLatestSignupTable();

    $scope.changePassword = true;

    // Affiliates.get({ isexist: true }, function (response) {
    //   if (!response.exist) {
    //     Affiliates.addDefault(function (defAffilate) {
    //       $scope.affiliates._main = defAffilate;
    //       $scope.affiliates_main.linkurl = $window.encodeURI(defAffilate.landingpage + '?ref=' + defAffilate.target + '&name=' + defAffilate.linkname.toLowerCase());
    //     });
    //   }
    // });

    $scope.closeModal = function () {
      $uibModalStack.dismissAll();
    };

    $scope.sponsor = { reflink: '', email: '', username: '', type: 0 };
    $scope.validateSponsor = function () {
      $scope.sponsor = '';
      $scope.isVerified = false;
      $uibModalStack.dismissAll();
      $scope.sponsor = {
        username: 'loading...',
        name: 'loading...',
        email: 'loading...',
        mobile: 'loading...',
        country: 'loading...'
      };

      if (!$scope.userInfo.confirmSponsor || ($scope.userInfo.confirmSponsor && $scope.userInfo.confirmSponsor == false)) {
        var cinvsvd = $cookies.get('cinvsvd');
        if (cinvsvd == 0 && ShowWelcomeMessage === true) {
            var modalInstance = $uibModal.open({
              templateUrl: 'app/dashboard/statics/icoin-welcome-message.html',
              controller: 'WelcomeMessageCtrl',
              scope: $scope,
              windowClass: 'large-width',
              backdrop: 'static',
              keyboard: false
            });
        }
        else if (cinvsvd == 2){
          SponsorVerifier.validateSponsor(function (data) {
          $scope.userInfo = data.user;
          if (data.error == false && data.user.confirmSponsor == false) {
            User.getById({ reference: data.user.sponsor }, function (data) {
              $scope.sponsor = data;
              $uibModal.open({
                templateUrl: 'app/dashboard/currentsponsor.html',
                scope: $scope,
                size: 'md',
                backdrop: 'static',
                keyboard: false
              });
            });
          }
        });
        }
      }
    };

    $scope.openContactInfoPopup = function(){
        var cinvsvd = $cookies.get('cinvsvd');
        /*apply conditions here*/
        if(cinvsvd == 3){
            $scope.getContactInfoPopup();
        }
        else{
            console.log("Unable to open contact-info popup");
        }
    }


    $scope.changeSponsorId = function () {
      $uibModalStack.dismissAll();
      $uibModal.open({
        templateUrl: 'app/dashboard/header/sponsorverify.html',
        scope: $scope,
        size: 'md',
        backdrop: 'static',
        keyboard: false
      });
    };

    $scope.showMessage = '';
    $scope.userEmail = '';
    $scope.getSponsorInfo = function (params) {
      $scope.showMessage = '';
      Auth.getCurrentUser().$promise.then(function (userData) {
        $scope.userEmail = userData.email;
      });
      User.getSponsorInfo(params, function (data) {
        if (data.error == true) {
          $scope.showMessage = 'You have entered the wrong Sponsor Email or ID';
        } else if ($scope.sponsor.email === data.user.email) {
          $scope.showMessage = 'You have entered the same Sponsor Email or ID';
        } else if ($scope.userEmail === data.user.email) {
          $scope.showMessage = 'You have entered the wrong Sponsor Email or ID';
        } else {
          $scope.isVerified = !data.error;
          if (!data.error) {
            $scope.sponsorInfo = {
              email: data.user.email,
              username: data.user.username,
              name: data.user.name,
              userEmail: data.user.useremail,
              userid: data.user.userid
            };
          }
          else {
            $scope.showMessage = data.message;
          }
        }
      });
    };

    $scope.verifySponsor = function () {
      User.confirmSponsor(function (data) {
        if (data.success == 1) {
          $scope.userInfo.confirmSponsor=true;
          $uibModalStack.dismissAll();
          // update the variable in cookie so that no welcome popup ever opens again
          $cookies.put('cinvsvd', 3);
          // open contactInfo Popup
          $scope.openContactInfoPopup();
        }
      });
    };

    $scope.confirmClicked = false;
    $scope.confirmSponsor = function () {
      $scope.confirmClicked = true;
      $scope.showMessage = '';
      User.changeSponsor($scope.sponsorInfo, function (data) {
        if (data.error) {
          $scope.showMessage = data.message;
          $scope.confirmClicked = false;
          $scope.isVerified = false;
          $scope.sponsor = { reflink: '', email: '', username: '', type: $scope.sponsor.type };
        }
        else {
          $uibModalStack.dismissAll();
          $scope.confirmClicked = false;
          $scope.showMessage = '';
          $scope.userInfo.confirmSponsor=true;
          User.get(function(data){
             $rootScope.memberInfo.sponsor = data.sponsor;
           });
        }
      });
        // set cinvcd value to open 3rd popup
        $cookies.put('cinvsvd', 3);
        // open contactInfo Popup
        $scope.openContactInfoPopup();

    };

    $scope.unsetVerified = function () {
      $scope.isVerified = false;
    };

    $scope.getCountries = function(callback) {
      Utilities.getCountries(function(data) {
        $scope.countryList = data.countries;
        callback();
      });
    };

    var setDatesToEmpty = 0;
    $scope.getTimeZones = function(countryCode){
        Utilities.getTimeZones({countryCode: countryCode},function(data) {
            $scope.timezones = data.countryZones[countryCode].zones;
            $scope.timezone = data.countryZones[countryCode].zones[0];
            setDatesToEmpty++;
            //empty the from and to dates of lightbox
            if(setDatesToEmpty>1){
                $scope.user.dateRangeStart= null;
                $scope.user.dateRangeEnd = null;
            }
            /*This broadcasted event causes the datetimepicker to re-read it's configuration*/
            $scope.$broadcast('time-zone-changed');
        }, function(err){
            console.log("Error occured in getting timeZone: "+JSON.stringify(err));
        });
    };

    // Defaults to country name of user
    $scope.country = {};
    //$scope.country.code = $scope.userInfo.countryCode
    if($scope.userInfo.timeZoneCountry){
        $scope.user.timeZoneCountry = $scope.userInfo.timeZoneCountry;
    }else{
        $scope.user.timeZoneCountry = $scope.userInfo.countryCode;
    }

    $scope.user.skypeName = $scope.userInfo.skypeName;
    if($scope.userInfo.mobile){
        var mob = $scope.userInfo.mobile.split("-");
        if(mob.length>=1){
            $scope.user.primaryMobileNo = mob[1];
            $scope.user.stdcode1 = mob[0];
        }

    }
    if($scope.userInfo.secondaryMobile){
        var secMob = $scope.userInfo.secondaryMobile.split("-");
        if(secMob.length>=1){
            $scope.user.secondaryMobileNo = secMob[1];
            $scope.user.stdcode2 = secMob[0];
        }

    }
    /*$scope.user.dateRangeStart = new Date($scope.userInfo.preferredContactTimeStart);
    $scope.user.dateRangeEnd = new Date($scope.userInfo.preferredContactTimeEnd);*/
    //$scope.getTimeZones($scope.country.code);
    var currentOffset = new Date().getTimezoneOffset();
    if($scope.userInfo.preferredContactTimeStart){
        var prefStartTime = new Date($scope.userInfo.preferredContactTimeStart);
        $scope.user.dateRangeStart = new Date(prefStartTime.getTime() - (($scope.userInfo.userOffset-currentOffset) * 60*1000));
    }
    if($scope.userInfo.preferredContactTimeEnd){
        var prefEndTime = new Date($scope.userInfo.preferredContactTimeEnd);
        $scope.user.dateRangeEnd = new Date(prefEndTime.getTime() - (($scope.userInfo.userOffset-currentOffset) * 60*1000));
    }

    // To calculate equivalent time in timezone selected by user
    /*var x= (prefStartTime).toISOString();
    var y = (prefEndTime).toISOString();
    $scope.startTimeInGivenTimeZone = moment.utc(x).tz($scope.userInfo.timeZone).format('YYYY/MM/DD HH:mm:ss');
    $scope.endTimeInGivenTimeZone = moment.utc(y).tz($scope.userInfo.timeZone).format('YYYY/MM/DD hh:mm:ss');*/

    $scope.getCountries(function () {
      //$scope.setISDCode();
    });

    $scope.getISDCodes = function() {
      Utilities.getISDCodes(function(data) {
        $scope.isdCodes = data.isdCodes;
      });
    };

    $scope.getISDCodes();


    $scope.getSupportTime = function(){
          ConfigurationService.getConfig({key: 'supportHours'},function(data) {
              if(data.value) {
                $scope.supportStartHour = new Date(data.value.startHour).getHours();
                $scope.supportEndHour = new Date(data.value.endHour).getHours();
                $scope.supportStartMinute = new Date(data.value.startHour).getMinutes();
                $scope.supportEndMinute = new Date(data.value.endHour).getMinutes();
                $scope.adminTimeZone = data.value.timezone;
               };
          });
       };

    $scope.getContactInfoPopup = function() {
       var cinvsvd = $cookies.get('cinvsvd');
        if (cinvsvd == 5)
             return false;

        $scope.getSupportTime();
        $scope.getTimeZones($scope.user.timeZoneCountry);
        $uibModalStack.dismissAll();
        $uibModal.open({
            templateUrl: 'app/dashboard/statics/contactInfoPopUp.html',
            scope: $scope,
            //controller: 'ContactInfoCtrl'
            windowClass: 'large-width',
            backdrop: 'static',
            keyboard: false
        });
        var message = '';
        if ($scope.callStatus == 'Not Answering')
            message = 'Hey! We tried reaching you, however, got no response from your end! Please allow us to reschedule the call. Login to your iCoinMarket account and change the preferred time to get started soon.';
        if ($scope.callStatus == 'Wrong Number')
            message = ' Hey! We tried to reach you but failed ! We believe the number provided by you may not be correct. Login to your iCoinMarket account and update your number for contact. We would also recommend you to reschedule the call to get started ASAP! ';
        if ($scope.delayed)
            message = 'Due to heavy call flow, we were not able to call you on the prefered time, sorry for the inconvenience. Please re-schedule again.';
        if ($scope.callStatus)
            $scope.warningAlert(message);
    }

    $scope.warningAlert = function(message){
          $ngConfirm({
              title: 'Warning !',
              content: message,
              type: 'red',
              typeAnimated: true,
              buttons: {
                  tryAgain: {
                      text: 'Close',
                      btnClass: 'btn-red',
                      action: function(){
                      }
                  },
              }
          });
      };

      $scope.successAlert = function(message){
        $ngConfirm({
            title: 'Success !',
            content: message,
            type: 'orange',
            typeAnimated: true,
            buttons: {
                tryAgain: {
                    text: 'OK',
                    btnClass: 'btn-orange',
                    action: function(){
                    }
                },
            }
        });
    };

    /*Open time info popup*/
    $scope.contactPopupConditions = function() {
        // this condition is checked so that pop opens only if verify sponser popup has been open.
        if($scope.userInfo.confirmSponsor){
            $scope.callStatus = $scope.userInfo.callStatus;
            var status = ['submitted', 'Answering', 'inprogress'];
            if ($scope.userInfo.callStatus) {
                if (status.indexOf($scope.userInfo.callStatus) < 0) {
                    $scope.getContactInfoPopup();
                    if(new Date($scope.userInfo.preferredContactTimeEnd).valueOf() < (new Date().valueOf()+(10*60*100))){
                        $scope.user.dateRangeStart= null;
                        $scope.user.dateRangeEnd = null;
                    }
                }else {
                    if ($scope.userInfo.preferredContactTimeEnd && $scope.userInfo.callStatus != 'Answering') {
                        if (new Date($scope.userInfo.preferredContactTimeEnd).valueOf() < (new Date().valueOf()+(10*60*100))) {
                            $scope.delayed= true;
                            $scope.user.dateRangeStart= null;
                            $scope.user.dateRangeEnd = null;
                            $scope.getContactInfoPopup();
                        }
                    }
                }
            } else {
                $scope.getContactInfoPopup();
            }
        }
    }
    $scope.contactPopupConditions();


    /*DateTime Picker Code*/
    $scope.startDateTimePickerConfig= {
         dropdownSelector: '#dropdownStart',
         renderOn: 'end-date-changed',
         minuteStep:5,
         startView:'day',
         configureOn: 'time-zone-changed'
    }

    $scope.endDateTimePickerConfig= {
         dropdownSelector: '#dropdownEnd',
         renderOn: 'start-date-changed',
         minuteStep:5,
         startView:'day',
         configureOn: 'time-zone-changed'
    }

    $scope.endDateBeforeRender = endDateBeforeRender
    $scope.endDateOnSetTime = endDateOnSetTime
    $scope.startDateBeforeRender = startDateBeforeRender
    $scope.startDateOnSetTime = startDateOnSetTime

    function startDateOnSetTime () {
      $scope.$broadcast('start-date-changed');
      angular.element('#start-date-dropdown').hide();
    }

    function endDateOnSetTime () {
      $scope.$broadcast('end-date-changed');
      console.log("Date end chaged");
      angular.element('#end-date-dropdown').hide();
      //angular.element('.datepicker-end-parent').removeClass('open');
      //$event.preventDefault(event);
    }

    $scope.openEndDropdown = function(){
        angular.element('#end-date-dropdown').toggle();
    }
    $scope.openStartDropdown = function(){
        angular.element('#start-date-dropdown').toggle();
    }

    /*function calculateOffset(adminTimezone, clientTimeZone){
        var adminOffset = moment.tz(adminTimezone).utcOffset(); // -240 for NY
        var userOffset = moment.tz(clientTimeZone).utcOffset(); // 330 for Indias
        var totalOffset = (-1)*adminOffset +(userOffset);
        var totalOffsetInHours = totalOffset/60; // 9.5  In vase of America-India
        return totalOffsetInHours;
    }*/

    function calculateOffset(adminTimezone, clientTimeZone){
        var adminOffset = moment.tz(adminTimezone).utcOffset(); // -240 for NY
        var userOffset = moment.tz(clientTimeZone).utcOffset(); // 330 for Indias
        var totalOffset = (userOffset-adminOffset);
        var totalOffsetInHours = Math.floor(totalOffset/60);
        var totalOffsetInMinutes = (totalOffset%60) // 30 in case if America-India
        if(totalOffsetInMinutes<0){
            totalOffsetInMinutes = 60 + totalOffsetInMinutes;
        }
        var offsets= [totalOffsetInHours, totalOffsetInMinutes ];
        return offsets;
    }

    var userTimeZone = $scope.timezone;
    function startDateBeforeRender ($view, $dates, $leftDate, $upDate, $rightDate) {
        var offset = calculateOffset($scope.adminTimeZone, $scope.timezone);
        var adminStartHour = $scope.supportStartHour + offset[0];
        var adminStartMinute = $scope.supportStartMinute + offset[1];
        if(adminStartMinute>=60){
            adminStartHour++;
            adminStartMinute = adminStartMinute-60;
        }
        var adminEndHour = $scope.supportEndHour + offset[0];
        var adminEndMinute = $scope.supportEndMinute + offset[1];
        if(adminEndMinute>=60){
            adminEndHour++;
            adminEndMinute = adminEndMinute-60;
        }

        if ($scope.user.dateRangeEnd) {
            var activeDate = moment($scope.user.dateRangeEnd);

            $dates.filter(function (date) {
              return (date.localDateValue() >= activeDate.valueOf());
            }).forEach(function (date) {
              date.selectable = false;
            })
        }

        var today = moment().valueOf();
        $dates.filter(function (date) {
            return date.localDateValue() < today -(24*60*60*1000)
        }).forEach(function (date) {
            date.selectable = false;
        });


       // to restrict hours by admin
       if ($view === "hour") {
            if(adminEndHour>=24){
                adminEndHour = adminEndHour-24;
            }
            $dates.filter(function(date){
                var hour = new Date(date.localDateValue()).getHours();
                if (adminEndHour > adminStartHour) {
                   return (hour < adminStartHour || hour > adminEndHour);
                } else {
                   return (hour > adminEndHour  && hour < adminStartHour);
                }
            }).forEach(function(date){
                date.selectable = false;
            });

            $dates.filter(function (date) {
                return date.localDateValue() < today
            }).forEach(function (date) {
                date.selectable = false;
            });
        }

        if($view=="minute"){
            // diable hours in minute view
            if(adminEndHour>=24){
                adminEndHour = adminEndHour-24;
            }
            $dates.filter(function(date){
                var hour = new Date(date.localDateValue()).getHours();
                if (adminEndHour > adminStartHour) {
                   return (hour < adminStartHour || hour > adminEndHour);
                } else {
                   return (hour > adminEndHour  && hour < adminStartHour);
                }
            }).forEach(function(date){
                date.selectable = false;
            });

            // Disbale minutes in Minute view
           $dates.filter(function (date) {
            var hour = new Date(date.localDateValue()).getHours();
            if (hour === adminStartHour) {
                return (new Date(date.localDateValue()).getMinutes() < adminStartMinute);
            }

            if (hour === adminEndHour || hour === adminEndHour - 24) {
                return (new Date(date.localDateValue()).getMinutes() > adminEndMinute);
            }
            }).forEach(function (date) {
              date.selectable = false;
            })
        }
    }

    function endDateBeforeRender ($view, $dates) {
        var offset = calculateOffset($scope.adminTimeZone, $scope.timezone);
        var adminStartHour = $scope.supportStartHour + offset[0];
        var adminStartMinute = $scope.supportStartMinute + offset[1];
        if(adminStartMinute>=60){
            adminStartHour++;
            adminStartMinute = adminStartMinute-60;
        }
        var adminEndHour = $scope.supportEndHour + offset[0];
        var adminEndMinute = $scope.supportEndMinute + offset[1];
        if(adminEndMinute>=60){
            adminEndHour++;
            adminEndMinute = adminEndMinute-60;
        }


        if ($scope.user.dateRangeStart) {
            //update the value of minutes in add to be equal to minuteStep in config
            var activeDate = moment($scope.user.dateRangeStart).subtract(1, $view).add(5, 'minute');

            $dates.filter(function (date) {
                return date.localDateValue() <= activeDate.valueOf()
            }).forEach(function (date) {
                date.selectable = false;
            })
        }

        var today = moment().valueOf();
        $dates.filter(function (date) {
            return date.localDateValue() < today -(24*60*60*1000)
        }).forEach(function (date) {
            date.selectable = false;
        });

        // to restrict hours by admin
        if ($view === "hour") {
             if(adminEndHour>=24){
                 adminEndHour = adminEndHour-24;
             }
             $dates.filter(function(date){
                 var hour = new Date(date.localDateValue()).getHours();
                 if (adminEndHour > adminStartHour) {
                    return (hour < adminStartHour || hour > adminEndHour);
                 } else {
                    return (hour > adminEndHour  && hour < adminStartHour);
                 }
             }).forEach(function(date){
                 date.selectable = false;
             });

             $dates.filter(function (date) {
                 return date.localDateValue() < today
             }).forEach(function (date) {
                 date.selectable = false;
             });
         }

         if($view=="minute"){
                $dates.filter(function (date) {
                 var hour = new Date(date.localDateValue()).getHours();
                 if (hour === adminStartHour) {
                     return (new Date(date.localDateValue()).getMinutes() < adminStartMinute);
                 }

                 if (hour === adminEndHour || hour === adminEndHour - 24) {
                     return (new Date(date.localDateValue()).getMinutes() > adminEndMinute);
                 }
             }).forEach(function (date) {
               date.selectable = false;
             })
         }

    }
    /*Datetime Picker ends*/

    //$scope.getContactInfoPopup();

    $scope.validateSponsor();
    $cookieStore.remove('refTarget'); // Remove referral targent cookie
    $cookieStore.remove('refUser'); // Remove referral user cookie

    $scope.updateUser  = function(form){
        $scope.submitted= true;
        // here we'll update the user info
        var data = angular.extend({ _id: $scope.userInfo._id }, $scope.userInfo);
        data.mobile = $scope.user.stdcode1+'-'+$scope.user.primaryMobileNo;
        if($scope.user.secondaryMobileNo){
            data.secondaryMobile = $scope.user.stdcode2 + '-' + $scope.user.secondaryMobileNo;
        }
        data.timeZone = $scope.timezone;
        if($scope.user.timeZoneCountry){
            data.timeZoneCountry = $scope.user.timeZoneCountry;
        }
        else{
            data.timeZoneCountry = $scope.user.countryName;
        }

        /*var x= ($scope.user.dateRangeStart).toISOString();
        var y = ($scope.user.dateRangeEnd).toISOString();*/
        /*data.preferredContactTimeStart = moment.tz( x,$scope.timezone).format('YYYY-MM-DD HH:MM');
        data.preferredContactTimeEnd = moment.tz(y,$scope.timezone).format('YYYY-MM-DD HH:MM')*/
        //data.preferredContactTimeStart = $scope.user.dateRangeStart;
        //data.preferredContactTimeEnd = $scope.user.dateRangeEnd;
        //save timmeStamp
        if($scope.user.dateRangeStart){
            //data.contactTimeStart = $scope.user.dateRangeStart.getTime();
            data.preferredContactTimeStart = $scope.user.dateRangeStart.getTime();
        }
        else{
            data.preferredContactTimeStart = 0
        }

         if($scope.user.dateRangeEnd){
            //data.contactTimeEnd = $scope.user.dateRangeEnd.getTime();
            data.preferredContactTimeEnd = $scope.user.dateRangeEnd.getTime();
        }
        else{
        data.preferredContactTimeEnd = 0;
        }
        data.userOffset = new Date().getTimezoneOffset();
        /*data.preferredContactTimeStart = moment.utc(x).tz($scope.timezone).format('YYYY/MM/DD hh:mm:ss');
        data.preferredContactTimeEnd = moment.utc(y).tz($scope.timezone).format('YYYY/MM/DD hh:mm:ss');*/
        data.skypeName = $scope.user.skypeName;
        data.callStatus = 'submitted';
        // Update User
        User.update(data, function (res) {
            $scope.userInfo.callStatus ='submitted';
            $uibModalStack.dismissAll();
            console.log('Successfully updated');
            $cookies.put('cinvsvd', 4);
            //growl.addSuccessMessage('Successfully Updated', { ttl: 3000 });
        });
    }

    $scope.hideContactPopup = function (){
       $cookies.put('cinvsvd', 5);
       $uibModalStack.dismissAll();
    };

    $scope.cryptoData = function () {

      //Utilities.
       CryptoMarket.getCryptoData({ limit: 10 }, function (response) {

        if (response.error) {
          // we are not getting data
          $scope.cryptoCurrencydata = [];
        }
        else {
          $scope.cryptoCurrencydata = response.data;
          $rootScope.$broadcast('top-six-currency-data', response.data);
          $scope.currentCrytocurrencyId = response.data[0].id;
          $scope.currentCryptocurrencyName = response.data[0].name;
          $scope.cryptoChartData();
        }
      });
    };


    $scope.preventClose = function (event) {
      event.stopImmediatePropagation();
    };

    $scope.tillDate = new Date();
    $scope.fromDate = new Date();
    $scope.fromDate.setDate($scope.tillDate.getDate() - 7);
    $scope.headerLimit = 6;
    $scope.cryptoData();

    //$scope.fromDate = new Date();

    $scope.dateFormat = 'yyyy-MM-dd';
    $scope.fromDateOptions = {
      formatYear: 'yy',
      startingDay: 1,
      showWeeks: false,
      //minDate: new Date();,
      maxDate: new Date($scope.tillDate.getTime()-(86400000))
    };

    $scope.fromDatePopup = {
      opened: false
    };
    $scope.tillDateOptions = {
      formatYear: 'yy',
      startingDay: 1,
      showWeeks: false,
      minDate: $scope.fromDate,
      maxDate: new Date()
    };

    $scope.tillDatePopup = {
      opened: false
    };

    $scope.$watch('fromDate', function (nv) {
      $scope.tillDateOptions.minDate = nv;
    });

    $scope.$watch('tillDate', function (nv) {
      $scope.fromDateOptions.maxDate = new Date(nv.getTime()-(86400000));
    });


    $scope.OpentillDate = function () {
      $scope.tillDatePopup.opened = !$scope.tillDatePopup.opened;
      $scope.fromDatePopup.opened = false;
    };


    $scope.OpenfromDate = function () {
      $scope.fromDatePopup.opened = !$scope.fromDatePopup.opened;
      $scope.tillDatePopup.opened = false;
    };

    // loader
    //$scope.loading = true;

    $scope.loadChart = function (currentCrytocurrencyId, currentCryptocurrencyName) {
      $scope.currentCrytocurrencyId = currentCrytocurrencyId;
      $scope.currentCryptocurrencyName = currentCryptocurrencyName;
      $scope.cryptoChartData();
    };

    $scope.filterChartBydate = function (fromDate, tillDate) {
      $scope.fromDate = fromDate;
      $scope.tillDate = tillDate;
      $scope.cryptoChartData();
    };


    $scope.cryptoChartData = function () {
      $scope.loading = true;
      $scope.x = ['date'];
      $scope.y = ['Price(USD)'];
      //Utilities.
      CryptoMarket.getCryptoChartData({ currency: $scope.currentCrytocurrencyId, starttime: +$scope.fromDate, endtime: +$scope.tillDate }, function (response) {
        if (response.error) {
          //error occured in getting chart data
        }
        else {
          $scope.cryptoDataLastUpdatedOn = response.lastUpdatedOn;
          angular.forEach(response.data.price_usd, function (d) {
            $scope.x.push(d[0]);
            $scope.y.push(d[1]);
          });
          $scope.generateChart();
        }
      });
    };

    var chart;

    $scope.generateChart = function () {
      chart = c3.generate({
        bindto: '#cryptoChart',
        data: {
          x: 'date',
          columns: [
            $scope.x,
            $scope.y
          ]
        },
        axis: {
          x: {
            label: {
              text: 'Time',
              position: 'outer-center'
            },
            type: 'timeseries',
            tick: {
              fit: false,
              //otate: 280,
              count: 6,
              multiline: false,
              outer: false,
              //format: '%d-%m-%Y'
              format: function (x) { return x.getDate() + ' '+x.toLocaleString('en-us', { month: 'short' }) + ' ' + x.getFullYear().toString().substr(-2); }
              //format: '%Y' // format string is also available for timeseries data
            }
          },
          y: {
            label: {
              text: 'Price(USD)',
              position: 'outer-center'
            },
            tick: {
              outer: false,
              format: d3.format('$,.2f')
              //format: '%Y' // format string is also available for timeseries data
            }
          }
        },
        point: {
          show: false
        }
      });
      $scope.loading = false;
    };

    //$scope.generateChart();


    // USD Wallet related
    $scope.goToWallet = function () {
        $state.go('wallet');
    };

   //Geo chart
    var chart1 = {};
    chart1.type = 'GeoChart';

    chart1.data = [
       ['Country', 'Users']
      ];

    chart1.options = {
      backgroundColor: {fill:'#FFFFFF',stroke:'#FFFFFF' ,strokeWidth:2 },
       // backgroundColor: { fill: '#FFFFFF', stroke: '#FFFFFF', strokeWidth: 0 },
      colorAxis: { minValue: 0, maxValue: 13, colors: ['#cbad75', '#c19e5d', '#b6965b', '#b69454', '#c4a772', '#f6d69a', '#c19e5d', '#b69454', '#cbad75', '#c19e5d', '#b69454', '#cbad75', '#f6d69a', '#f6d69a', ] },
      legend: 'none',
      datalessRegionColor: '#debf85',
      displayMode: 'regions',
      enableRegionInteractivity: 'true',
      resolution: 'countries',
      sizeAxis: {minValue: 1, maxValue:1,minSize:10,maxSize: 10},
      region:'world',
      keepAspectRatio: true,
      width:"100%",
      height:"100%",
      tooltip: {textStyle: {color: '#444444'}, trigger:'focus'}
    };

    chart1.formatters = {
      number : [{
        columnNum: 1,
        pattern: '#'
      }]
    };

    $scope.chart = chart1;
    $scope.getMapInfo = function() {
      Utilities.signupCountyStats(function(data) {
        $scope.countries = data.stats;
        chart1.data = [
          ['Country', 'Users']
        ];

        var newarr = [];
        var unique = {};

        angular.forEach($scope.countries, function(item) {
          if (!unique[item.country]) {
            newarr.push(item);
            unique[item.country] = item;
          }
        });

        var counter = [];
        var countriesName = [];
        var _countries = $scope.countries || [];
        for (var i = 0; i < _countries.length; i++) {
          _countries[i].country = (!_countries[i].country ? '??' : _countries[i].country)
          counter[_countries[i].country] = ((counter[_countries[i].country] || 0) + _countries[i].users);
        }

        var b = 0;
        for (var key in counter) {
          if(newarr[b].country === key){
            countriesName.push({
              "country":key,
              "name": (key == '??' ? 'Not Available' : newarr[b].name),
              "flag": newarr[b].flag,
              "users":counter[key]
            });
            chart1.data.push([
              newarr[b].name, counter[key]
            ]);
            b++;
          }
        }
        $scope.countries = [];
        $scope.countries = countriesName;
      });
    }

    $scope.getMapInfo();

    /*Tawk.to*/
    var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
    (function(){
    var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
    s1.async=true;
    s1.src='https://embed.tawk.to/595a48d0e9c6d324a473887d/default';
    s1.charset='UTF-8';
    s1.setAttribute('crossorigin','*');
    s0.parentNode.insertBefore(s1,s0);
    })();
    /*end of Tawk.io functionality*/

    // $scope.notifyPopup1 = function () {
    //   var messageTemplate = '';
    //   var imgUrl = '';
    //   var noImageUrl = 'assets/images/user/no-image.png';
    //  messageTemplate = '<div class="col-md-12 dashboard-Notify"><div class="col-md-2 col-sm-2 image"><img ng-src="https://login.icoinmarket.com/assets/images/flags/ke.png" style="border-radius: 50%" height="60" width="60" src="https://login.icoinmarket.com/assets/images/flags/ke.png">'+
    //             '</div><div class="col-md-9 col-sm-10 col-xs-12 content"><b class="ng-binding who">chandra prakash tiwari</b><br /><span class="what">Joined ICOIN Market Recently</span></div></div>';
    //   notify({
    //     messageTemplate: messageTemplate,
    //     classes: $scope.classes,
    //     scope: $scope,
    //     message: '',
    //     position: 'right',
    //     duration: 80000,
    //   });
    // };

// Start Place Commitments.
    $scope.checkedDurationcount = 0;
    $scope.checkedDuration = "";
    $scope.durationInMonths = 0;

    $scope.commitmentList = function() {
        CommitmentsService.commitmentsList(function(response) {
            console.log(response);
            //set transe experts name if no trade expert has picker the commitment
            response.result.forEach(function(value){
                if(!value.portfoliomanager){
                    // do not comapre the values by ===.
                    if(value.maturityPeriod == 3 || value.maturityPeriod == 4 || value.maturityPeriod == 24 )
                        value.portfoliomanager = 'Trader01';
                    else if(value.maturityPeriod == 6 || value.maturityPeriod == 18 )
                        value.portfoliomanager = 'Trader02';
                    else if(value.maturityPeriod == 12)
                        value.portfoliomanager = 'Trader03';
                }
                else{
                    value.portfoliomanager=value.portfoliomanager.name;
                }
            })
            $scope.commitmentsData = response.result;
            $scope.totalCommitedAmount = response.commitedAmount;
            $scope.maturityAmount = response.maturityAmount;
        });
    };

    $scope.checkDuration = function() {
        $scope.checkedDurationcount = 0;
        if ($scope.threeMonths) {
            $scope.checkedDuration = "0 to 3 Months";
            $scope.checkedDurationcount = $scope.checkedDurationcount + 1;
            $scope.durationInMonths = 3;
            $scope.package = "Aggressive";
        }
        if ($scope.fourMonths) {
            $scope.checkedDuration = "0 to 4 Months";
            $scope.checkedDurationcount = $scope.checkedDurationcount + 1;
            $scope.durationInMonths = 4;
            $scope.package = "Agile";
        }
        if ($scope.sixMonths) {
            $scope.checkedDuration = "0 to 6 Months";
            $scope.checkedDurationcount = $scope.checkedDurationcount + 1;
            $scope.durationInMonths = 6;
            $scope.package = "Distributive";
        }
        if ($scope.twelveMonths) {
            $scope.checkedDuration = "0 to 12 Months";
            $scope.checkedDurationcount = $scope.checkedDurationcount + 1;
            $scope.durationInMonths = 12;
            $scope.package = "Safe";
        }
        if ($scope.eighteenMonths) {
            $scope.checkedDuration = "0 to 18 Months";
            $scope.checkedDurationcount = $scope.checkedDurationcount + 1;
            $scope.durationInMonths = 18;
            $scope.package = "Stable";
        }
        if ($scope.twentyFourMonths) {
            $scope.checkedDuration = "0 to 24 Months";
            $scope.checkedDurationcount = $scope.checkedDurationcount + 1;
            $scope.durationInMonths = 24;
            $scope.package = "Fixed";
        }
    };

    $scope.confirmAlert = function(message) {
        $ngConfirm({
            title: 'Confirm',
            content: message,
            type: 'green',
            typeAnimated: true,
            buttons: {
                tryAgain: {
                    text: 'Yes',
                    btnClass: 'btn-green',
                    action: function() {
                        var current = new Date();
                        var maturitydate = new Date(new Date(current).setMonth(current.getMonth() + $scope.durationInMonths));
                        CommitmentsService.placeCommitment({
                            packagename: $scope.package,
                            amount: $scope.committedAmount,
                            startdate: current,
                            maturitydate: maturitydate,
                            cointype: 'usd',
                            maturityPeriod: $scope.durationInMonths
                        }, function(res) {
                            if (!res.error) {
                                $scope.usdWallet.balance = parseInt($scope.usdWallet.balance) - parseInt($scope.committedAmount);
                                $scope.committedAmount = 0;
                                $scope.commitmentList();
                                $scope.successAlert(res.message);
                                $uibModalStack.dismissAll();
                            } else {
                                $scope.warningAlert(res.message);
                            }
                        });
                    }
                },
                close: {
                    text: 'No',
                    action: function() {}
                }
            }
        });
    };

    $scope.placeCommitment = function() {
        if ($scope.checkedDurationcount == 1) {
            if ($scope.committedAmount) {
                if(parseInt($scope.usdWallet.balance) >= parseInt($scope.committedAmount)){
                var message = 'Are You Sure ? You want to commit $' + $scope.committedAmount + ' for ' + $scope.checkedDuration;
                $scope.confirmAlert(message);
                }
                else{
                    $scope.warningAlert("You do not have sufficient balance in you wallet.");
                }
            } else {
                $scope.warningAlert("Please fill commited amount before confirm.");
            }
        } else if ($scope.checkedDurationcount == 0) {
            $scope.warningAlert("Duration Not Selected");
        } else {
            $scope.warningAlert("Please select only one duration.");
        }
    };

    $scope.commitmentList();

    $scope.openDurationPopup = function() {
        if (!$scope.committedAmount) {
            $scope.warningAlert("Please fill Amount to be commit.");
            return false;
        }
        if (parseInt($scope.committedAmount) >= 100) {
              var remainder = $scope.committedAmount % 100;
            if (remainder == 0){
                $scope.threeMonths = false;
                $scope.fourMonths = false;
                $scope.sixMonths = false;
                $scope.twelveMonths = false;
                $scope.eighteenMonths = false;
                $scope.twentyFourMonths = false;
                $uibModalStack.dismissAll();
                $uibModal.open({
                    templateUrl: 'app/dashboard/statics/durationpopup.html',
                    scope: $scope,
                    windowClass: 'large-width',
                    backdrop: 'static',
                    keyboard: false,
                    size: 'lg'
                });
                //$scope.tabName = '0to3Months';
                $scope.tabName = '0to4Months';
            }
            else {
                $scope.warningAlert("Committed amount should be in multiple of $100.");
            }
        } else {
            $scope.warningAlert("Minimum committed amount limit is $100.So please commit more than $99");
        }
    };

    $scope.closeDurationPopup = function() {
        $uibModalStack.dismissAll();
    };

  $scope.changeDurationTab = function(name) {
      $scope.tabName = name;
  };

// End Place Commitments.

/* Start - Withdraw commitment */
  $scope.showCommitmentWithdrawalPopup = function(tradeAmount, commitmentId, commitmentStatus, packagename, maturityTimeCompleted){
      var statuses = ['COMMITTED', 'MATURED_PROFIT_WITHDRAWN', 'MATURED'];
    if(tradeAmount && commitmentId && commitmentStatus && statuses.indexOf(commitmentStatus) > -1){
        $scope.tradeAmount = tradeAmount;
        $scope.commitmentId = commitmentId;
        $scope.commitmentStatus = commitmentStatus;
        $scope.packagename = packagename;
        $scope.withdrawType = "allAmount";
        if(maturityTimeCompleted >= 100){
           $scope.isMature = true;
        }
        else{
           $scope.isMature = false;
        }
        $scope.showProfitWithdrawalButton = (packagename == 'Agile' || packagename == 'agile') ? true : false;

        CommitmentsService.commitmentWithdrawalInfo({commitmentId: $scope.commitmentId}, function(_result) {
            if(_result.error){
                $scope.warningAlert(_result.message);
            }else{
                if(!_result.data) {
                    $scope.commitmentWithdrawalError = "Rates is not defined.";
                }
                else {
                    $scope.WithdrawalInfo = _result.data;
                }
                $uibModal.open({
                    templateUrl: 'app/dashboard/statics/commitment-withdrawal.html',
                    size: 'md',
                    scope: $scope,
                    backdrop: 'static',
                    keyboard: false,
                    windowClass: 'zindex'
                });
            }
        });
    }
  };

  $scope.cancelCommitmentWithdrawal = function() {
       $uibModalStack.dismissAll();
  };

  $scope.updateWithdrawalType = function(withdrawType){
      $scope.withdrawType = withdrawType;
  };

  $scope.confirmCommitment = function(message) {
        $ngConfirm({
            title: 'Confirm',
            content: message,
            type: 'green',
            typeAnimated: true,
            buttons: {
                tryAgain: {
                    text: 'Yes',
                    btnClass: 'btn-green',
                    action: function() {
                        CommitmentsService.withdrawCommitment({
                            commitmentId: $scope.commitmentId,
                            withdrawType : $scope.withdrawType,
                            currentDate: new Date()
                        }, function(res) {
                            if (!res.error) {
                               $scope.totalCommitedAmount = parseInt($scope.totalCommitedAmount) - parseInt($scope.tradeAmount);
                               $scope.commitmentsData.filter(function (commitments) {
                                   if (commitments.id == $scope.commitmentId) {
                                       commitments.status = res.status;
                                   }
                               });
                               $scope.successAlert(res.message);
                               $uibModalStack.dismissAll();
                            } else {
                                $scope.warningAlert(res.message);
                            }
                        });
                    }
                },
                close: {
                    text: 'No',
                    action: function() {}
                }
            }
        });
    };

  $scope.processCommitmentWithdrawal = function (withdrawalRequest) {
      var statuses = ['COMMITTED', 'MATURED_PROFIT_WITHDRAWN', 'MATURED'];
      if (statuses.indexOf($scope.commitmentStatus) > -1) {
          var message = 'Are You Sure you want to proceed with this commitment withdrawal ?';
          $scope.confirmCommitment(message);
      } else {
          $scope.warningAlert("Commitment amount in not sufficient to withdraw.");
      }
  };
/* End - Withdraw commitment */

    $scope.openAlertPopup = function() {
        $ngConfirm({
            title: 'Dear User',
            content: "iCoinMarket has successfully closed the funding. ICM team thanks you for showing full faith and believing in us. Now you will see your trading profits on your investments. <br> <br> Initial Coin Offering (ICO), the next big thing in Digital Gold rush, the new era of crowd funding is here. Maximize your profits by investing in ICO's. Stay Tuned for more Details.",
            type: 'orange',
            typeAnimated: true,
            buttons: {
                tryAgain: {
                    text: 'OK',
                    btnClass: 'btn-orange'
                }
            }
        });
    };

})
  .controller('PDFDownloadCtrl', function ($scope, $http, Auth, $location, Utilities) {
    Utilities.getStaticContent({ type: 'pdf' }, function (res) {
      $scope.staticContent = res;
    });
  })
  .controller('TermsOfServiceCtrl', function ($scope, Auth, User,$cookies) {
    var _token   = $cookies.get('token');
    $scope.isPublicAccess=true;
    if(_token){
    $scope.isPublicAccess=false;
    $scope.isLoggedIn = Auth.isLoggedIn;
    $scope.userRole = Auth.getCurrentUser() && Auth.getCurrentUser().role;
     if (!$scope.userRole) {
      var currentUser = User.get(function(userData) {
         Auth.setCurrentUser(userData);
         $scope.userRole = userData.role;
      });
    }
  }
  })
  .controller('PrivacyPolicyCtrl', function ($scope, Auth, User,$cookies) {
    var _token   = $cookies.get('token');
    $scope.isPublicAccess=true;
    if(_token){
    $scope.isPublicAccess=false;
    $scope.isLoggedIn = Auth.isLoggedIn;
    $scope.userRole = Auth.getCurrentUser() && Auth.getCurrentUser().role;

    if (!$scope.userRole) {
      var currentUser = User.get(function(userData) {
         Auth.setCurrentUser(userData);
         $scope.userRole = userData.role;
      });
    }
  }
  })
  .controller('ContactUsCtrl', function ($scope, Auth, User,$cookies) {
    var _token   = $cookies.get('token');
    $scope.isPublicAccess=true;
    if(_token){
    $scope.isPublicAccess=false;
    $scope.isLoggedIn = Auth.isLoggedIn;
    $scope.userRole = Auth.getCurrentUser() && Auth.getCurrentUser().role;
     if (!$scope.userRole) {
      var currentUser = User.get(function(userData) {
         Auth.setCurrentUser(userData);
         $scope.userRole = userData.role;
      });
    }
  }
  })
   .controller('NavigationCtrl', function ($scope, Auth,$state,$location) {
    $scope.isLoggedIn = Auth.isLoggedIn;
    $scope.userRole = function () {
      var user = Auth.getCurrentUser();
      return user.role;
    };
    if($(".app-header-navigation").length > 0){
      $("[data-header-navigation-toggle]").on("click",function(){
          $(".app-header-navigation").toggleClass("show");
          return false;
      });

      $(".app-header-navigation li > a").on("click",function(){
          var pli = $(this).parent("li");
          if(pli.find("ul").length > 0 || pli.find(".app-header-navigation-megamenu").length > 0){
              pli.toggleClass("open");
              return false;
          }
      });
    }

     $scope.getClass1 = function (path) {
    return ($location.path().substr(0, path.length) === path) ? 'active-menu' : '';
    }

    $scope.getClass = function (path) {
    return ($state.includes(path)) ? 'active-menu' : '';
  }

  })
  .controller('MaintenancePopupCtrl', function ($scope, $cookies, $uibModalStack) {
    $scope.notShowAgain = function () {
      $cookies.put('cinvsvd', 2);
      $scope.defaultPlayAgain = 1;
      $uibModalStack.dismissAll();
      $scope.validateSponsor();
    };
  })
  .controller('WelcomeMessageCtrl', function ($scope, $cookies, $uibModal, $uibModalStack, $location,SponsorVerifier, User) {
    $scope.notShowAgain = function () {
      $cookies.put('cinvsvd', 2);
      $scope.defaultPlayAgain = 1;
      $uibModalStack.dismissAll();
      $scope.validateSponsor();
      //$scope.openZonepopup();

      // SponsorVerifier.validateSponsor(function (data) {
      //     $scope.userInfo = data.user;
      //     if (data.error == false && data.user.confirmSponsor == false) {
      //       User.getById({ reference: data.user.sponsor }, function (data) {
      //         $scope.sponsor = data;
      //         $uibModal.open({
      //           templateUrl: 'app/dashboard/currentsponsor.html',
      //           scope: $scope,
      //           size: 'md',
      //           backdrop: 'static',
      //           keyboard: false
      //         });
      //       });
      //     }
      //   });

    };

    $scope.knowMore = function () {
      //$cookies.put('cinvsvd', 2);
      //$scope.defaultPlayAgain = 1;
      $uibModalStack.dismissAll();
      $location.path('/know-more');
    };

  });
