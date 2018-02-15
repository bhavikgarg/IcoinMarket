'use strict';

angular.module('iCoinApp')
  .service('AdminAccess', function(Auth, $location) {
    var isSoloAdd         = false,
        isAdmin           = false,
        isFinanceLogin    = false,
        isWatchUserLogin  = false,
        isModeratorLogin  = false,
        isSupervisorLogin = false,
        isSupportLogin    = false,
        isManagerLogin    = false,
        canSeeBackOffice  = false,
        userId            = '',
        financeRouting    = [
          '/admin/dashboard',
          '/admin/transfer-fee-register' ,
          '/admin/purchases'
        ],
        watchUserRouting      = ['/admin/dashboard', '/admin/agent-logs'],
        moderatorUserRouting  = ['/admin/kyc'],
        supervisorUserRouting = ['/admin/kyc'],
        supportUserRouting = ['/chatboard'],
        pmAdminRouting = ['/pmadmin'],
        userRoles             = Auth.getAdminRoles();

    return {
      hasAdminAccess: function() {
        var user = Auth.getCurrentUser();

        if(userRoles.indexOf(user.role) >= 0) {
          isAdmin           = (user.role === 'admin');
          isSoloAdd         = (user.role === 'solo');
          isFinanceLogin    = (user.role === 'finance');
          isWatchUserLogin  = (user.role === 'watchuser');
          isModeratorLogin  = (user.role === 'moderator');
          isSupervisorLogin = (user.role === 'supervisor');
          canSeeBackOffice  = ((user.role === 'admin' || isWatchUserLogin || isFinanceLogin) && user.username.indexOf('signup-call-agent') < 0);
          isSupportLogin = (user.role === 'support');
          isManagerLogin = (user.role === 'manager');

          if (isSoloAdd) {
            $location.path('/admin/soloadds');
          }
          if (isFinanceLogin && financeRouting.indexOf($location.path()) < 0) {
            $location.path(financeRouting[0]);
          }
          if (isWatchUserLogin && watchUserRouting.indexOf($location.path()) < 0) {
            $location.path(watchUserRouting[0]);
          }
          if (isModeratorLogin && moderatorUserRouting.indexOf($location.path()) < 0) {
            $location.path(moderatorUserRouting[0]);
          }
          if (isSupervisorLogin && supervisorUserRouting.indexOf($location.path()) < 0) {
            $location.path(supervisorUserRouting[0]);
          }
          if (isSupportLogin && supportUserRouting.indexOf($location.path()) < 0) {
            $location.path(supportUserRouting[0]);
          }
           if (isManagerLogin && pmAdminRouting.indexOf($location.path()) < 0) {
            $location.path(pmAdminRouting[0]);
          }

          userId = user._id;
          return true;
        }
        else {
          $location.path('/dashboard');
        }
      },

      getUserId: function() {
        return userId;
      },

      isSuperAdmin: function() {
        return isAdmin;
      },

      isSoloAddAdmin: function() {
        return isSoloAdd;
      },

      isFinanceAdmin: function() {
        return isFinanceLogin;
      },

      isWatchUserAdmin: function() {
        return isWatchUserLogin;
      },

      isModeratorAdmin: function() {
        return isModeratorLogin;
      },

      isSupervisorAdmin: function() {
        return isSupervisorLogin;
      },

      isSupportAdmin: function () {
        return isSupportLogin;
      },

      isManagerAdmin: function () {
        return isManagerLogin;
      },

      canSeeUserBackOffice: function() {
        return canSeeBackOffice;
      }
    };
  })
  .controller('AdminEditUserCtrl', function($scope, $http, $location, $stateParams, Auth, User, Utilities, AdminAccess, growl) {

    AdminAccess.hasAdminAccess();
    $scope.isSoloAddAdmin = AdminAccess.isSoloAddAdmin;
    $scope.isFinanceAdmin = AdminAccess.isFinanceAdmin;
    $scope.isWatchUserAdmin = AdminAccess.isWatchUserAdmin;
    $scope.isModeratorAdmin     = AdminAccess.isModeratorAdmin;
    $scope.isSupervisorAdmin    = AdminAccess.isSupervisorAdmin;

    User.get({id: $stateParams.id, all: 1}, function(resp) {
      $scope.userinfo = resp;
    });

    // Utilities.getGenre(function(data) {
    //   $scope.genres = data.genres;
    // });

    $scope.save = function() {
      var data = angular.extend({_id: $stateParams.id}, $scope.userinfo);

      User.update(data, function() {
        growl.addSuccessMessage('Updated successfully.', { ttl: 3000 });
        $location.path('/admin/dashboard');
      });
    };

    $scope.cancel = function() {
      $location.path('/admin/dashboard');
    };

    $scope.getCountries = function() {
      Utilities.getCountries(function(data) {
        $scope.countries = data.countries;
      });
    };

    $scope.getCountries();

    $scope.setCountryCode = function() {
      $scope.countries.forEach(function(country) {
        if(country.name === $scope.userinfo.countryName) {
          $scope.userinfo.countryCode = country.code;
        }
      });
    };

  })

  .controller('AdminProductsCtrl', function ($scope, $http, $location, Auth, Products, AdminAccess) {
    AdminAccess.hasAdminAccess();
    $scope.isSoloAddAdmin = AdminAccess.isSoloAddAdmin;
    $scope.isFinanceAdmin = AdminAccess.isFinanceAdmin;
    $scope.isWatchUserAdmin = AdminAccess.isWatchUserAdmin;
    $scope.isModeratorAdmin     = AdminAccess.isModeratorAdmin;
    $scope.isSupervisorAdmin    = AdminAccess.isSupervisorAdmin;

    Products.get(function(response) {
      $scope.products = response.data;
    });

    $scope.delete = function(product) {
      Products.remove({ id: product._id });
      angular.forEach($scope.products, function(u, i) {
        if (u === product) {
          $scope.products.splice(i, 1);
        }
      });
    };

    $scope.editProduct = function(product) {
      $location.url('/admin/product/'+product._id);
    };
  })
  .controller('AdminProductCreateCtrl', function ($scope, $http, $location, Auth, Products, AdminAccess, Utilities) {
    AdminAccess.hasAdminAccess();
    $scope.isSoloAddAdmin = AdminAccess.isSoloAddAdmin;
    $scope.isFinanceAdmin = AdminAccess.isFinanceAdmin;
    $scope.isWatchUserAdmin = AdminAccess.isWatchUserAdmin;
    $scope.isModeratorAdmin     = AdminAccess.isModeratorAdmin;
    $scope.isSupervisorAdmin    = AdminAccess.isSupervisorAdmin;

    $scope.create = true;
    $scope.createProduct = {
      name: '',
      cost: 0,
      coins: 0,
      ptype: 'tappax',
      description: '',
      pimage: '',
      subtype: ''
    };
    $scope.productTypes = [];
    Products.getProductTypes(function(data) {
      $scope.productTypes = data.types;
    });

    $scope.productSubTypes = [];
    Utilities.productSubTypes(function(data) {
      $scope.productSubTypes = data.subTypes;
    });

    $scope.update = function(){
      Products.create({
        name: $scope.name,
        amount: $scope.cost,
        coins: $scope.coins,
        active: true,
        ptype: $scope.ptype,
        description: $scope.description,
        pimage: $scope.pimage,
        subtype: $scope.subtype
      }, function() {
        $location.url('/admin/products');
      });
    };
  })
  .controller('AdminProductEditCtrl', function ($scope, $http, $location, $stateParams, Auth, Products, AdminAccess, Utilities) {
    AdminAccess.hasAdminAccess();
    $scope.isSoloAddAdmin = AdminAccess.isSoloAddAdmin;
    $scope.isFinanceAdmin = AdminAccess.isFinanceAdmin;
    $scope.isWatchUserAdmin = AdminAccess.isWatchUserAdmin;
    $scope.isModeratorAdmin     = AdminAccess.isModeratorAdmin;
    $scope.isSupervisorAdmin    = AdminAccess.isSupervisorAdmin;

    $scope.create = false;
    Products.get({
      id: $stateParams.id
    }, function(data) {
      $scope.product = data;

      $scope.name = $scope.product.name;
      $scope.cost = $scope.product.amount;
      $scope.coins = $scope.product.coins;
      $scope.ptype = $scope.product.ptype;
      $scope.subtype = $scope.product.subtype;
      $scope.description = $scope.product.description;
    });

    $scope.productTypes = [];
    Products.getProductTypes(function(data) {
      $scope.productTypes = data.types;
    });

    $scope.productSubTypes = [];
    Utilities.productSubTypes(function(data) {
      $scope.productSubTypes = data.subTypes;
    });

    $scope.update = function(){
      Products.update({
        '_id': $stateParams.id,
        name: $scope.name,
        description: $scope.description,
        amount: $scope.cost,
        coins: $scope.coins,
        active: true,
        ptype: $scope.ptype,
        subtype: $scope.subtype
      }, function() {
        $location.url('/admin/products');
      });
    };

  })
  .controller('AdminSoloAddList', function($scope, SoloAdds, AdminAccess) {

    AdminAccess.hasAdminAccess();
    $scope.isSoloAddAdmin = AdminAccess.isSoloAddAdmin;
    $scope.isFinanceAdmin = AdminAccess.isFinanceAdmin;
    $scope.isWatchUserAdmin = AdminAccess.isWatchUserAdmin;
    $scope.isModeratorAdmin     = AdminAccess.isModeratorAdmin;
    $scope.isSupervisorAdmin    = AdminAccess.isSupervisorAdmin;

    $scope.soloadds = SoloAdds.query();
    $scope.trackingInfoKey = 0;
    $scope.soloaddObj = {
      _id: '',
      trackinglink: '',
      isaccepted: false,
      acceptat: ''
    };

    $scope.addSoloTracking = function(key) {
      $scope.soloaddObj._id = $scope.soloadds[key]._id;
      $scope.trackingInfoKey = key;
    };

    $scope.saveSoloAddTracking = function(formObj) {
      if(formObj.$valid) {

        $scope.soloaddObj.isaccepted = true;
        $scope.soloaddObj.acceptat = new Date();

        SoloAdds.updateSoloAdd($scope.soloaddObj, function(data) {
          if(data._id) {
            $scope.soloadds[$scope.trackingInfoKey] = data;
            angular.element('#acceptOrder .close').trigger('click');
            $scope.soloaddObj = {
              _id: '',
              trackinglink: '',
              isaccepted: false,
              acceptat: ''
            };
          }
        });
      }
    };
  })
  .controller('BankWireListsCtrl', function($scope, $stateParams, $uibModal, $uibModalStack, $http, $window, Purchase, AdminAccess, User) {

    AdminAccess.hasAdminAccess();
    $scope.isSoloAddAdmin = AdminAccess.isSoloAddAdmin;
    $scope.isFinanceAdmin = AdminAccess.isFinanceAdmin;
    $scope.isWatchUserAdmin = AdminAccess.isWatchUserAdmin;
    $scope.isModeratorAdmin     = AdminAccess.isModeratorAdmin;
    $scope.isSupervisorAdmin    = AdminAccess.isSupervisorAdmin;
    $scope.user = {};
    $scope.bankwire = {};
    $scope.bankwireInfo = {};
    $scope.modelInfo = {};
    $scope.bankwireError = '';
    $scope.modelInfoKey = 0;
    $scope.modelViewInfo = {};
    $scope.currentPage = 1;
    $scope.totalPages = 0;
    $scope.filter = {data: ''};
    $scope.status = $stateParams.status.toUpperCase();
    $scope.purchaseInfo = {};

    $scope.loadPage = function() {
      var query = {page: $scope.currentPage, status: $stateParams.status};
      if($scope.filter.data !== '') {
        query.fdata = $scope.filter.data;
      }

      Purchase.getAdminBankWireInfo(query, function(info) {
        $scope.bankwireInfo = info.data;
        $scope.totalPages = info.rows;
      });
    };

    $scope.filterRecords = function() {
      $scope.currentPage = 1;
      $scope.loadPage();
    };

    $scope.updatePurchasePacks = function() {

      $scope.bankwireError = '';
      var quantity = (($scope.modelInfo.quantity > 0) ? ($scope.modelInfo.quantity) : ($scope.modelInfo.payamount / 25));

      if(!isNaN($scope.bankwire.goldpacks) && $scope.bankwire.goldpacks <= quantity && $scope.bankwire.goldpacks != 0) {
        $scope.bankwire.id = $scope.modelInfo._id;

        Purchase.updateBankWireAccept($scope.bankwire, function() {
          angular.element('#acceptDetails .close').trigger('click');
          $scope.bankwireInfo[$scope.modelInfoKey].status           = 'COMPLETED';
          $scope.bankwireInfo[$scope.modelInfoKey].swiftid          = $scope.bankwire.swiftid;
          $scope.bankwireInfo[$scope.modelInfoKey].goldpacks        = $scope.bankwire.goldpacks;
          $scope.bankwireInfo[$scope.modelInfoKey].adminbankaccount = $scope.bankwire.adminbankaccount;
          $scope.bankwireInfo[$scope.modelInfoKey].admincomments    = $scope.bankwire.admincomments;
          $scope.bankwire  = {};
          $scope.modelInfo = {};
        });
      }

      if(($scope.bankwire.goldpacks > quantity || $scope.bankwire.goldpacks == 0) || isNaN($scope.bankwire.goldpacks)) {
        $scope.bankwireError = 'Please assign Gold Pack equal to purchased packs';
      }
    };

    $scope.showInfo = function(key) {
      $scope.modelInfo    = $scope.bankwireInfo[key];
      $scope.modelInfoKey = key;
    };

    $scope.cancelTransaction = function(key) {
      Purchase.cancelTransaction({id: $scope.bankwireInfo[key]._id, type : 'bankwire'}, function() {
        $scope.bankwireInfo[key].status = 'CANCELLED';
        $scope.bankwireInfo.splice(key, 1);
      });
    };

    $scope.viewDetails = function(key) {

      $scope.modelViewInfo = $scope.bankwireInfo[key];
    };

    $scope.viewInvoice = function(key) {
      var info = $scope.bankwireInfo[key];
      // get user basic info
      User.getUserById({
          _id : $scope.bankwireInfo[key].userid
        },function(user){
            if(user)  $scope.user = user;
      });

      Purchase.showByToken({
        id: info.transactionid
      }, function(data) {
        $scope.purchaseInfo = data;
        // $scope.purchaseInfo.purchaseid = data._id;
        $scope.purchaseInfo.clicks = data.quantity;
      });

      Purchase.getBankWireInfo({
        token: info.transactionid,
        paymentid: info.paymentid
      }, function(info) {

        $scope.invoiceInfo = info.data;
        $scope.showCloseButton = true;

        $uibModal.open({
          templateUrl: 'app/products/purchase/purchase-invoice.html',
          size: 'lg',
          scope: $scope,
          windowClass: 'large-width'
        });
      });
    };
    $scope.showfile = function(file){
      // $scope.loadingMessage = true;
      $http.post('/api/utilities/url', { file: file }).then(function(res){
        $window.open( res.data.url );
      });
    };
    $scope.closeallmodals = function() {
      console.log('Done');
      $uibModalStack.dismissAll();
    };

    $scope.loadPage();
  })
  .controller('TasksCtrl', function($scope, $window, Tasks, AdminAccess) {

    AdminAccess.hasAdminAccess();
    $scope.isSoloAddAdmin = AdminAccess.isSoloAddAdmin;
    $scope.isFinanceAdmin = AdminAccess.isFinanceAdmin;
    $scope.isWatchUserAdmin = AdminAccess.isWatchUserAdmin;
    $scope.isModeratorAdmin     = AdminAccess.isModeratorAdmin;
    $scope.isSupervisorAdmin    = AdminAccess.isSupervisorAdmin;

    $scope.tasks = [];
    $scope.currentPage = 1;
    $scope.totalPages = 0;
    $scope.taskeditinfo = {};
    $scope.showError = false;
    $scope.errorMessage = '';
    $scope.taskinfo = {
      title: '',
      description: '',
      tasksteps: '',
      tasklink: ''
    };

    $scope.loadPage = function() {
      var query = {page: $scope.currentPage};

      Tasks.get(query, function(info) {
        $scope.tasks      = info.data;
        $scope.totalPages = info.rows;
      });
    };

    $scope.validateIframeLoading = function() {
      if($scope.taskinfo.tasklink == undefined) {
        $scope.showError = true;
        $scope.errorMessage = 'Please enter full url';
      }else{
        $scope.showError = false;
      }
    };

    $scope.save = function() {
      Tasks.create($scope.taskinfo, function(data) {
        if(data._id) {
          $scope.taskinfo = {
            title: '',
            description: '',
            tasksteps: '',
            tasklink: ''
          };
          angular.element('#addTask .close').trigger('click');
          $window.location.reload();

        }
      });
    };

    $scope.updateTask = function() {

      Tasks.update($scope.taskeditinfo, function(data) {

        if(data._id) {
          $scope.taskinfo = {
            title: '',
            description: '',
            tasksteps: '',
            tasklink: ''
          };
          angular.element('#editTask .close').trigger('click');
          $window.location.reload();
        }
      });
    };

    $scope.doInActive = function(key) {

      Tasks.inactive({id: $scope.tasks[key]._id}, function() {

        $window.location.reload();
      });
    };

    $scope.editTask = function(key) {

      $scope.taskeditinfo = $scope.tasks[key];
      $scope.showError = false;
      $scope.errorMessage = '';
    };
    $scope.addTask = function() {

      $scope.taskinfo = {
            title: '',
            description: '',
            tasksteps: '',
            tasklink: ''
          };
      $scope.showError = false;
      $scope.errorMessage = '';
    };

    $scope.loadPage();
  })
  .controller('AdvCashPendingPaymentsCtrl', function($scope, $http, User, Purchase, Utilities, AdminAccess) {

    AdminAccess.hasAdminAccess();
    $scope.isSoloAddAdmin = AdminAccess.isSoloAddAdmin;
    $scope.isFinanceAdmin = AdminAccess.isFinanceAdmin;
    $scope.isWatchUserAdmin = AdminAccess.isWatchUserAdmin;

    $scope.filter = {data: '', userdata: ''}; //'a4e39d29-6724-47d7-acbc-ffe5350eeb6a'
    $scope.advTransInfo = {};
    $scope.showData = false;
    $scope.showPaymentInfo = false;
    $scope.advloadingInfoMessage = '';
    $scope.loadingPaymentInfoMessage = '';

    $scope.findTransactionInfo = function() {

      $scope.advloadingInfoMessage = 'Loading Transaction Info ...';
      Utilities.getAdvCashInfo({data: $scope.filter.data}, function(data) {
        $scope.advTransInfo = data;
        $scope.showData = true;
        $scope.advloadingInfoMessage = '';
      });
    };

    $scope.getUserInfo = function() {

      $scope.loadingPaymentInfoMessage = 'Loading User and Payment Info...';
      User.findUser({data: $scope.filter.userdata}, function(info) {

        $scope.userInfo = info;
        Purchase.userPaymentInfo({userid: info._id, orderid: $scope.advTransInfo.orderId}, function(data) {
          $scope.paymentInfo = data;
          $scope.showPaymentInfo = ($scope.userInfo._id && data._id);
          $scope.loadingPaymentInfoMessage = '';
        });
      });
    };

    $scope.markCompleted  = function() {
      Purchase.markCompletePayment({
        userid: $scope.userInfo._id,
        orderid: $scope.advTransInfo.orderId,
        advkey: $scope.advTransInfo.id,
        buyeremail: $scope.advTransInfo.senderEmail
      }, function(data) {
        alert(data.error + '\n\r' + data.message);
        $scope.showData = false;
        $scope.showPaymentInfo = false;
        $scope.advloadingInfoMessage = '';
        $scope.loadingPaymentInfoMessage = '';
        $scope.filter = {data: '', userdata: ''};
      });
    };

    $scope.markTransfered = function() {
      Purchase.blockPayment({
        userid: $scope.userInfo._id,
        orderid: $scope.advTransInfo.orderId,
        advkey: $scope.advTransInfo.id
      }, function() {
        // console.log(data);
        // alert(data);
        $scope.showData = false;
        $scope.showPaymentInfo = false;
        $scope.advloadingInfoMessage = '';
        $scope.loadingPaymentInfoMessage = '';
        $scope.filter = {data: '', userdata: ''};
      });
    };
  })
  .controller('AgentLogCtrl', function($scope, $stateParams, $uibModal, $uibModalStack, User, AdminAccess) {

    AdminAccess.hasAdminAccess();
    $scope.isSoloAddAdmin = AdminAccess.isSoloAddAdmin;
    $scope.isFinanceAdmin = AdminAccess.isFinanceAdmin;
    $scope.isWatchUserAdmin = AdminAccess.isWatchUserAdmin;
    $scope.isModeratorAdmin     = AdminAccess.isModeratorAdmin;
    $scope.isSupervisorAdmin    = AdminAccess.isSupervisorAdmin;

    $scope.agentlog = {};
    $scope.agentlogInfo = {};
    $scope.currentPage = 1;
    $scope.totalPages = 0;

    $scope.loadPage = function() {

      User.getAgentLogs({page: $scope.currentPage}, function(info) {
        $scope.agentlogInfo = info.data;
        $scope.totalPages = info.rows;
      });
    };

    $scope.loadPage();
  })

  .controller('PurchaseRequestsCtrl', function($scope, $stateParams, $window, User, AdminAccess, Purchase) {

    AdminAccess.hasAdminAccess();
    $scope.isSoloAddAdmin = AdminAccess.isSoloAddAdmin;
    $scope.isFinanceAdmin = AdminAccess.isFinanceAdmin;
    $scope.isWatchUserAdmin = AdminAccess.isWatchUserAdmin;
    $scope.isModeratorAdmin     = AdminAccess.isModeratorAdmin;
    $scope.isSupervisorAdmin    = AdminAccess.isSupervisorAdmin;

    $scope.purachses = {};
    $scope.purchaseinfo = {};
    $scope.popInfo = {};
    $scope.currentPage = 1;
    $scope.totalPages = 0;
    $scope.filter = {data: ''};
    $scope.buttonWait = '';
    $scope.pageWait   = '';
    $scope.currentView = '';
    $scope.transactionInfo = {};
    $scope.usdAmount = '';
    $scope.adscashCoins = '';
    $scope.approvedAmount = '';
    $scope.exportMessage = '';
    $scope.loadingText = '';
    $scope.currentView ='All';
    $scope.loadPage = function(filterRequest) {

      if(filterRequest == true) {
        $scope.buttonWait = 'Please wait, while searching...';
      }
      else {
        $scope.pageWait = 'Please wait, loading information...';
      }

      Purchase.getPaymentsInfo({page: $scope.currentPage, filters: $scope.filter.data, view: $scope.currentView}, function(info) {
        $scope.purchaseinfo = info.data;
        $scope.totalPages = info.rows;
        $scope.buttonWait = '';
        $scope.pageWait = info.message;
      });
    };

    $scope.viewDetails = function(key) {
      $scope.popInfo = $scope.purchaseinfo[key];
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
      Purchase.viewTransactionStatus({txnid: $scope.getTnxDetails.tx}, function(info) {
        if(info.data.status == 'success') {
          $scope.loadingText = '';
          var flag;
          var temp;
          for(var i=0; i< info.data.data.outputs.length; i++) {
            if($scope.popInfo.gatewaydata.address == info.data.data.outputs[i].address) {
              flag=true;
              $scope.len = i;
              $scope.usdAmount = parseFloat((info.data.data.outputs[i].value - $scope.popInfo.gatewaydata.fee) * $scope.popInfo.gatewaydata.btnrt);
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

    $scope.changeStatusFilter = function(status) {
      $scope.currentPage = 1;
      $scope.currentView = status;
      $scope.loadPage();
    };

    $scope.exportDataAsExcel = function() {
      if($scope.purchaseinfo.length > 0) {
        Purchase.exportPurchases({filters: $scope.filter.data, view: $scope.currentView}, function(res){
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
  .controller('RevenueShareCutOfCtrl', function($scope, $stateParams, User, AdminAccess, Purchase) {

    $scope.revenueCutof = {};

    Purchase.getRevenueCutof(function(info) {
      $scope.revenueCutof = ((info && info.data) ? info.data[0] : {});
    });

    $scope.saveInfo = function(form) {
      $scope.updatemessage = '';
      if(form.$valid) {
        Purchase.updateRevenueCutof({cutofvalue: $scope.revenueCutof.cutofvalue}, function(d) {
          $scope.updatemessage = ((!d.error && d.data && d.data._id) ? 'Success' : 'Failed');
        });
      }
      else {
        $scope.updatemessage = 'Invalid Form Value';
      }
    };
  })
  // .controller('AdminTextAdsModerate', function ($scope, $state, $uibModal, $uibModalStack, $sce, AdminAccess, Campaign) {
  //
  //   $scope.nextAnchor    = 0;
  //   $scope.prevAnchor    = 0;
  //   $scope.limit         = 25;
  //   $scope.filterQuery   = {data: ''};
  //   $scope.currentPage   = 1;
  //   $scope.campaign      = {};
  //   $scope.totalPages    = 0;
  //   $scope.showActiveAds = 1;
  //   $scope.validateUrl   = $sce;
  //
  //   AdminAccess.hasAdminAccess();
  //   $scope.isSoloAddAdmin   = AdminAccess.isSoloAddAdmin;
  //   $scope.isFinanceAdmin   = AdminAccess.isFinanceAdmin;
  //   $scope.isWatchUserAdmin = AdminAccess.isWatchUserAdmin;
  //   $scope.isModeratorAdmin     = AdminAccess.isModeratorAdmin;
  //   $scope.isSupervisorAdmin    = AdminAccess.isSupervisorAdmin;
  //   $scope.canSeeUserBackOffice = AdminAccess.canSeeUserBackOffice;
  //
  //   $scope.loadPage = function() {
  //     var query = {
  //       page: $scope.currentPage,
  //       isactive: $scope.showActiveAds
  //     };
  //     if($scope.filterQuery.data != '') {
  //       query['filterQuery'] = $scope.filterQuery;
  //     }
  //
  //     Campaign.get(query, function(resp) {
  //       $scope.campaign   = resp.data;
  //       $scope.limit      = resp.limit;
  //       $scope.totalPages = resp.rows;
  //     });
  //   }
  //
  //   $scope.showInActiveTextAds = function() {
  //     $scope.showActiveAds = 0;
  //     $scope.loadPage();
  //   }
  //
  //   $scope.showActiveTextAds = function() {
  //     $scope.showActiveAds = 1;
  //     $scope.loadPage();
  //   }
  //
  //   $scope.updateStatus = function(_key) {
  //     Campaign.updateStatus({id: $scope.campaign[_key].id}, function() {
  //       $state.reload();
  //     });
  //   }
  //
  //   $scope.showActiveTextAds();
  // })
  .controller('SoloemailAdminCtrl', function($scope, $state, $uibModal, $uibModalStack, $sce, SoloEmails, AdminAccess) {
    $scope.currentPage    = 1;
    $scope.currentView    = 'active';
    $scope.loadingMessage = '';

    AdminAccess.hasAdminAccess();
    $scope.isSoloAddAdmin       = AdminAccess.isSoloAddAdmin;
    $scope.isFinanceAdmin       = AdminAccess.isFinanceAdmin;
    $scope.isWatchUserAdmin     = AdminAccess.isWatchUserAdmin;
    $scope.isModeratorAdmin     = AdminAccess.isModeratorAdmin;
    $scope.isSupervisorAdmin    = AdminAccess.isSupervisorAdmin;
    $scope.canSeeUserBackOffice = AdminAccess.canSeeUserBackOffice;

    $scope.soloemail = {
      purchaseid: '',
      replyto: '',
      subject: '',
      content: '',
      comment: ''
    };

    $scope.loadContent = function() {
      $scope.loadingMessage = 'Please wait, loading content...';
      SoloEmails.get({page: $scope.currentPage, type: $scope.currentView}, function(response) {
        $scope.soloemails     = response.data.soloEmails;
        $scope.payStatus      = response.data.payStatus;
        $scope.pageLimit      = response.limit;
        $scope.totalPages     = response.rows;
        $scope.loadingMessage = '';
      });
    };

    $scope.changeStatus = function(status) {
      $scope.soloemails  = [];
      $scope.currentPage = 1;
      $scope.currentView = status;
      $scope.loadContent();
    };

    $scope.closeAllDialogs = function() {
      $uibModalStack.dismissAll();
    };

    $scope.blockSoloEmailContent = function(key) {
      var order = $scope.soloemails[key];
      SoloEmails.blockSoloEmail({'id':order._id+''}, function(response) {
        $state.reload();
      });
    };

    $scope.showSoloEmailContent = function(key) {
      var order = $scope.soloemails[key];
      SoloEmails.getSoloEmailInfo({pid: order.purchaseid+''}, function(response) {
        if(!response.error) {
          $scope.soloemail = response;
          $scope.allowEdit = true;

          $scope.getTrustedHtml = $sce.getTrustedHtml;

          $uibModal.open({
            templateUrl: 'app/products/purchase/soloemail-content.html',
            size: 'lg',
            scope: $scope,
            backdrop: 'static',
            keyboard: false
          });
        }
        else {
          alert(respone.messsage);
        }
      });
    };

    $scope.updateSoloEmailContent = function() {
      $scope.errorMessage = '';

      SoloEmails.updateSoloEmail($scope.soloemail, function(response) {

        if(!response.error && response._id+'' == $scope.soloemail._id+'') {
          $scope.closeAllDialogs();
          $scope.reload();
        }
        else {
          $scope.errorMessage = response.message;
        }
      })
    };

    $scope.jumpToPage = function() {
      var _pages = parseInt(parseInt($scope.totalPages) / parseInt($scope.pageLimit));
      var cpages = (_pages * parseInt($scope.pageLimit));
      var pages  = ((cpages < $scope.totalPages) ? (_pages + 1) : _pages);

      $scope.jumpOnPage  = (($scope.jumpOnPage > pages) ? pages : $scope.jumpOnPage)
      $scope.currentPage = $scope.jumpOnPage;
      $scope.loadContent();
    };

    $scope.loadContent();
  })
  .controller('DailyAdsAdminCtrl', function($scope, $state, $uibModal, $uibModalStack, $sce, DailyAds, DailyAdsContent, AdminAccess) {
    $scope.currentPage    = 1;
    $scope.currentView    = 'active'
    $scope.loadingMessage = '';

    AdminAccess.hasAdminAccess();
    $scope.isSoloAddAdmin       = AdminAccess.isSoloAddAdmin;
    $scope.isFinanceAdmin       = AdminAccess.isFinanceAdmin;
    $scope.isWatchUserAdmin     = AdminAccess.isWatchUserAdmin;
    $scope.isModeratorAdmin     = AdminAccess.isModeratorAdmin;
    $scope.isSupervisorAdmin    = AdminAccess.isSupervisorAdmin;
    $scope.canSeeUserBackOffice = AdminAccess.canSeeUserBackOffice;

    $scope.loadContent = function() {
      $scope.loadingMessage = 'Please wait, loading content...';
      DailyAds.get({'page':$scope.currentPage,'type':$scope.currentView}, function(response) {
        $scope.dailyadsList   = response.data.dailyAds;
        $scope.payStatus      = response.data.payStatus;
        $scope.pageLimit      = response.limit;
        $scope.totalPages     = response.rows;
        $scope.loadingMessage = '';
      });
    };

    $scope.changeStatus = function(status) {
      $scope.dailyadsList = [];
      $scope.currentPage  = 1;
      $scope.currentView  = status;
      $scope.loadContent();
    };

    $scope.closeAllDialogs = function() {
      $uibModalStack.dismissAll();
    };

    $scope.blockDailyLoginAdsContent = function(key) {
      var viewAd = $scope.dailyadsList[key];
      DailyAds.blockAd({'id':viewAd._id+''}, function(response) {
        $state.reload();
      });
    };

    $scope.showDailyLoginAdsContent = function(key) {
      var viewAd             = $scope.dailyadsList[key];
      $scope.dailyAdPurchase = {'_id': viewAd.purchaseid};
      $scope.dailyads        = viewAd;
      DailyAdsContent.addDailyLoginAdsContent($scope, true);
    };

    $scope.updateDailyAdContent = function() {
      DailyAdsContent.updateDailyAdContent($scope);
    };

    $scope.jumpToPage = function() {
      var _pages = parseInt(parseInt($scope.totalPages) / parseInt($scope.pageLimit));
      var cpages = (_pages * parseInt($scope.pageLimit));
      var pages  = ((cpages < $scope.totalPages) ? (_pages + 1) : _pages);

      $scope.jumpOnPage  = (($scope.jumpOnPage > pages) ? pages : $scope.jumpOnPage)
      $scope.currentPage = $scope.jumpOnPage;
      $scope.loadContent();
    };

    $scope.loadContent();
  })

  .controller('PaypalListsCtrl', function($scope, $stateParams, $uibModal, $uibModalStack, $http, $window, Purchase, AdminAccess, User, PageLimit){

    AdminAccess.hasAdminAccess();
    $scope.isSoloAddAdmin = AdminAccess.isSoloAddAdmin;
    $scope.isFinanceAdmin = AdminAccess.isFinanceAdmin;
    $scope.isWatchUserAdmin = AdminAccess.isWatchUserAdmin;
    $scope.isModeratorAdmin = AdminAccess.isModeratorAdmin;
    $scope.isSupervisorAdmin = AdminAccess.isSupervisorAdmin;
    // get user basic info for invoice
    $scope.user = {};
    $scope.paypal = {};
    $scope.paypalInfo = {};
    $scope.modelInfo = {}
    $scope.paypalError = '';
    $scope.modelInfoKey = 0;
    $scope.modelViewInfo = {};
    $scope.currentPage = 1;
    $scope.pageLimit = PageLimit;
    $scope.totalPages = 0;
    $scope.filter = {data: ''};
    $scope.status = $stateParams.status.toUpperCase();
    $scope.purchaseInfo = {};

    // implement pagination here
    $scope.loadPage = function() {
      var query = {page: $scope.currentPage, status: $stateParams.status};
      if($scope.filter.data != '') {
        query.fdata = $scope.filter.data;
      }

      Purchase.getAdminPayPalInfo(query, function(info) {
        $scope.paypalInfo = info.data;
        $scope.totalPages = info.rows;
      });
    };

    $scope.filterRecords = function() {
      $scope.currentPage = 1;
      $scope.loadPage();
    };
    // called when we click accept button
    $scope.showInfo = function(key) {
      $scope.modelInfo    = $scope.paypalInfo[key];
      $scope.modelInfoKey = key;
    };

    $scope.cancelTransaction = function(key) {
      Purchase.cancelTransaction({id: $scope.paypalInfo[key]._id , type : 'paypalOffline'}, function(info) {
        $scope.paypalInfo[key].status = 'CANCELLED';
        $scope.paypalInfo.splice(key, 1);
      });
    };

    $scope.viewDetails = function(key) {

      $scope.modelViewInfo = $scope.paypalInfo[key];
    };

    $scope.viewInvoice = function(key) {
      var info = $scope.paypalInfo[key];
      // get user basic info
      User.getUserById({
          _id : $scope.paypalInfo[key].userid
        },function(user){
            if(user)  $scope.user = user;
      });

      Purchase.showByToken({
        id: info.transactionid
      }, function(data) {
        $scope.purchaseInfo = data;
        // $scope.purchaseInfo.purchaseid = data._id;
        $scope.purchaseInfo.clicks = data.quantity;
      });

      Purchase.getPayPalInfo({
        token: info.transactionid,
        paymentid: info.paymentid
      }, function(info) {

        $scope.invoiceInfo = info.data;
        $scope.showCloseButton = true;

        $uibModal.open({
          templateUrl: 'app/products/purchase/purchase-invoice.html',
          size: 'lg',
          scope: $scope,
          windowClass: 'large-width'
        });
      });
    };

    $scope.updatePurchasePacks = function(form) {

      $scope.paypalError = '';
      var quantity = (($scope.modelInfo.quantity > 0) ? ($scope.modelInfo.quantity) : ($scope.modelInfo.payamount / 25));

      if(!isNaN($scope.paypal.goldpacks) && $scope.paypal.goldpacks <= quantity && $scope.paypal.goldpacks != 0 && $scope.paypal.goldpacks > 0) {
        $scope.paypal['id'] = $scope.modelInfo._id;
        Purchase.updatePayPalAccept($scope.paypal, function(info) {
          angular.element('#acceptDetails .close').trigger('click');
          $scope.paypalInfo[$scope.modelInfoKey].status           = 'COMPLETED';
          // $scope.paypalInfo[$scope.modelInfoKey].swiftid          = $scope.paypal.swiftid;
          $scope.paypalInfo[$scope.modelInfoKey].goldpacks        = $scope.paypal.goldpacks;
          $scope.paypalInfo[$scope.modelInfoKey].adminbankaccount = $scope.paypal.adminbankaccount;
          $scope.paypalInfo[$scope.modelInfoKey].admincomments    = $scope.paypal.admincomments;
          $scope.paypal  = {};
          $scope.modelInfo = {};
        });
      }

      if(($scope.paypal.goldpacks > quantity || $scope.paypal.goldpacks == 0) || isNaN($scope.paypal.goldpacks) || ($scope.paypal.goldpacks < 0)) {
        $scope.paypalError = 'Please assign Gold Pack equal to purchased packs';
      }
    };

    $scope.showfile = function(file){
      // $scope.loadingMessage = true;
      $http.post('/api/utilities/url', { file: file }).then(function(res){
        $window.open( res.data.url );
      });
    };

    $scope.closeallmodals = function() {
      console.log('Done');
      $uibModalStack.dismissAll();
    };

    $scope.loadPage();


  })

  .controller('updateCurrencyRateCtrl', function($scope, AdminAccess, ApiPath, $http, Purchase){
    AdminAccess.hasAdminAccess();
    $scope.isSoloAddAdmin = AdminAccess.isSoloAddAdmin;
    $scope.isFinanceAdmin = AdminAccess.isFinanceAdmin;
    $scope.isWatchUserAdmin = AdminAccess.isWatchUserAdmin;
    $scope.isModeratorAdmin = AdminAccess.isModeratorAdmin;
    $scope.isSupervisorAdmin = AdminAccess.isSupervisorAdmin;
    $scope.currencyRate = {
      currentValue:'',
      updatedValue:'',
      updatemessage:''
    }
    Purchase.getCurrencyRateInfo({

    }, function(data) {
      $scope.currencyRate.currentValue = data.data.rate;
    });

    $scope.updateRate = function(form) {
      if(form.$valid) {
        var r = confirm('Are you sure, you want to update the currency rate!');
        if (r == true) {
          Purchase.updateCurrencyRate({
            rate: $scope.currencyRate.updatedValue
          }, function(data) {
            $scope.currencyRate.currentValue = $scope.currencyRate.updatedValue;
            $scope.currencyRate.updatedValue = '';
            $scope.currencyRate.updatemessage = 'New currency rate is successfully updated to ' + $scope.currencyRate.currentValue;
          });
        } else {
          return false;
        }
      }
    };
  })


  .controller('CompOffUsersListCtrl', function($scope, $state, $sce, $cookieStore, $http, $location, $uibModal, $uibModalStack, $timeout, Auth, User, AdminAccess, Utilities, ApiPath) {
    $scope.limit = 25;
    $scope.filter = {data: ''};
    $scope.pagination = {
      currentPage : 1,
      totalPages : 0
    }
    $scope.addCompoffSuccess = '', $scope.addCompoffError = '';

    AdminAccess.hasAdminAccess();
    $scope.isSoloAddAdmin   = AdminAccess.isSoloAddAdmin;
    $scope.isFinanceAdmin   = AdminAccess.isFinanceAdmin;
    $scope.isWatchUserAdmin = AdminAccess.isWatchUserAdmin;
    $scope.isModeratorAdmin     = AdminAccess.isModeratorAdmin;
    $scope.isSupervisorAdmin    = AdminAccess.isSupervisorAdmin;
    $scope.canSeeUserBackOffice = AdminAccess.canSeeUserBackOffice;
    $scope.isRefreshCall = false;

    $scope.selectedLevel = '-1';
    $scope.userDetail = '';

    // Use the User $resource to fetch all users
    $scope.loadPage = function() {
      if($scope.isRefreshCall && $scope.filter.data != '') {
        return false;
      }

      User.getCompOffUsers({page: $scope.pagination.currentPage, dataFilter: $scope.filter.data}, function(data) {
        $scope.compOffUsers = data.documents;
        $scope.pagination.totalPages = data.totalPages;
      });
    };

    $scope.loadBySearch = function() {
      $scope.isRefreshCall = false;
      $scope.loadPage();
    };

    $scope.enableCompOffUser = function(key, userid) {
      if(userid) {
        User.updateCompoffStatus({userid: userid, isEnabled: true}, function(response) {
          if(!response.error) {
            $scope.compOffUsers[key].isEnabled = true;
          }
        })
      }
    };

    $scope.disableCompOffUser = function(key, userid) {
      if(userid) {
        User.updateCompoffStatus({userid: userid, isEnabled: false}, function(response) {
          if(!response.error) {
            $scope.compOffUsers[key].isEnabled = false;
          }
        })
      }
    };

    $scope.searchUser = function() {
      $scope.userDetail = {};
      $scope.addCompoffError = '', $scope.addCompoffSuccess = '';
      User.query({limit: 1, dataFilter: $scope.searchedUser, type: 'compoff'}, function(data) {
        if(data[0].documents.length){
          $scope.userDetail = data[0].documents[0];
          $scope.selectedLevel = data[0].level.toString();
          $scope.userDetailError = '';
        } else {
          $scope.userDetailError = 'Sorry, No Records found!!';
          $scope.userDetail = '';
        }
      });
    };

    $scope.addUserToCompOffList = function() {
      $scope.addCompoffError = '', $scope.addCompoffSuccess = '';
      if($scope.userDetail) {
        User.addUserToCompOffList({userid: $scope.userDetail._id, level: $scope.selectedLevel},function(response) {
          if(response.error) {
            $scope.addCompoffError = response.message;
          } else {
            $scope.addCompoffSuccess = response.message;
            $scope.closeallmodals();
          }
        });
      } else {
        $scope.addCompoffError = 'Please provide user information to add';
      }
    };

    $scope.addToCompOffModal = function() {
      $uibModal.open({
        templateUrl: 'app/admin/add-to-comp-off.html',
        controller: 'CompOffUsersListCtrl',
        size: 'sm',
        windowClass: 'large-width',
        backdrop: 'static',
        keyboard: false
      });
    };

    $scope.closeallmodals = function() {
      $uibModalStack.dismissAll();
    };

    $scope.loadPage();
  })

  .controller('PremiumUsersListCtrl', function($scope, $state, $sce, $cookieStore, $http, $location, $uibModal, $uibModalStack, $timeout, Auth, User, AdminAccess, Utilities, ApiPath) {
    $scope.limit = 25;
    $scope.filter = {data: ''};
    $scope.pagination = {
      currentPage : 1,
      totalPages : 0
    };
    $scope.addPremiumSuccess = '', $scope.addPremiumError = '';

    AdminAccess.hasAdminAccess();
    $scope.isSoloAddAdmin   = AdminAccess.isSoloAddAdmin;
    $scope.isFinanceAdmin   = AdminAccess.isFinanceAdmin;
    $scope.isWatchUserAdmin = AdminAccess.isWatchUserAdmin;
    $scope.isModeratorAdmin     = AdminAccess.isModeratorAdmin;
    $scope.isSupervisorAdmin    = AdminAccess.isSupervisorAdmin;
    $scope.canSeeUserBackOffice = AdminAccess.canSeeUserBackOffice;
    $scope.isRefreshCall = false;

    $scope.userDetail = '';

    // Use the User $resource to fetch all users
    $scope.loadPage = function() {
      if($scope.isRefreshCall && $scope.filter.data != '') {
        return false;
      }

      User.getPremiumUsers({page: $scope.pagination.currentPage, dataFilter: $scope.filter.data}, function(response) {
        $scope.premiumUsers = response.data.documents;
        $scope.pagination.totalPages = response.data.totalPages;
      });
    };

    $scope.loadBySearch = function() {
      $scope.isRefreshCall = false;
      $scope.loadPage();
    };

    $scope.enablePremiumUser = function(key, userid) {
      if(userid) {
        User.updatePremiumUserStatus({userid: userid, isActive: true}, function(response) {
          if(!response.error) {
            $scope.premiumUsers[key].isActive = true;
          }
        })
      }
    };

    $scope.disablePremiumUser = function(key, userid) {
      if(userid) {
        User.updatePremiumUserStatus({userid: userid, isActive: false}, function(response) {
          if(!response.error) {
            $scope.premiumUsers[key].isActive = false;
          }
        })
      }
    };

    $scope.searchUser = function() {
      $scope.userDetail = {};
      $scope.addPremiumError = '', $scope.addPremiumSuccess = '';
      $scope.userDetailError = '';
      User.query({limit: 1, dataFilter: $scope.searchedUser}, function(data) {
        if(data[0].documents.length){
          $scope.userDetail = data[0].documents[0];
          $scope.selectedLevel = data[0].level.toString();
          $scope.userDetailError = '';
        } else {
          $scope.userDetailError = 'Sorry, No Records found!!';
          $scope.userDetail = '';
        }
      });
    };

    $scope.addUserToPremiumList = function() {
      $scope.addPremiumError = '', $scope.addPremiumSuccess = '';
      if($scope.userDetail) {
        User.addUserToPremiumList({userid: $scope.userDetail._id},function(response) {
          if(response.error) {
            $scope.addPremiumError = response.message;
            $scope.userDetail = null;
            $scope.searchedUser = '';
          } else {
            $scope.addPremiumSuccess = response.message;
            setTimeout(function() {
              $scope.closeallmodals();
            }, 1000);
            $state.reload();
          }
        });
      } else {
        $scope.addPremiumError = 'Please provide user information to add';
      }
    };

    $scope.addToPremiumModal = function() {
      $uibModal.open({
        templateUrl: 'app/admin/add-to-premium-user.html',
        controller: 'PremiumUsersListCtrl',
        size: 'sm',
        windowClass: 'large-width',
        backdrop: 'static',
        keyboard: false
      });
    };

    $scope.closeallmodals = function() {
      $uibModalStack.dismissAll();
    };

    $scope.loadPage();
  })
  //var query = {page: $scope.currentPage};
  .controller('UtilizationStatisticsCtrl', function($scope, Purchase) {
    $scope.totalCIGoldCoins = 0,
    $scope.totalAdsCashCoins = 0,
    $scope.totalUSD = 0,
    $scope.statisticsError = '';
    $scope.duration = {};
    $scope.startDate = new Date();
    $scope.endDate = new Date();

    $scope.clear = function() {
      $scope.startDate = null;
      $scope.endDate = null;
    };

    $scope.endDateOptions = {
      formatYear: 'yy',
      maxDate: new Date(),
      startingDay: 1
    };

    $scope.startDateOptions = {
      formatYear: 'yy',
      maxDate: new Date(),
      startingDay: 1
    };

    // Disable weekend selection
    function disabled(data) {
      var date = data.date,
        mode = data.mode;
      return mode === 'day' && (date.getDay() === 0 || date.getDay() === 6);
    }

    // $scope.toggleMin = function() {
    //   $scope.inlineOptions.minDate = $scope.inlineOptions.minDate ? null : new Date();
    //   $scope.dateOptions.minDate = $scope.inlineOptions.minDate;
    // };
    //
    // $scope.toggleMin();

    $scope.open1 = function() {
      $scope.popup1.opened = true;
    };

    $scope.open2 = function() {
      $scope.endDateOptions.minDate = $scope.startDate;
      $scope.popup2.opened = true;
    };

    $scope.setDate = function(year, month, day) {
      $scope.startDate = new Date(year, month, day);
      $scope.endDate = new Date(year, month, day);
    };

    $scope.formats = ['dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd.MM.yyyy', 'shortDate'];
    $scope.format = $scope.formats[0];
    $scope.altInputFormats = ['M!/d!/yyyy'];

    $scope.popup1 = {
      opened: false
    };

    $scope.popup2 = {
      opened: false
    };

    var tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    var afterTomorrow = new Date();
    afterTomorrow.setDate(tomorrow.getDate() + 1);
    $scope.events = [
      {
        date: tomorrow,
        status: 'full'
      },
      {
        date: afterTomorrow,
        status: 'partially'
      }
    ];

    function getDayClass(data) {
      var date = data.date,
        mode = data.mode;
      if (mode === 'day') {
        var dayToCheck = new Date(date).setHours(0,0,0,0);

        for (var i = 0; i < $scope.events.length; i++) {
          var currentDay = new Date($scope.events[i].date).setHours(0,0,0,0);

          if (dayToCheck === currentDay) {
            return $scope.events[i].status;
          }
        }
      }

      return '';
    }

    $scope.getDetailsByDate = function() {
      $scope.duration = {
        startDate : $scope.startDate,
        endDate : $scope.endDate
      }
      $scope.getStatistics();
    };

    $scope.getStatistics = function() {
      Purchase.getStatistics($scope.duration,function(data) {
        if(data.error) {
          $scope.statisticsError = data.message;
        }
        $scope.totalCIGoldCoins = data.Tcigoldcoin;
        $scope.totalAdsCashCoins = data.Tadscash;
        $scope.totalUSD = data.Tusd;
        $scope.pendingCIGoldCoins = data.Pcigoldcoin;
        $scope.pendingAdsCashCoins = data.Padscash;
        $scope.pendingUSD = data.Pusd;
        $scope.cancelledCIGoldCoins = data.Ccigoldcoin;
        $scope.cancelledAdsCashCoins = data.Cadscash;
        $scope.cancelledUSD = data.Cusd;
      });
    };
    $scope.getStatistics();
  })

  .controller('BusinessHouseCtrl', function($scope, AdminAccess, User, Utilities, $state, $timeout, $uibModal, $uibModalStack, BU_MIN_COMMISSION_LIMIT, BU_MAX_COMMISSION_LIMIT){
    $scope.nextAnchor = 0;
    $scope.prevAnchor = 0;
    $scope.limit = 25;
    $scope.filter = {data: ''};

    AdminAccess.hasAdminAccess();
    $scope.isSoloAddAdmin   = AdminAccess.isSoloAddAdmin;
    $scope.isFinanceAdmin   = AdminAccess.isFinanceAdmin;
    $scope.isWatchUserAdmin = AdminAccess.isWatchUserAdmin;
    $scope.isModeratorAdmin     = AdminAccess.isModeratorAdmin;
    $scope.isSupervisorAdmin    = AdminAccess.isSupervisorAdmin;
    $scope.canSeeUserBackOffice = AdminAccess.canSeeUserBackOffice;
    $scope.isRefreshCall = false;
    $scope.loading = false;

    // variables used
    $scope.userRoleError = '';
    $scope.businessUserRoles = [];
    $scope.countries = [];
    $scope.user = {};
    $scope.user.uploadDoc = '';
    $scope.saveError = '', $scope.saveSuccess = '';
    $scope.changeImage = false;
    $scope.minCommission = BU_MIN_COMMISSION_LIMIT;
    $scope.maxCommission = BU_MAX_COMMISSION_LIMIT;
    $scope.user = {
      uploadDoc: '',
      country: '',
      stdcode: '',
      userType:'',
      firstName: '',
      lastName: '',
      email: '',
      countryCode: '',
      mobile: ''
    };

    // Use the User $resource to fetch all users
    $scope.loadPage = function() {
      if($scope.isRefreshCall && $scope.filter.data != '') {
        return false;
      }

      User.getBusinessUsers({limit: $scope.limit, anchorId: $scope.nextAnchor, dataFilter: $scope.filter.data}, function(data) {
        $scope.users = data.documents;
        $scope.totalPages = data.totalPages;
        $scope.nextAnchor = data.nextAnchorId;
        $scope.prevAnchor = data.prevAnchorId;

        if(AdminAccess.isWatchUserAdmin() && $scope.filter.data == '') {
          $timeout(function() {
            $scope.nextAnchor = 0;
            $scope.prevAnchor = 0;
            $scope.isRefreshCall = true;
            $scope.loadPage();
          }, 10000);
        }
      });
    };

    var handleFileSelect = function(evt) {
      var file = evt.currentTarget.files[0];
      var reader = new FileReader();
      if(['image/jpeg', 'image/png'].indexOf(file.type) >= 0) {
        reader.onload = function (evt) {
          $scope.$apply(function($scope){
            $scope.user.uploadDoc = evt.target.result;
            $scope.changeImage = true;
          });
        };
        reader.readAsDataURL(file);
      }
    };
    angular.element(document.querySelector('#fileInput')).on('change',handleFileSelect);

    $scope.getBusinessUserRoles = function() {
      User.getBusinessUserRoles({},function(response) {
        if(!response.error && response.data) {
          $scope.businessUserRoles = response.data;
          $scope.user.userType = $scope.businessUserRoles[0];
        } else {
          $scope.userRoleError = response.message;
        }
      })
    };

    $scope.getCountries = function() {
      Utilities.getCountries(function(data) {
        $scope.countries = data.countries;
        $scope.user.country = $scope.countries[0].name;
        $scope.user.countryCode = $scope.countries[0].code;
        $scope.user.stdcode = $scope.countries[0].dial_code;
      });
    };

    $scope.getISDCodes = function() {
      Utilities.getISDCodes(function(data) {
        $scope.isdCodes = data.isdCodes;
        $scope.user.stdcode = $scope.isdCodes[0].dial_code;
      });
    };

    $scope.setISDCode = function() {
      $scope.countries.forEach(function(country) {
        if(country.name === $scope.user.country) {
          $scope.user.stdcode = country.dial_code;
        }
      })
    };
    $scope.setCountryCode = function() {
      $scope.countries.forEach(function(country) {
        if(country.name === $scope.user.country) {
          $scope.user.countryCode = country.code;
          $scope.setISDCode();
        }
      })
    };

    $scope.registerBusinessUser = function(form) {
      if(form.$valid) {
        $scope.saveError = '';
        $scope.user.fullmobile = $scope.user.stdcode + '-' + $scope.user.mobile;
        $scope.user.access = 'public-read';
        $scope.loading = true;
        User.registerBusinessUser($scope.user, function(response) {
          if(!response.error) {
            $scope.saveSuccess = response.message;
            $timeout(function(){
              $state.reload();
            }, 2000);
          } else {
            $scope.saveError = response.message;
          }
          $scope.loading = false;
        })
      } else {
        $scope.saveError = 'Please provide appropriate inputs';
      }
    };

    $scope.loadBySearch = function() {
      $scope.isRefreshCall = false;
      $scope.loadPage();
    };

    $scope.blockUser = function(user) {
      User.remove({ id: user._id, blocked: true }, function(resp) {
        user.isBlocked = true;
      });
    };

    $scope.unblockUser = function(user) {
      User.remove({ id: user._id, blocked: false }, function(resp) {
        user.isBlocked = false;
      });
    };

    $scope.viewUserDoc = function(user) {
      $scope.userDoc = user.personaldoc;
      $uibModal.open({
        templateUrl: 'app/admin/administrations/admin-users/user-doc-view.html',
        controller: 'BusinessHouseCtrl',
        size: 'md',
        scope: $scope,
        backdrop: true,
        keyboard: false
      });
    };

    $scope.closeallmodals = function() {
      console.log('Done');
      $uibModalStack.dismissAll();
    };
    $scope.loadPage();
    $scope.getBusinessUserRoles();
    $scope.getCountries();
    $scope.getISDCodes();
  });

  function roundNumber(num, scale) {
    var number = Math.round(num * Math.pow(10, scale)) / Math.pow(10, scale);
    if(num - number > 0) {
      return (number + Math.floor(2 * Math.round((num - number) * Math.pow(10, (scale + 1))) / 10) / Math.pow(10, scale));
    } else {
      return number;
    }
  }
