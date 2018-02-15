angular.module('iCoinApp').controller('PurchaseRequestsCtrl', function($scope, $stateParams, $window, User, AdminAccess, Purchase) {

    AdminAccess.hasAdminAccess();
    $scope.isSoloAddAdmin = AdminAccess.isSoloAddAdmin;
    $scope.isFinanceAdmin = AdminAccess.isFinanceAdmin;
    $scope.isWatchUserAdmin = AdminAccess.isWatchUserAdmin;
    $scope.isModeratorAdmin     = AdminAccess.isModeratorAdmin;
    $scope.isSupervisorAdmin    = AdminAccess.isSupervisorAdmin;

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

    $scope.purachses = {};
    $scope.purchaseinfo = {};
    $scope.popInfo = {};
    $scope.currentPage = 1;
    $scope.totalPages = 0;
    $scope.filter = {data: ''};
    $scope.buttonWait = '';
    $scope.pageWait   = '';
    $scope.currentView = '';
    $scope.paymentthrough ='';
    $scope.transactionInfo = {};
    $scope.usdAmount = '';
    $scope.adscashCoins = '';
    $scope.approvedAmount = '';
    $scope.exportMessage = '';
    $scope.loadingText = '';
    $scope.currentView ='All';
    $scope.paymentthrough ='All';
    $scope.loadPage = function(filterRequest) {

      if(filterRequest == true) {
        $scope.buttonWait = 'Please wait, while searching...';
      }
      else {
        $scope.pageWait = 'Please wait, loading information...';
      }
      var userView='';
      if($scope.currentView !='All')
         var userView=$scope.currentView;
      var paymentThrough='';
      if($scope.paymentthrough !='All')
         var paymentThrough=$scope.paymentthrough;   

      if($scope.tillDate && $scope.fromDate){
              $scope.tillDate = new Date($scope.tillDate);
              $scope.tillDate.setHours(23,59,59,0);
              $scope.tillDate1 = new Date($scope.tillDate.getTime()).toISOString();
              $scope.fromDate = new Date($scope.fromDate);
              $scope.fromDate.setHours(0,0,0,0);
              $scope.fromDate1 = new Date($scope.fromDate.getTime()).toISOString();
        }

      Purchase.getPaymentsInfo({page: $scope.currentPage, filters: $scope.filter.data, view: userView, paymentthrough : paymentThrough, tillDate:$scope.tillDate1, fromDate: $scope.fromDate1}, function(info) {
        $scope.purchaseinfo = info.data;
        $scope.totalPages = info.rows;
        $scope.buttonWait = '';
        $scope.pageWait = info.message;
      });
    };

    $scope.viewDetails = function(key) {
      $scope.popInfo = $scope.purchaseinfo[key];
      $scope.selectedPaymode = $scope.purchaseinfo[key].paymode;
    };

    $scope.restoreModal = function() {
      $scope.loadingText = '';
      $scope.getTnxDetails.tx = '';
      $scope.transactionInfoError = '';
    };

    $scope.getTxDetails = function() {
      $scope.transactionInfoError = '';
      $scope.len = 0;
      $scope.loadingText = 'Please Wait while transaction info is loading...';
      Purchase.viewTransactionStatus({txnid: $scope.getTnxDetails.tx, paymode: $scope.selectedPaymode}, function(info) {
        if(info.data.status == 'success') {
          $scope.loadingText = '';
          var flag;
          var temp;
          for(var i=0; i< info.data.data.outputs.length; i++) {
            if($scope.popInfo.gatewaydata.address == info.data.data.outputs[i].address) {
              flag=true;
              $scope.len = i;
              var calculatedFee = (parseFloat($scope.popInfo.gatewaydata.fee)/ parseFloat($scope.popInfo.gatewaydata.amount)) * parseFloat(info.data.data.outputs[i].value);
              $scope.usdAmount = parseFloat((info.data.data.outputs[i].value - calculatedFee) * $scope.popInfo.gatewaydata.btnrt);
              if($scope.popInfo.productid === 'adscash') {
                $scope.adscashCoins = parseFloat(($scope.popInfo.unitcoins/$scope.popInfo.unitprice)*$scope.usdAmount);
                $scope.adscashCoins = Math.round($scope.adscashCoins * 10)/10;
              }
              temp = info.data.data.outputs[i];
              info.data.data.outputs = temp;
              break;
            } else {
              flag=false;
            }
          }

          if(!flag) {
            $scope.transactionInfoError = 'Sorry, The address did not match.';
            $scope.loadingText = '';
          } else {
            $scope.transactionInfo = info.data;
            $scope.transactionInfoError = '';
            // if($scope.popInfo.productid == 'usd') {
            //     $scope.transactionInfo = info.data;
            //     $scope.transactionInfoError = '';
            // }else if($scope.popInfo.productid == 'adscash') {
            //   if(temp.value < $scope.popInfo.gatewaydata.amount) {
            //     $scope.transactionInfoError = 'This user has transferred partial payment of '+ temp.value + ' BTC which is only for ' + $scope.adscashCoins + ' adscash coins as per the current rate.';
            //     $scope.loadingText = '';
            //   } else {
            //     $scope.transactionInfo = info.data;
            //     $scope.transactionInfoError = '';
            //   }
            // }
          }
        }
        else if(info.data.status == 'fail') {
          $scope.transactionInfoError = info.data.data.txid;
          $scope.loadingText = '';
        }
      });
    };

    $scope.approvePayment = function() {
      //$scope.buttonStatus = true;
      $scope.loadingMsg = '';
      if($scope.popInfo.productid == 'usd') {
        var approveAmount = angular.element('#approved-amount').val();
        if(isNaN(approveAmount)) {
          $scope.transactionInfoError = 'Approved amount should be a number';
          //$scope.buttonStatus = false;
        } else {
          $scope.ApprovedAmount = approveAmount ? approveAmount : $scope.usdAmount;
          $scope.minApprovedAmount = Math.round($scope.usdAmount * 10)/10 - (25/100)*Math.round($scope.usdAmount * 10)/10;
          $scope.maxApprovedAmount = Math.round($scope.usdAmount * 10)/10 + (25/100)*Math.round($scope.usdAmount * 10)/10;
          if($scope.ApprovedAmount < $scope.minApprovedAmount || $scope.ApprovedAmount > $scope.maxApprovedAmount){
            $scope.transactionInfoError = 'The Approved amount should be in between ' + $scope.minApprovedAmount + ' and ' + $scope.maxApprovedAmount;
            //$scope.buttonStatus = false;
          } else {
            $scope.transactionInfoError='';
            if(approveAmount === '') {
              var r = confirm('Are your sure, you want to continue with the exact amount?');
              var data='';
                if (r == true) {
                  data = {
                    notification_id : $scope.popInfo.gatewaydata.notification_id,
                    Payment_id : $scope.popInfo._id,
                    btnrt : $scope.popInfo.gatewaydata.btnrt,
                    amount : Math.round($scope.ApprovedAmount * 10)/10,
                    status : 'COMPLETED',
                    productId : 'usd',
                    successData : $scope.transactionInfo
                  };
                  console.log(data);
                  $scope.buttonStatus = true;
                  $scope.loadingMsg = 'Please wait..Do not refresh the page !!';
                  Purchase.approveTransaction({data: data}, function() {
                    $scope.transactionInfoError = '';
                    $scope.getTnxDetails.tx = '';
                    $scope.transactionInfo = {};
                    angular.element('.close-button').trigger('click');
                    //$scope.loadPage();
                    $scope.loadingMsg = '';
                    window.location.reload();
                  });
                } else {
                  $scope.buttonStatus = false;
                    return false;
                }
            }
            else{
                data = {
                  notification_id : $scope.popInfo.gatewaydata.notification_id,
                  Payment_id : $scope.popInfo._id,
                  btnrt : $scope.popInfo.gatewaydata.btnrt,
                  amount : Math.round($scope.ApprovedAmount * 10)/10,
                  status : 'COMPLETED',
                  productId : 'usd',
                  successData : $scope.transactionInfo
                };
                console.log(data);
                $scope.buttonStatus = true;
                $scope.loadingMsg = 'Please wait..Do not refresh the page !!';
                Purchase.approveTransaction({data: data}, function() {
                  $scope.transactionInfoError = '';
                  $scope.getTnxDetails.tx = '';
                  $scope.transactionInfo = {};
                  angular.element('.close-button').trigger('click');
                  //$scope.loadPage();
                  $scope.loadingMsg = '';
                  window.location.reload();
                });
            }
          }
        }
      } else if ($scope.popInfo.productid == 'adscash') {
        var approvecoins = angular.element('#approved-coins').val();
        if(isNaN(approvecoins)) {
          $scope.transactionInfoError = 'Approved coins should be a number';
          //$scope.buttonStatus = false;
        } else {
          $scope.ApprovedCoins = approvecoins ? approvecoins : $scope.adscashCoins;
          $scope.minApprovedCoins = Math.round($scope.adscashCoins * 10)/10 - (25/100)*Math.round($scope.adscashCoins * 10)/10;
          $scope.maxApprovedCoins = Math.round($scope.adscashCoins * 10)/10 + (25/100)*Math.round($scope.adscashCoins * 10)/10;
          if($scope.ApprovedCoins < $scope.minApprovedCoins || $scope.ApprovedCoins > $scope.maxApprovedCoins){
            $scope.transactionInfoError = 'The Approved coins should be in between ' + $scope.minApprovedCoins + ' and ' + $scope.maxApprovedCoins;
            //$scope.buttonStatus = false;
          } else {
            if(approvecoins == '') {
              var r = confirm('Are your sure, you want to continue with the exact amount of coins?');
                if (r == true) {

                  data = {
                    notification_id : $scope.popInfo.gatewaydata.notification_id,
                    Payment_id : $scope.popInfo._id,
                    btnrt : $scope.popInfo.gatewaydata.btnrt,
                    coinbybtc : Math.round($scope.ApprovedCoins * 10)/10,
                    amount : Math.round($scope.usdAmount * 10)/10,
                    status : 'COMPLETED',
                    productId : 'adscash',
                    successData : $scope.transactionInfo
                  };
                  $scope.buttonStatus = true;
                  $scope.loadingMsg = 'Please wait..Do not refresh the page !!';
                  Purchase.approveTransaction({data: data}, function() {
                    $scope.transactionInfoError = '';
                    $scope.getTnxDetails.tx = '';
                    $scope.transactionInfo = {};
                    angular.element('.close-button').trigger('click');
                    //$scope.loadPage();
                    $scope.loadingMsg = '';
                    window.location.reload();
                  });
                } else {
                  $scope.buttonStatus = false;
                    return false;
                }
            }
            else{
                data = {
                  notification_id : $scope.popInfo.gatewaydata.notification_id,
                  Payment_id : $scope.popInfo._id,
                  btnrt : $scope.popInfo.gatewaydata.btnrt,
                  coinbybtc : Math.round($scope.ApprovedCoins * 10)/10,
                  amount : Math.round($scope.usdAmount),
                  status : 'COMPLETED',
                  productId : 'adscash',
                  successData : $scope.transactionInfo
                };

                $scope.buttonStatus = true;
                $scope.loadingMsg = 'Please wait..Do not refresh the page !!';
                Purchase.approveTransaction({data: data}, function() {
                  $scope.transactionInfoError = '';
                  $scope.getTnxDetails.tx = '';
                  $scope.transactionInfo = {};
                  $scope.loadingMsg = '';
                  angular.element('.close-button').trigger('click');
                  //$scope.loadPage();
                  window.location.reload();
                });
            }
          }
        }
      }
    };

    // $scope.changeStatusFilter = function(status) {
    //   $scope.currentPage = 1;
    //   $scope.currentView = status;
    //   $scope.loadPage();
    // };

    $scope.exportDataAsExcel = function() {
      if($scope.purchaseinfo.length > 0) {
      var userView='';
      if($scope.currentView !='All')
         var userView=$scope.currentView;

      var paymentThrough='';
      if($scope.paymentthrough !='All')
         var paymentThrough=$scope.paymentthrough;  

        Purchase.exportPurchases({filters: $scope.filter.data, view: userView, paymentthrough : paymentThrough, tillDate:$scope.tillDate, fromDate: $scope.fromDate}, function(res){
          if(!res.error) {
            $scope.exportMessage = '';
            var filepath = '/api/utilities/export/' + res.file;
            $window.open( filepath );
          } else {
            $scope.exportMessage = res.message;
          }
        });
      } else {
        $scope.exportMessage = 'There are no records to export';
      }
    };

    $scope.loadPage();
  })