'use strict';

angular.module('iCoinApp')
  .controller('WithdrawlRequestsCtrl', function($scope, $window, $location, $stateParams, $uibModal, $uibModalStack, Withdrawal, AdminAccess, User) {

    AdminAccess.hasAdminAccess();
    $scope.isSoloAddAdmin = AdminAccess.isSoloAddAdmin;
    $scope.isFinanceAdmin = AdminAccess.isFinanceAdmin;
    $scope.isWatchUserAdmin = AdminAccess.isWatchUserAdmin;
    $scope.isModeratorAdmin = AdminAccess.isModeratorAdmin;
    $scope.isSupervisorAdmin = AdminAccess.isSupervisorAdmin;

    $scope.dateFormat = 'yyyy-MM-dd';
    $scope.fromDateOptions = {
      formatYear: 'yy',
      startingDay: 1,
      showWeeks: false,
      maxDate: new Date()
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
      if(nv)
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


    $scope.errorMessage = '';
    $scope.inProgress = false;
    $scope.errorMessage = '';
    $scope.withdrawals = [];
    $scope.currentPage = 1;
    $scope.totalPages = 0;
    $scope.wdeditinfo = {};
    $scope.wdinfo = {
      title: '',
      description: '',
      tasksteps: '',
      tasklink: ''
    };
    $scope.filter = {
      data: ''
    };
    $scope.status = 'pending';
    $scope.loadingContent = '';

    $scope.search = function() {
      $scope.isRefreshCall = false;
      $scope.loadPage(false, $scope.status);
    };

    $scope.loadPage = function(doReset, status) {
      $scope.loadingContent = 'Please wait, while loading list...';
      var query = {
        page: $scope.currentPage,
        status: status
      };
      if ($scope.filter.data !== '') {
        query.fdata = $scope.filter.data;
      }
      if($scope.tillDate && $scope.fromDate){
          $scope.tillDate = new Date($scope.tillDate);
          $scope.tillDate.setHours(23,59,59,0);
          $scope.tillDate1 = new Date($scope.tillDate.getTime()).toISOString();
          $scope.fromDate = new Date($scope.fromDate);
          $scope.fromDate.setHours(0,0,0,0);
          $scope.fromDate1 = new Date($scope.fromDate.getTime()).toISOString();
          query.tillDate = $scope.tillDate1;
          query.fromDate = $scope.fromDate1;
        }
       /*query.tillDate = $scope.tillDate;
       query.fromDate = $scope.fromDate;*/

      $scope.withdrawals = [];
      Withdrawal.get(query, function(info) {
        $scope.withdrawals = info.data;
        $scope.totalPages = info.rows;
        $scope.status = status;

        if (doReset == true) {
          $uibModalStack.dismissAll();
          $scope.errorMessage = '';
          $scope.wdeditinfo = {};
        }
        $scope.loadingContent = '';
      });
    };

    // $scope.changeStatus = function(status) {
    //   $scope.status = status;
    //   $scope.loadPage(true, status);
    // };

    $scope.updateWithdrawl = function() {
      var currentStatus = 'PROCESSING';
      var params = '';
      if ($stateParams.status === 'accepted') {
        currentStatus = 'COMPLETED';
        params = {
          _id: $scope.wdeditinfo._id,
          status: currentStatus,
          admincommentaccept: null,
          admincommentcancel: null,
          admincommentcomplete: $scope.wdeditinfo.comment,
          bitcointransactionid: $scope.wdeditinfo.transactionId
        };
      } else {
        params = {
          _id: $scope.wdeditinfo._id,
          status: currentStatus,
          admincommentaccept: $scope.wdeditinfo.comment,
          admincommentcancel: null,
          admincommentcomplete: null
        };
      }

      $scope.errorMessage = '';
      Withdrawal.update(params, function() {

        if (data._id) {
          $scope.withdrawals = [];
          $scope.wdeditinfo = {};
          //angular.element('#acceptDetails .close').trigger('click');
          $scope.closeModal();
          $scope.status = 'PENDING';
          $scope.loadPage(true, 'pending');
          // $window.location.reload();
        } else {
          $scope.errorMessage = data.message;
        }
      });
    };

    $scope.returnWithdrawal = function(key, request) {
      $scope.request = request;
      $scope.cancelKey = key;
      $uibModal.open({
        templateUrl: 'app/admin/withdrawals-list/withdrawal-cancel.html',
        scope: $scope,
        size: 'md'
      });
    };

    $scope.closeModal = function() {
      $uibModalStack.dismissAll();
      $scope.openModel = true;
    };

    $scope.doReturnRequest = function(key, request) {
      if (request === 'return') {
        Withdrawal.returnRequest({
          id: $scope.withdrawals[key.cancelKey]._id,
          admincommentreturn: key.comment
        }, function(data) {
          if (!data.error) {
            $uibModalStack.dismissAll();
            $scope.withdrawals[key.cancelKey].status = 'RETURNED';
            $scope.openModel = true;
            $scope.status = 'returned';
            $scope.loadPage(true, $scope.status);
          }
        });
      } else if (request === 'cancel') {
        Withdrawal.cancelRequest({
          id: $scope.withdrawals[key.cancelKey]._id,
          admincommentcancel: key.comment
        }, function(data) {
          if (!data.error) {
            //$scope.withdrawals[key.cancelKey].status = 'CANCELLED';
            //$scope.openModel = true;
            $uibModalStack.dismissAll();
            $scope.status = 'cancelled';
            $scope.loadPage(true, $scope.status);
          }
        });
      }
      // $uibModalStack.dismissAll();
      // $scope.openModel = true;
    };

    $scope.withdrawalDetails = function(key) {
      //if(!$scope.openModel) { return false; }
      $scope.openModel = false;
      $scope.wdeditinfo = $scope.withdrawals[key];
      $scope.userinfo = {};
      User.getById({
        reference: $scope.wdeditinfo.userid
      }, function(info) {
        $scope.userinfo = info;
        $scope.errorMessage = '';
        $scope.inProgress = false;

        $uibModal.open({
          templateUrl: 'app/admin/withdrawals-list/withdrawal-accept.html',
          size: 'md',
          scope: $scope,
          backdrop: true,
          keyboard: false
        });
      });
    };

    $scope.doInstantTransfer = function() {
      if ($scope.inProgress) {
        return false;
      }
      $scope.inProgress = true;
      $scope.errorMessage = 'Please Wait while we process the transaction..';
      Withdrawal.doInstantTransfer({
        wd: $scope.wdeditinfo._id,
        apiSecret: $scope.wdeditinfo.apiSecret,
        admincommentcomplete: $scope.wdeditinfo.admincommentcomplete
      }, function(info) {

        if (info._id) {
          $scope.closeModal();
          $scope.withdrawals = [];
          $scope.wdeditinfo = {};
          $scope.loadPage(false, 'pending');
          $scope.errorMessage = 'Please Wait...';
        } else {
          if (info.error) {
            $scope.errorMessage = info.message;
          } else {
            $scope.errorMessage = 'Something went wrong, please try after sometime';
          }
        }
        $scope.inProgress = false;
        $scope.openModel = true;
      });
    };

    $scope.loadPage(false, 'pending');
  })
  .controller('AdcWithdrawlRequestsCtrl', function($scope, $window, $location, $stateParams, $uibModal, $uibModalStack, Withdrawal, AdminAccess, User, PageLimit) {

    AdminAccess.hasAdminAccess();
    $scope.isSoloAddAdmin = AdminAccess.isSoloAddAdmin;
    $scope.isFinanceAdmin = AdminAccess.isFinanceAdmin;
    $scope.isWatchUserAdmin = AdminAccess.isWatchUserAdmin;
    $scope.isModeratorAdmin     = AdminAccess.isModeratorAdmin;
    $scope.isSupervisorAdmin    = AdminAccess.isSupervisorAdmin;

    $scope.errorMessage = '';
    $scope.inProgress   = false;
    $scope.errorMessage = '';
    $scope.withdrawals  = [];
    $scope.currentPage  = 1;
    $scope.totalPages   = 0;
    $scope.wdeditinfo   = {};
    $scope.jumpOnPage = '';
    $scope.pageLimit = PageLimit;
    $scope.wdinfo       = {
      title: '',
      description: '',
      tasksteps: '',
      tasklink: ''
    }
    $scope.filter = {data: ''};
    $scope.status = 'pending';
    $scope.loadingContent = '';
    var isRequestProcessing = false;

    $scope.search = function() {
      $scope.isRefreshCall = false;
      $scope.loadPage(false, $scope.status);
    }

    $scope.loadPage = function(doReset, status) {
      $scope.loadingContent = 'Please wait, while loading list...';
      var query = {page: $scope.currentPage, status: status, wtype : 'adscash'};
      if($scope.filter.data != '') {
        query.fdata = $scope.filter.data;
      }
      $scope.withdrawals = [];
      Withdrawal.get(query, function(info) {
        $scope.withdrawals = info.data;
        $scope.totalPages  = info.rows;
        $scope.pageLimit = info.limit;
        $scope.status = status;

        if(doReset == true) {
          $uibModalStack.dismissAll();
          $scope.errorMessage = '';
          $scope.wdeditinfo = {};
        }
        $scope.loadingContent = '';
      });
    }

    $scope.changeStatus = function(status) {
      $scope.status = status;
      $scope.loadPage(true, status);
    }

    $scope.updateWithdrawl = function(form) {
      var currentStatus = 'PROCESSING';
      if($stateParams.status == 'accepted') {
        currentStatus = 'COMPLETED';
        var params = {_id: $scope.wdeditinfo._id, status: currentStatus, admincommentaccept:null, admincommentcancel: null, admincommentcomplete: $scope.wdeditinfo.comment, bitcointransactionid: $scope.wdeditinfo.transactionId};
      }else{
        var params = {_id: $scope.wdeditinfo._id, status: currentStatus, admincommentaccept:$scope.wdeditinfo.comment, admincommentcancel: null, admincommentcomplete: null}
      }

      $scope.errorMessage = '';
      Withdrawal.update(params, function(data) {

        if(data._id) {
          $scope.withdrawals = [];
          $scope.wdeditinfo  = {};
          //angular.element('#acceptDetails .close').trigger('click');
          $scope.closeModal();
          $scope.status = 'PENDING';
          $scope.loadPage(true, 'pending');
          // $window.location.reload();
        }
        else {
          $scope.errorMessage = data.message;
        }
      })
    }

    $scope.jumpToPage = function() {
      var jumpToPage = (($scope.jumpOnPage == '' || $scope.jumpOnPage == 0 || isNaN($scope.jumpOnPage) || parseInt(jumpToPage) <= 0) ? $scope.currentPage : parseInt($scope.jumpOnPage));

      var maxLimit = parseInt(($scope.totalPages / $scope.pageLimit));
          maxLimit = (((maxLimit * $scope.pageLimit) < $scope.totalPages) ? (maxLimit + 1) : maxLimit);

      jumpToPage = ((jumpToPage > maxLimit) ? maxLimit : jumpToPage);
      $scope.jumpOnPage = jumpToPage;
      $scope.currentPage = $scope.jumpOnPage;
      $scope.loadPage(false, $scope.status);
    }

    $scope.returnWithdrawal = function(key, request) {
      $scope.request = request;
      $scope.cancelKey = key;
      var modalInstance = $uibModal.open({
        templateUrl: 'app/admin/withdrawals-list/withdrawal-cancel.html',
        scope: $scope,
        size: 'md'
      });
    }

    $scope.closeModal = function(){
      $uibModalStack.dismissAll();
      $scope.openModel = true;
    }


    $scope.doReturnRequest = function(key, request) {
      if(!isRequestProcessing){
        if(request == 'return') {
          isRequestProcessing = true;
          Withdrawal.returnRequest({id: $scope.withdrawals[key.cancelKey]._id, admincommentreturn: key.comment}, function(data) {
            isRequestProcessing = false;
            if(!data.error) {
              $uibModalStack.dismissAll();
              $scope.withdrawals[key.cancelKey].status = "RETURNED";
              $scope.openModel = true;
              $scope.status = 'returned';
              $scope.loadPage(true, $scope.status);
            }
          });
        } else if(request == 'cancel') {
          isRequestProcessing = true;
          Withdrawal.cancelRequest({id: $scope.withdrawals[key.cancelKey]._id, admincommentcancel: key.comment}, function(data) {
            isRequestProcessing = false;
            if(!data.error) {
              //$scope.withdrawals[key.cancelKey].status = "CANCELLED";
              //$scope.openModel = true;
              $uibModalStack.dismissAll();
              $scope.status = 'cancelled';
              $scope.loadPage(true, $scope.status);
            }
          });
        }
      }
    }

    $scope.withdrawalDetails = function(key) {
      //if(!$scope.openModel) { return false; }
      $scope.openModel  = false;
      $scope.wdeditinfo = $scope.withdrawals[key];
      $scope.userinfo = {};
      User.getById({reference: $scope.wdeditinfo.userid}, function(info) {
        $scope.userinfo = info;
        $scope.errorMessage = '';
        $scope.inProgress = false;

        var modalInstance = $uibModal.open({
          templateUrl: 'app/admin/withdrawals-list/adc-withdrawal-accept.html',
          size: 'md',
          scope: $scope,
          backdrop: true,
          keyboard: false
        });
      })
    }

    $scope.doInstantTransfer = function() {

      if($scope.inProgress) {return false;}
      $scope.inProgress   = true;
      $scope.errorMessage = 'Please Wait while we process the transaction..';
      Withdrawal.doInstantTransfer({wd: $scope.wdeditinfo._id, admincommentcomplete: $scope.wdeditinfo.admincommentcomplete}, function(info) {

        if(info._id) {
          $scope.closeModal();
          $scope.withdrawals = [];
          $scope.wdeditinfo  = {};
          $scope.loadPage(false, 'pending');
          $scope.errorMessage = 'Please Wait...';
        }
        else {
          if(info.error) {
            $scope.errorMessage = info.message;
          }
          else {
            $scope.errorMessage = 'Something went wrong, please try after sometime';
          }
        }
        $scope.inProgress = false;
        $scope.openModel  = true;
      });
    }

    $scope.loadPage(false, 'pending');
  });
