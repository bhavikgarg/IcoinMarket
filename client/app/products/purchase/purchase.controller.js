'use strict';

angular.module('iCoinApp')
  .service('PurachaseSoloAdds', function(SoloAdds, Utilities) {

    return {
      createSoloAds: function(postData, form, _callback) {

        if(form.$valid) {
          SoloAdds.createSoloAdd(postData, _callback);
        }
      },

      soloAdsCreateCallBack: function(data) {
        angular.element('#campaign-model .close').trigger('click');
        if(data._id) {
          return 'Thank you! You will shortly receided traffic on your campaign';
        }
        if(data.error) {
          return data.error;
        }
      },

      getLeadPages: function(_callback) {
        Utilities.getLandingPages(_callback);
      },

      getFormattedLeadPages: function(_landings) {

        var leadPages = ((_landings && typeof _landings.landingPages!== 'undefined') ? _landings.landingPages : []);
        var defaultPage = '';
        leadPages.push({
          path: '',
          title: 'Other Page Path',
          description: 'Enter your page path to get traffic on that page/site',
          defaultLink: false
        });

        leadPages.forEach(function(_p) {
          if(_p.defaultLink == true) {
            defaultPage = _p.path;
          }
        });

        return {
          leadPages: leadPages,
          defaultPage: defaultPage
        };
      }
    };
  })
  .service('DailyAdsContent', function(DailyAds, $uibModal) {

    return {

      addDailyLoginAdsContent: function($scope, allowEdit) {

        DailyAds.getDailyAdsInfo({pid: $scope.dailyAdPurchase._id+''}, function(response) {
          if(!response.error) {
            $scope.dailyads  = response;
            $scope.allowEdit = (allowEdit == true ? allowEdit : (response.pageurl === 'N/A'));

            if(response.pageurl === 'N/A') {
              $scope.dailyads.pageurl = '';
            }

            $uibModal.open({
              templateUrl: 'app/products/purchase/dailyads-content.html',
              size: 'lg',
              scope: $scope,
              backdrop: 'static',
              keyboard: false,
              windowClass: 'zindex'
            });
          }
          else {
            alert(respone.messsage);
          }
        });
      },

      updateDailyAdContent: function($scope) {
        $scope.errorMessage = '';

        DailyAds.updateDailyAds($scope.dailyads, function(response) {

          if(!response.error && response._id+'' === $scope.dailyads._id+'') {
            $scope.closeAllDialogs();
          }
          else {
            $scope.errorMessage = response.message;
          }
        });
      }
    };
  })
  .service('ProductDateFormat', function(moment) {
    return {
      formatDate: function(_date) {
        return moment(_date).format('YYYY-MM-DD').toString();
      }
    };
  })
  .controller('PurchaseCtrl', function($scope, $stateParams, Purchase, Products, Auth, Utilities, $location, $cookies, $timeout, $uibModal, $uibModalStack, growl, GC_USE) {
    $scope.clicked = false;
    $scope.waitMessage = '';
    $scope.products = [];
    $scope.username = Auth.getCurrentUser();
    $scope.isLoggedIn = Auth.isLoggedIn;
    Auth.getCurrentUser().$promise.then(function(user) {
      $scope.userRole = user.role;
    });

    $scope.buyInfo = {
       packs: 1,
       cost: 0,
       coins: 0,
       error : null
    };

    $scope.buyInfoProduct = {
      cost : 0
    };
    $scope.gold = {
      scqty: 0
    };
    $scope.productPurchaseInfo = {
      coins: 0,
      packs: 0,
      acoins: 0,
      apacks: 0
    };
    $scope.purchase = {
      quantity: 1
    };
    $scope.showGoldCoinForm  = false;
    $scope.showPaymentQRCode = false;
    $scope.singlePackPrice = 37;
    $scope.goldCoinsDetails = {
      error : '',
      balance : 0
    };
    var currentRate = 0;
    function getCIGoldCoins(){
      Purchase.getGoldCoinBalance(function(res){
        if(res && res.error){
          $scope.goldCoinsDetails.error = res.error;
        }
        else if(res && !res.error && res.coins){
          $scope.buyInfo.maxGoldCoinCanUse = ($scope.buyInfo.coins * GC_USE) > res.coins ? res.coins :  $scope.buyInfo.coins * GC_USE;
          $scope.goldCoinsDetails.balance = res.coins;
        }

        else{
          $scope.goldCoinsDetails.error = 'Unable to get user gold coins from clickintensity.';
        }
      },
      function(err){
        console.log(err);
        $scope.goldCoinsDetails.error = 'Unable to get user gold coins from clickintensity.';
      });
    }

    function getCurrentRate(){
      Purchase.getCurrencyRateInfo({}, function(res){
        if(res.err){
          $scope.error = res.err;
        }
        else{
          currentRate = res.data.rate;
          $scope.singlePackPrice = (1000*currentRate);
        }
      },
      function(err){
        console.log(err);
        //$scope.goldCoinsDetails.error = 'Unable to get user gold coins from clickintensity.';
      });
    }

    $scope.doCalculate = function(){
      $scope.buyInfo.totalAmount  = $scope.buyInfo.coins * currentRate;
      $scope.buyInfo.maxGoldCoinCanUse = (($scope.buyInfo.coins * GC_USE > $scope.goldCoinsDetails.balance) ? $scope.goldCoinsDetails.balance :  $scope.buyInfo.coins * GC_USE);

      if($scope.buyInfo.goldCoinsUsed > $scope.buyInfo.maxGoldCoinCanUse){
        $scope.buyInfo.goldCoinsUsed = $scope.buyInfo.maxGoldCoinCanUse;
      }

      $scope.buyInfo.paidAmount  = (($scope.buyInfo.coins - $scope.buyInfo.goldCoinsUsed)  * currentRate);
    };

    $scope.validatePurchaseForm = function(){
      $scope.buyInfo.maxGoldCoinCanUse = (($scope.buyInfo.coins * GC_USE > $scope.goldCoinsDetails.balance) ? $scope.goldCoinsDetails.balance :  $scope.buyInfo.coins * GC_USE);
      if($scope.buyInfo.goldCoinsUsed > $scope.buyInfo.maxGoldCoinCanUse)
      {
          $scope.buyInfo.error = 'You can not used more then '+$scope.buyInfo.maxGoldCoinCanUse+' Gold coins.';
          return false;
      }
      else {
        Purchase.getValidToken({reqType: 'payment'}, function(_token) {
          if(_token.error) {
            $scope.buyInfo.error = _token.message;
            return false;
          }
          else {
            $scope.paymentRequestToken = _token.reqtoken;
            $uibModal.open({
              templateUrl: 'app/products/purchase/paymethodsall.html',
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

    $scope.payLater = function(){
      $scope.paymentError = 'This Invoice is valid for the next 3 hours, any payments to this address after this duration might not be credited.';
      setTimeout(function(){
        $scope.closeDialog();
        $scope.closeAllDialogs();
      }, 5000);
    };

    $scope.cancelInvoice = function(paymentid, paymode){
      $scope.paymentError = 'Please wait.';
      Purchase.cancelTransaction({id: paymentid, type : paymode }, function(info) {
        if(info.error) {
          $scope.paymentError = info.message;
          growl.addErrorMessage(info.message, {ttl : 1000});
        } else {
          $scope.paymentSuccess = info.message;
          growl.addSuccessMessage(info.message, {ttl : 1000});
        }
        $timeout(function () {
          $scope.closeDialog();
          $scope.closeAllDialogs();
        }, 1000);
      });
    };

    $scope.verifyPayment = function(){
      if($scope.buyInfo.response && $scope.buyInfo.response.id){
        Purchase.verifyPayment({ token : $scope.buyInfo.response.token }, {}, function(resp){
          if(resp.error){
            alert(resp.message);
          }
          else if(!resp.error && !resp.istemp){
            window.location.href = '/purchase-success/'+resp.token;
          }
          else if (!resp.error && resp.istemp === 1) {
            alert(resp.message);
            setTimeout(function(){
              window.location.href = '/purchase-success/'+resp.token;
            }, 500);
          }
          else{
            alert(resp.message);
            $scope.closeDialog();
            $scope.closeAllDialogs();
          }
        },function(err){
          console.log('Payment verification error:'+err);
          alert('Unable to verify payment.');
        });
      }
      else{
        $scope.waitMessage = 'Invalid details';
      }
    };

    $scope.isActive = function(route) {
      return route === $location.path();
    };

    $scope.pType    = $location.path().indexOf('adscash')>=0 ? 'adscash' : ($location.path().indexOf('usd') >=0 ? 'usd' : ''); //$stateParams.type;

    // Getting Products List
    // Products.get({type: $scope.pType}, function(resp) {
    //
    //   var _data = resp.data || [];
    //   _data.forEach(function(d) {
    //     d.quantity = 1;
    //     if(!d.subtype || d.subtype == null || d.subtype == 'normal') {
    //       d.quantity = 100;
    //       d.coins = 80;
    //       d.amount = 80;
    //     }
    //     d.packPurchaseErrorMessage = '';
    //     $scope.products.push(d);
    //   });
    //
    // });

  //  $scope.message  = 'Purchase';
    $scope.gateways = Purchase.getGateways();
    $scope.paymode  = {
      name: ''
    };
    $scope.paymode2  = {
      name: ''
    };



    Purchase.getPurchasedPacksInfo({type: 'adscash'}, function(data) {
      $scope.productPurchaseInfo = data;
    });

    $scope.isRenew = (!!$stateParams.id);

    $scope.availableCredits = {
      quantity: 0
    };

    $scope.productInfo = {
      amount: '0',
      coins: '0',
      name: '',
      quantity: 0,
      paidAmount: 0,
      earnedCoins: 0
    };

    $scope.buyInfoGoldCoins = { proceed : false };



    // if($scope.isRenew) {
    //   Purchase.get({id: $stateParams.id}, function(_purchase) {
    //     Products.getItem({id: _purchase.productid}, function(data) {
    //       if(typeof data._id != 'undefined') {
    //         $scope.selectedProduct = data._id;
    //         $scope.availableCredits.quantity = 10000;
    //         $scope.productInfo = {
    //           amount: data.amount,
    //           coins: data.coins,
    //           name: data.name,
    //           id: data._id,
    //           quantity: _purchase.quantity,
    //           paidAmount: _purchase.paidamount,
    //           earnedCoins: _purchase.coins
    //         };
    //       }
    //     });
    //   });
    // }

    //$scope.selectedProduct = '';
    //$scope.productType = '';
  //  $scope.bankwireError = '';

    // Get selected product coins and amount info
    // $scope.getProductPrice = function() {
    //
    //   $scope.products.forEach(function(p) {
    //     if(p._id == $scope.selectedProduct) {
    //       $scope.productInfo = {
    //         amount: p.amount,
    //         coins: p.coins,
    //         name: p.name,
    //         id: p._id,
    //         quantity: 1,
    //         paidAmount: p.amount,
    //         earnedCoins: p.coins
    //       };
    //       if(p.ptype == 'tappax') {
    //         Purchase.availableCredits(function(creditInfo) {
    //           $scope.availableCredits.quantity = creditInfo.credits[0].maxAllow - creditInfo.credits[0].quantity;
    //         });
    //       }
    //       else {
    //         $scope.availableCredits.quantity = 10000;
    //       }
    //     }
    //   });
    // };

    // Calculate paid amount and get coins (after purchase user will get this much coins)
    // $scope.doCalculate = function() {
    //
    //   $scope.productInfo.paidAmount  = $scope.productInfo.quantity * $scope.productInfo.amount;
    //   $scope.productInfo.earnedCoins = $scope.productInfo.quantity * $scope.productInfo.coins;
    // };

    // Initilize Make payment request by user
    $scope.doPurchase = function() {
      var payInfo = angular.extend({type: $scope.paymode.name, '_token': $cookies.get('token') }, $scope.productInfo);

      Purchase.doPayment(payInfo, function(data) {
        window.location.href = data.PAYMENTURL;
      });
    };

    Utilities.getPacksInfo({
      type: $scope.pType
    }, function(data) {
      if(!data.error){
        $scope.packInformation = data.data;
        $scope.buyInfo.cost  = (($scope.buyInfo.packs > 0 ? ($scope.buyInfo.packs) : 0) * $scope.packInformation.price);
        $scope.buyInfo.coins = (($scope.buyInfo.packs > 0 ? ($scope.buyInfo.packs) : 0) * $scope.packInformation.coins);
      }
      else {
        $scope.packsInfo.error = data.message;
      }

    });

    $scope.updateBuyCost = function() {
      if((isNaN($scope.buyInfo.packs) && $scope.buyInfo.packs !== '' && typeof $scope.buyInfo.packs !== 'undefined')) {
        $scope.buyInfo.packs = 1;
      }
      if(!isNaN($scope.buyInfo.packs) && parseInt($scope.buyInfo.packs) > 4000) {
        $scope.buyInfo.packs = 4000;
      }
      $scope.buyInfo.cost  = (($scope.buyInfo.packs > 0 ? ($scope.buyInfo.packs) : 0) * $scope.packInformation.price);
      $scope.buyInfo.coins = (($scope.buyInfo.packs > 0 ? ($scope.buyInfo.packs) : 0) * $scope.packInformation.coins);

    };

    $scope.updateBuyCostGoldCoins = function() {
      var gcrt = 0.025,
          gcmaxcanuse = (($scope.buyInfoGoldCoins.amount * GC_USE)/gcrt);
          gcmaxcanuse = gcmaxcanuse > $scope.goldCoinsDetails.balance ? $scope.goldCoinsDetails.balance : gcmaxcanuse;
    if($scope.buyInfoGoldCoins.gcused > gcmaxcanuse){
      $scope.buyInfoGoldCoins.gcused = gcmaxcanuse;
    }
    var gcusedamt = ($scope.buyInfoGoldCoins.gcused * gcrt);
     $scope.buyInfoGoldCoins.pendingAmount = parseFloat($scope.buyInfoGoldCoins.amount - gcusedamt);
    };



    $scope.validateInput = function() {
      Purchase.getValidToken({reqType: 'payment'}, function(_token) {
        if(_token.error) {
          $scope.silverPackPurchaseErrorMessage = _token.message;
        }
        else {
          $scope.silverPackPurchaseErrorMessage = '';
          $scope.paymentRequestToken = _token.reqtoken;
        }

        if((isNaN($scope.gold.scqty) && $scope.gold.scqty !== '' && typeof $scope.gold.scqty !== 'undefined')) {
          $scope.gold.scqty = 1;
        }
        if(!isNaN($scope.gold.scqty) && parseInt($scope.gold.scqty) > 4000) {
          $scope.gold.scqty = 4000;
        }

      });
    };

    $scope.closeAllDialogs = function() {
      $uibModalStack.dismissAll();
    };

    $scope.closeDialog = function() {
      $scope.showGoldCoinForm = false;
      $scope.showPaymentQRCode = false;
      $scope.paymentError = '';
      $scope.buyInfoGoldCoins = { proceed : false };
      $scope.buyInfo = { packs: 1, cost: $scope.singlePackPrice, coins: 1000, error : null };
      angular.element('#payoptions .close').trigger('click');
    };

    $scope.paymentRequestToken = '';
    $scope.prevForm = null;
    // Purchase Gold or Silver Packs from their respective pages
    $scope.purchasePacks = function(form) {
      form = (form ? form : $scope.prevForm);
      $scope.clicked = true;
      var gatewaysUsingGoldCoins = ['gc'];

      if(form.$valid && $scope.buyInfo.packs > 0) {

        if($scope.paymode.name === 'gc' &&  $scope.goldCoinsDetails.error){
            $scope.waitMessage = 'We are unable to get your gold coins from clickintensity.';
            return false;
        }

        if(gatewaysUsingGoldCoins.indexOf($scope.paymode.name) !== -1 && $scope.goldCoinsDetails && $scope.goldCoinsDetails.balance && !$scope.buyInfoGoldCoins.proceed){
          $scope.buyInfoGoldCoins = { coins : $scope.buyInfo.coins, amount : $scope.buyInfo.cost, gcused : 0, pendingAmount : $scope.buyInfo.cost, proceed : false };
          $scope.showGoldCoinForm = true;
        }
        else{
          $scope.waitMessage = ' Please wait, while we are processing your request...';
          var productInfo = {
            amount: $scope.packInformation.price,
            coins: $scope.packInformation.coins,
            gcUsed: ($scope.buyInfoGoldCoins.gcused > 0 ? $scope.buyInfoGoldCoins.gcused : 0),
            name: 'Adscash coins',
            id: 'adscash',
            quantity: $scope.buyInfo.packs,
            paidAmount: ($scope.buyInfoGoldCoins.pendingAmount ? $scope.buyInfoGoldCoins.pendingAmount : $scope.buyInfo.cost ) ,
            earnedCoins: $scope.buyInfo.coins,
            invoiceAmount: $scope.buyInfoGoldCoins.amount,
            type: $scope.paymode.name,
            paymode2 : $scope.paymode2.name,
            reqToken: $scope.paymentRequestToken
          };

          console.log(productInfo);
          //return false;
            Purchase.doPayment(productInfo, function(data) {
              $scope.waitMessage = '';
              if(data.error) {
                $scope.waitMessage = data.message;
              }
              else{
                if(productInfo.type === 'ic' || productInfo.paymode2 === 'ic'){
                  window.location.href = '/purchase-success/'+data.data.token;
                }else{
                  $scope.showPaymentQRCode = true;
                  $scope.showGoldCoinForm = false;
                  $scope.buyInfo.response = data.data;
                }
              }
            });

          }
      }
      else {
        $scope.clicked = false;
      }
    };

    // $scope.setProductInfo = function(key, qty, rate, amount) {
    //   var __product = $scope.products[key];
    //   __product.amount = rate;
    //   __product.coins  = rate
    //   __product.quantity = qty;
    //   $scope.products[key] = __product;
    // }

    $scope.showPayMethods = function(form) {
      $scope.prevForm = form;
      $scope.waitMessage = '';
      $scope.silverPackPurchaseErrorMessage = '';
      Purchase.getValidToken({reqType: 'payment'}, function(_token) {
        if(_token.error) {
          $scope.transferCoinSuccess = _token.message;
        }
        else {
          $scope.paymentRequestToken = _token.reqtoken;
        }

        if(form) {
          $uibModal.open({
            templateUrl: 'app/products/purchase/paymethodsall.html',
            size: 'md',
            scope: $scope,
            backdrop: 'static',
            keyboard: false,
            windowClass: 'zindex'
          });
        }
      });
    };

    getCIGoldCoins();
    getCurrentRate();

  })
  .controller('PurchaseHistoryCtrl', function($scope, $http, $window, Purchase, Auth, $location, Utilities, $uibModal){
    $scope.rows = [];
    $scope.currentPage = 1;
    $scope.totalPages = 0;
    $scope.username = Auth.getCurrentUser();

    //sorting
    $scope.sortType     = 'createdAt'; // set the default sort type
    $scope.sortReverse  = true;  // set the default sort order
    $scope.dateFilter = true;
    $scope.coinFilter = true;
    $scope.amountFilter = true;
    $scope.limits = '';
    $scope.error = '';

    $scope.loadingText = '';
    $scope.loadPage = function() {
      $scope.loadingText = 'Please wait while loading...';
      Purchase.get({page: $scope.currentPage},function(resp) {
        $scope.purchaseHistory = [];
        resp.data.forEach(function(x){
          var paymentStatus = x.status.match(/PENDING/g);
          if(paymentStatus){
            x.status = paymentStatus[0];
          }
          if(x.receiptPath){
            var receiptPath = x.receiptPath.split('ciassets-dev.s3.amazonaws.com/');
            if(receiptPath[0] === 'https://') {
              x.receiptPath = receiptPath[1];
            }else{
              x.receiptPath = receiptPath[0];
            }
          }
          $scope.purchaseHistory.push(x);
        });
        $scope.viewLimit = resp.limit;
        $scope.totalPages = resp.rows;
        $scope.loadingText = '';
        $scope.error = '';
        if( resp.rows > 10) {
          $scope.limits = Math.ceil(resp.rows / 10);
        }
      });
    };

    // Go to Specific Page
    $scope.updatePage = function() {
      if($scope.getPage) {
        if($scope.getPage > $scope.limits) {
          $scope.error = 'Page not found';
        }else {
          $scope.currentPage = $scope.getPage;
          $scope.loadPage();
        }
      }
    };

    //console.log(Purchase.query());
    $scope.renewpurchase = function(currentId){
      $location.url('/purchase/renew/'+currentId);
    };

    $scope.isActive = function(route) {
      return route === $location.path();
    };

    $scope.imageToDataUri = function (img) {
      // create an off-screen canvas
      var canvas = document.createElement('canvas'),
          ctx = canvas.getContext('2d');

      // set its dimension to target size
      canvas.width = img.width;
      canvas.height = img.height;

      // draw source image into the off-screen canvas:
      ctx.drawImage(img, 0, 0, img.width, img.height);

      // encode image to data-uri with base64 version of compressed image
      return canvas.toDataURL();
    };

    $scope.updateKey = 0;

    $scope.imageFileInfo = function(flowFile, event, flow, key, paymode) {
      $scope.updateKey = key;
      $scope.purchaseHistory[$scope.updateKey].uploadLoad=true;
      $scope.loadingMessage = true;
      $scope.purchaseMsg1 = false;
      $scope.filePath = '';

      var fileReader = new FileReader();
      if(['image/jpeg','image/jpg', 'image/png'].indexOf(flowFile.file.type) >= 0){
          fileReader.readAsDataURL(flowFile.file);
          fileReader.onload = function (event) {
            var img = new Image;
            img.onload = $scope.resizeImage;
            img.paymode = paymode;
            img.src = event.target.result;
          };
        }else{
          $scope.loadingMessage = false;
          $scope.purchaseHistory[$scope.updateKey].uploadLoad=false;
          $scope.purchaseHistory[$scope.updateKey].purchaseReceipt = false;
          $scope.purchaseHistory[$scope.updateKey].purchaseMsg1 = true;
        }
      //return !!{png:1,gif:1,jpg:1,jpeg:1}[flowFile.getExtension()]
    };

    $scope.resizeImage = function() {
      $scope.purchaseReceipt = false;
      var image = $scope.imageToDataUri(this);
      var paymode = this.paymode;
      Utilities.saveFile({imageData: image, utype: 'upd', access: 'private'}, function(response) {
        if(!response.error) {

          Purchase.updateReceiptPath({
            id: $scope.purchaseHistory[$scope.updateKey]._id,
            receiptpath: response.imagePath,
            type : paymode
          }, function() {
            $scope.loadingMessage = false;
            $scope.purchaseHistory[$scope.updateKey].uploadLoad=false;
            $scope.purchaseHistory[$scope.updateKey].purchaseReceipt = true;
            $scope.purchaseHistory[$scope.updateKey].purchaseMsg1 = false;
            $scope.purchaseHistory[$scope.updateKey].filePath = response.imagePath;
          });
        }
      });
    };

    $scope.showfile = function(file){
      // $scope.loadingMessage = true;
      $http.post('/api/utilities/url', { file: file }).then(function(res){
        $window.open( res.data.url );
      });
    };

    $scope.cancelInvoice = function(key, paymode) {
      Purchase.cancelTransaction({id: $scope.purchaseHistory[key]._id, type : paymode }, function() {
        $scope.purchaseHistory[key].status = 'CANCELLED';
      });
    };

    $scope.viewTransactionDetails = function(key) {
      Purchase.viewTransaction({txnid: $scope.purchaseHistory[key]._id}, function(info) {
        $scope.transactionInfo = info.data;
        if($scope.transactionInfo.gatewaydata) {
          $uibModal.open({
            templateUrl: 'app/products/purchase/transactionDetail.html',
            controller: 'PurchaseHistoryCtrl',
            size: 'md',
            scope: $scope,
            keyboard: false,
            windowClass: 'zindex'
          });
        }
      });
    };

    $scope.verifyPayment = function(token){
           Purchase.verifyPayment({ token : token }, {}, function(resp){
             if(resp.error){
               alert(resp.message);
             }
             else if(!resp.error && !resp.istemp){
               window.location.href = '/purchase-success/'+resp.token;
             }
             else if (!resp.error && resp.istemp == 1) {
               alert(resp.message);
               setTimeout(function(){
                 window.location.href = '/purchase-success/'+resp.token;
               }, 500);
             }
             else{
               alert(resp.message);
             }
           },function(err){
             console.log('Payment verification error:'+err);
             alert('Unable to verify payment.');
           });
       };

    $scope.loadPage();
  })
  .controller('PurchaseSuccessCtrl', function($scope, $stateParams, Purchase, Auth, $window, $location) {
    /* $scope.soloaddObj = {
      title: '',
      linkurl: '',
      purchaseid: '',
      clicks: 0
    }; */

    $scope.soloaddObj = {};
    $scope.editable = false;
    $scope.showInvoiceButton = false;
    $scope.invoicekey = $stateParams.token;

    $scope.username = Auth.getCurrentUser();
    Purchase.showByToken({
      id: $stateParams.token
    }, function(data) {
      $scope.purchaseinfo = data;
      // $scope.soloaddObj.purchaseid = data._id;
      // $scope.soloaddObj.clicks = data.quantity;
      // $scope.showInvoiceButton = (data.paymode === 'bankwire' || data.paymode === 'paypalOffline');
      $scope.paymentMode = data.paymode;
    });

    $scope.isActive = function(route) {
      return route === $location.path();
    };

  //  $scope.campaignCreateSuccess = '';

    // $scope.createSoloAdd = function(form) {
    //
    //   PurachaseSoloAdds.createSoloAds($scope.soloaddObj, form, function(data) {
    //     $scope.campaignCreateSuccess = PurachaseSoloAdds.soloAdsCreateCallBack(data);
    //   });
    // }

    // $scope.getLandingPages = function() {
    //
    //   PurachaseSoloAdds.getLeadPages(function(_data) {
    //     var leadData = PurachaseSoloAdds.getFormattedLeadPages(_data);
    //     $scope.leadPages = leadData.leadPages;
    //     $scope.soloaddObj.linkurl = leadData.defaultPage;
    //   });
    // }
    //
    // $scope.getLandingPages();
    // $scope.notEdit = function() {
    //   $scope.editable = false;
    // }
    // $scope.doEdit = function() {
    //   $scope.editable = true;
    // }
    // $scope.updateOtherInfo = function() {
    //   var _leadLen = $scope.leadPages.length;
    //   $scope.leadPages[(_leadLen-1)].path = $scope.soloaddObj.linkurl;
    // }

    // $scope.closeAllDialogs = function() {
    //   $uibModalStack.dismissAll();
    // }
    //
    // $scope.soloemail = {
    //   purchaseid: '',
    //   replyto: '',
    //   subject: '',
    //   content: '',
    //   comment: ''
    // };
    // $scope.addSoloEmailContent = function() {
    //
    //   SoloEmails.getSoloEmailInfo({pid: $scope.purchaseinfo._id+''}, function(response) {
    //     if(!response.error) {
    //       $scope.soloemail = response;
    //       $scope.allowEdit = (response.subject == 'Provide a 'cAtChY' subject line to attract eyeballs' && (!response.replyto || response.replyto == 'People interested in your offer will contact on this email ID') && response.content == 'Please provide content for the Email body. Include your contact details and website / link of your offer');
    //
    //       $uibModal.open({
    //         templateUrl: 'app/products/purchase/soloemail-content.html',
    //         size: 'lg',
    //         scope: $scope,
    //         backdrop: 'static',
    //         keyboard: false
    //       });
    //     }
    //     else {
    //       alert(respone.messsage);
    //     }
    //   });
    // }

    // $scope.updateSoloEmailContent = function() {
    //   $scope.errorMessage = '';
    //
    //   SoloEmails.updateSoloEmail($scope.soloemail, function(response) {
    //
    //     if(!response.error && response._id+'' == $scope.soloemail._id+'') {
    //       $scope.closeAllDialogs();
    //     }
    //     else {
    //       $scope.errorMessage = response.message;
    //     }
    //   })
    // }
    //
    // $scope.addDailyLoginAdsContent = function() {
    //   $scope.dailyAdPurchase = $scope.purchaseinfo;
    //   DailyAdsContent.addDailyLoginAdsContent($scope, false);
    // }
    //
    // $scope.updateDailyAdContent = function() {
    //   DailyAdsContent.updateDailyAdContent($scope);
    // }
  })
  .controller('PurchaseFailureCtrl', function($scope, $stateParams, Purchase, Auth, $location) {
    $scope.username = Auth.getCurrentUser();
    Purchase.showByToken({
      id: $stateParams.token
    }, function(data) {
      $scope.purchaseinfo = data;
    });

    $scope.isActive = function(route) {
      return route === $location.path();
    };

  })
  .controller('OrderHistoryCtrl', function($scope, $stateParams, $window, Purchase, Products, SoloAdds, PurachaseSoloAdds, $uibModal, $uibModalStack, $sce, SoloEmails, DailyAdsContent) {
    $scope.orders = [];
    $scope.showCreateCampaignButton = false;
    $scope.campaignCreateSuccess = '';
    /* $scope.soloaddObj = {
      title: '',
      linkurl: '',
      purchaseid: '',
      clicks: 0
    }; */
    $scope.soloaddObj = {};
    $scope.editable = false;

    Purchase.getOrderHistory(function(resp) {
      $scope.orders = resp.data;
    });

    $scope.closeModel = function(_location) {
      if(_location) {
        setTimeout(function() {
          $window.location.href = _location;
        }, 100);
      }
      else {
        setTimeout(function() {
          angular.element('#campaign-model').modal('show');
        }, 200);
      }

      angular.element('#trackinfo .close').trigger('click');
    };

    $scope.trackOrder = function(key) {

      $scope.showCreateCampaignButton = false;
      SoloAdds.query({purchaseid: $scope.orders[key]._id}, function(d) {
        $scope.tarckInfo = d[0];

        if(d[0] === -1) {

          $scope.soloaddObj.purchaseid = $scope.orders[key]._id;
          $scope.soloaddObj.clicks = $scope.orders[key].quantity;

          $scope.showCreateCampaignButton = true;
        }
      });
    };

    $scope.closeAllDialogs = function() {
      $uibModalStack.dismissAll();
    };

    $scope.soloemail = {
      purchaseid: '',
      replyto: '',
      subject: '',
      content: '',
      comment: ''
    };
    $scope.addSoloEmailContent = function(key) {
      var order = $scope.orders[key];

      SoloEmails.getSoloEmailInfo({pid: order._id+''}, function(response) {
        if(!response.error) {
          $scope.soloemail = response;
          $scope.allowEdit = (response.subject === 'Provide a "cAtChY" subject line to attract eyeballs' && (!response.replyto || response.replyto === 'People interested in your offer will contact on this email ID') && response.content === 'Please provide content for the Email body. Include your contact details and website / link of your offer');

          $scope.getTrustedHtml = $sce.getTrustedHtml;

          $uibModal.open({
            templateUrl: 'app/products/purchase/soloemail-content.html',
            size: 'lg',
            scope: $scope,
            backdrop: 'static',
            keyboard: false,
            windowClass: 'zindex'
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

        if(!response.error && response._id+'' === $scope.soloemail._id+'') {
          $scope.closeAllDialogs();
        }
        else {
          $scope.errorMessage = response.message;
        }
      });
    };

    $scope.addDailyLoginAdsContent = function(key) {
      $scope.dailyAdPurchase = $scope.orders[key];
      DailyAdsContent.addDailyLoginAdsContent($scope, false);
    };

    $scope.updateDailyAdContent = function() {
      DailyAdsContent.updateDailyAdContent($scope);
    };

    $scope.campaignCreateSuccess = '';

    $scope.createSoloAdd = function(form) {

      PurachaseSoloAdds.createSoloAds($scope.soloaddObj, form, function(data) {
        $scope.campaignCreateSuccess = PurachaseSoloAdds.soloAdsCreateCallBack(data);
      });
    };

    $scope.getLandingPages = function() {

      PurachaseSoloAdds.getLeadPages(function(_data) {
        var leadData = PurachaseSoloAdds.getFormattedLeadPages(_data);
        $scope.leadPages = leadData.leadPages;
        $scope.soloaddObj.linkurl = leadData.defaultPage;
      });
    };

    $scope.getLandingPages();

    $scope.notEdit = function() {
      $scope.editable = false;
    };
    $scope.doEdit = function() {
      $scope.editable = true;
    };
    $scope.updateOtherInfo = function() {
      var _leadLen = $scope.leadPages.length;
      $scope.leadPages[(_leadLen-1)].path = $scope.soloaddObj.linkurl;
    };
  })
  .controller('PurchaseInfoCtrl', function($scope, $stateParams, Purchase, Auth) {
    $scope.purchaseinfo = {};
    $scope.bankwireinfo = {};
    $scope.paypalInfo = {};
    $scope.user = Auth.getCurrentUser();
    Purchase.showByToken({
      id: $stateParams.token
    }, function(data) {
      $scope.purchaseinfo = data;
      $scope.purchaseinfo.purchaseid = data._id;
      $scope.purchaseinfo.clicks = data.quantity;
      // if(data.paymode === 'bankwire'){
      //   Purchase.getBankWireInfo({
      //     token: $stateParams.token,
      //     paymentid: data._id
      //   }, function(info) {
      //     // $scope.bankwireinfo = info.data;
      //     $scope.invoiceInfo = info.data;
      //     console.log($scope.invoiceInfo);
      //   });
      // } else if(data.paymode === 'paypalOffline'){
      //         Purchase.getPayPalInfo({
      //           token : $stateParams.token,
      //           paymentid : data._id
      //         }, function(info) {
      //           $scope.invoiceInfo = info.data;
      //         })
      //       }

    });
  })
  .controller('UploadImageCtrl',function($scope, $stateParams, Purchase, Auth, $window, $location, SoloAdds, Affiliates, Utilities) {

    Purchase.showByToken({
      id: $stateParams.token
    }, function(data) {
      Purchase.getBankWireInfo({
        token: $stateParams.token,
        paymentid: data._id
      }, function(info) {
        if (info.data.receiptpath !== 'undefined') {
          var _path = info.data.receiptpath.split('.com/');

          Utilities.getSignedUrl({file: _path[1]}, function(resp) {
            if(!resp.err && resp.url) {
              $window.location.href = resp.url;
            }
            else {
              $window.location.href = 'ooops/';
            }
          });
        } else {
          $window.location.href = 'ooops/';
        }
      });
    });

  })
  .controller('SoloEmailProduct', function($scope, $stateParams, Purchase, Products, Auth, Utilities, $location, $cookies, $timeout, $uibModal, $uibModalStack, SoloEmails) {

    $scope.blockedDates = function(cdate) {
      return ( cdate.mode === 'day' && $scope.bookedDates.indexOf(moment(cdate.date).format('YYYY-MM-DD')) >= 0 );
    };

    $scope.customColor = function(cdate) {
      return ($scope.blockedDates(cdate) ? 'blocked-date' : '');
    };

    SoloEmails.getBlockedDates(function(response) {
      $scope.bookedDates = response.dates;
      $scope.datepickerOptions = {
        minDate: new Date(),
        showWeeks: true,
        opened: false,
        customClass: $scope.customColor,
        dateDisabled: $scope.blockedDates
      };
    });

    $scope.openDatePopup = function() {
      $scope.datepickerOptions.opened = true;
    };

    $scope.purchasePacks = function(form) {
      form = (form ? form : $scope.prevForm);

      $scope.clicked = true;
      if(form.$valid && $scope.buyInfo.packs > 0) {
        $scope.waitMessage = ' Please wait, while we are redirecting you...';

        var productInfo = {
          amount: $scope.soloemailProduct.amount,
          coins: $scope.soloemailProduct.coins,
          name: $scope.soloemailProduct.name,
          id: $scope.soloemailProduct._id,
          quantity: 1,
          paidAmount: $scope.soloemailProduct.amount,
          earnedCoins: 0,
          purchaseBy: (($scope.paymode.name === 'ic' && $scope.pType === 'silver') ? 'gold' : $scope.pType),
          reqToken: $scope.paymentRequestToken,
          broadcastat: $scope.broadcastat
        };
        var payBy   = $scope.paymode.name.split('-');
        var payInfo = angular.extend({type: payBy[0], '_token': $cookies.get('token') }, productInfo);

        Purchase.doProductPayment(payInfo, function(data) {
          $scope.waitMessage = '';
          if(data.error) {
            $scope.waitMessage = (data.message ? data.message : data.error);
          }

          if(data.PAYMENTURL) {
            window.location.href = data.PAYMENTURL;
          }
          if(data.id && data.token && data.ack && data.ack === 'success' && data.mi == false) {
            window.location.href = '/purchase-success/'+data.token;
          }
          if(data.id && data.token && data.ack && data.ack === 'success' && data.mi == true) {
            $scope.buyInfo.cost = $scope.soloemailProduct.amount;
            // Show Bank Wire Form
            if (payBy[0] === 'bankwire') {
              $scope.showBankWireForm = true;
              $scope.bankwireInfo.cost = $scope.soloemailProduct.amount;
              $scope.bankwireInfo.utid = data.token;
            }
            else if(payBy[0] === 'paypalOffline')
            {
              $scope.showPaypalOfflineForm  = true;
              $scope.paypalOfflineInfo.cost = $scope.soloemailProduct.amount;
              $scope.paypalOfflineInfo.utid = data.token;
              $scope.getPaypalAccount();
            }
          }
          if(data.token && data.info) {
            var postInfo = angular.fromJson(atob(data.info));
            setTimeout(function() {

              if(payBy[0] === 'stp') {
                var payAmount = $scope.soloemailProduct.amount;
                var _form = angular.element('#stppay').get(0);
                _form.action = postInfo.postURL;
                _form.merchantAccount.value = postInfo.merchantAccount;
                _form.amount.value = (payAmount + (((payAmount * postInfo.processingFee) / 100) + postInfo.addOnProcessingFee) / postInfo.processingFeeDivision).toFixed(2);
                _form.currency.value = postInfo.currency;
                _form.sci_name.value = postInfo.buttonName;
                _form.item_id.value = postInfo.itemName;
                _form.user1.value = data.token;
                _form.user2.value = data.orderId;
                _form.testmode.value = postInfo.testMode;
                _form.confirm_url.value = postInfo.confirmURL+'/'+data.token+'/'+$scope.paymode.name;
                _form.notify_url.value  = postInfo.notifyURL+'/'+data.token+'/'+$scope.paymode.name; postInfo.returnURL+'/'+$scope.paymode.name+'?token='+data.token+'&__uuid='+data.uuid+'&PayerID=';
                _form.cancel_url.value = postInfo.cancelURL+'/'+$scope.paymode.name+'?token='+data.token+'&__uuid='+data.uuid+'&PayerID=';
                _form.submit();
              }

              if(payBy[0] === 'advcash') {
                var payAmount = $scope.soloemailProduct.amount;
                var _form = angular.element('#advcashpay').get(0);
                _form.action = postInfo.postURL;
                _form.ac_account_email.value = postInfo.accountEmail;
                _form.ac_sci_name.value = postInfo.sciName;
                _form.ac_currency.value = postInfo.currency;
                _form.ac_amount.value = payAmount;
                _form.ac_success_url.value = postInfo.returnURL + '/' + payBy[0] + '?token=' + data.token + '&__uuid=' + data.uuid + '&PayerID=';
                _form.ac_fail_url.value = postInfo.cancelURL + '/' + payBy[0] + '?token=' + data.token + '&__uuid=' + data.uuid + '&PayerID=';
                _form.ac_status_url.value = postInfo.notifyURL + '/' + data.token + '/' + payBy[0];
                _form.ac_sign.value = postInfo.sign;
                _form.ac_order_id.value = data.orderId;
                _form.ac_ps.value = ((payBy.length > 1) ? payBy[1] : '');
                _form.submit();
              }
            }, 500);
            $scope.clicked = false;
          }
          if(data.error) {
            $scope.silverPackPurchaseErrorMessage = data.error;
            $scope.clicked = false;
          }
        });
      }
      else {
        $scope.clicked = false;
      }
    };

    $scope.isInprogress = false;
    $scope.purchaseProduct = function(obj, key) {
      if($scope.isInprogress) { return false; }
      $scope.isInprogress = true;
      $scope.transferCoinSuccess = '';
      $scope.soloemailProduct = $scope.products[key];
      $scope.prevForm = obj.buyprodct;
      $scope.waitMessage = '';
      $scope.silverPackPurchaseErrorMessage = '';

      SoloEmails.isDateAvailable({dt: $scope.broadcastat}, function(response) {
        if(response.valid === true) {
          Purchase.getValidToken({reqType: 'payment'}, function(_token) {
            if(_token.error) {
              $scope.transferCoinSuccess = _token.message;
            }
            else {
              $scope.paymentRequestToken = _token.reqtoken;
            }
            /* amount to validate transfer limit*/
            $scope.buyInfoProduct.cost = $scope.soloemailProduct.amount;
            if(obj) {
              $uibModal.open({
                templateUrl: 'app/products/purchase/paymethodsall.html',
                controller: 'SoloEmailProduct',
                size: 'md',
                scope: $scope,
                backdrop: 'static',
                keyboard: false,
                windowClass: 'zindex'
              });
            }

            $scope.isInprogress = false;
          });
        }
        else {
          $scope.transferCoinSuccess = 'Ooops!!! Email Broadcast for this date is already booked. Please choose another slot.';
          $scope.isInprogress = false;
        }
      });
    };
  })
  .controller('DailyLoginProduct', function($scope, $stateParams, Purchase, Products, Auth, Utilities, $location, $cookies, $timeout, $uibModal, $uibModalStack, DailyAds, moment, ProductDateFormat) {

    $scope.blockedDates = function(cdate) {
      return ( cdate.mode === 'day' && $scope.bookedDates.indexOf(moment(cdate.date).format('YYYY-MM-DD')) >= 0 );
    };

    $scope.customColor = function(cdate) {
      return ($scope.blockedDates(cdate) ? 'blocked-date' : '');
    };

    DailyAds.getBookedDates(function(response) {
      $scope.bookedDates = response.dates;
      $scope.datepickerOptions = {
        'startDate': {
          minDate: moment().add(1, 'day'),
          showWeeks: true,
          opened: false,
          customClass: $scope.customColor,
          dateDisabled: $scope.blockedDates
        },
        'endDate': {
          minDate: moment().add(1, 'day'),
          showWeeks: true,
          opened: false,
          customClass: $scope.customColor,
          dateDisabled: $scope.blockedDates
        }
      };
    });

    $scope.calculateQuantity = function() {
      var dateDiff = moment($scope.broadcastend).diff(moment($scope.broadcaststart), 'days') + 1;
      $scope.product.quantity = 0;
      if(dateDiff > 0) {
        $scope.product.quantity = dateDiff;
      }
    };

    $scope.openStartDatePopup = function() {
      $scope.datepickerOptions.startDate.opened = true;
    };
    $scope.openEndDatePopup = function() {
      $scope.datepickerOptions.endDate.minDate = $scope.broadcaststart;
      $scope.datepickerOptions.endDate.opened = true;
    };

    $scope.purchasePacks = function(form) {
      form = (form ? form : $scope.prevForm);

      $scope.clicked = true;
      if(form.$valid && $scope.buyInfo.packs > 0) {
        $scope.waitMessage = ' Please wait, while we are redirecting you...';

        var productInfo = {
          amount: $scope.soloemailProduct.amount,
          coins: $scope.soloemailProduct.coins,
          name: $scope.soloemailProduct.name,
          id: $scope.soloemailProduct._id,
          quantity: $scope.product.quantity,
          paidAmount: ($scope.soloemailProduct.amount * $scope.product.quantity),
          earnedCoins: 0,
          purchaseBy: (($scope.paymode.name === 'ic' && $scope.pType === 'silver') ? 'gold' : $scope.pType),
          reqToken: $scope.paymentRequestToken,
          broadcaststart: ProductDateFormat.formatDate($scope.broadcaststart),
          broadcastend: ProductDateFormat.formatDate($scope.broadcastend)
        };
        var payBy   = $scope.paymode.name.split('-');
        var payInfo = angular.extend({type: payBy[0], '_token': $cookies.get('token') }, productInfo);

        Purchase.doProductPayment(payInfo, function(data) {
          $scope.waitMessage = '';
          if(data.error) {
            $scope.waitMessage = (data.message ? data.message : data.error);
          }

          if(data.PAYMENTURL) {
            window.location.href = data.PAYMENTURL;
          }
          if(data.id && data.token && data.ack && data.ack === 'success' && data.mi == false) {
            window.location.href = '/purchase-success/'+data.token;
          }
          if(data.id && data.token && data.ack && data.ack === 'success' && data.mi == true) {
            // Show Bank Wire Form
            if (payBy[0] === 'bankwire') {
              $scope.showBankWireForm = true;
              $scope.bankwireInfo.cost = ($scope.soloemailProduct.amount * $scope.product.quantity);
              $scope.bankwireInfo.utid = data.token;
            }
            else if(payBy[0] === 'paypalOffline')
            {
              $scope.showPaypalOfflineForm  = true;
              $scope.paypalOfflineInfo.cost = ($scope.soloemailProduct.amount * $scope.product.quantity);
              $scope.paypalOfflineInfo.utid = data.token;
              $scope.getPaypalAccount();
            }
          }
          if(data.token && data.info) {
            var postInfo = angular.fromJson(atob(data.info));
            setTimeout(function() {

              if(payBy[0] === 'stp') {
                var payAmount = ($scope.soloemailProduct.amount * $scope.product.quantity);
                var _form = angular.element('#stppay').get(0);
                _form.action = postInfo.postURL;
                _form.merchantAccount.value = postInfo.merchantAccount;
                _form.amount.value = (payAmount + (((payAmount * postInfo.processingFee) / 100) + postInfo.addOnProcessingFee) / postInfo.processingFeeDivision).toFixed(2);
                _form.currency.value = postInfo.currency;
                _form.sci_name.value = postInfo.buttonName;
                _form.item_id.value = postInfo.itemName;
                _form.user1.value = data.token;
                _form.user2.value = data.orderId;
                _form.testmode.value = postInfo.testMode;
                _form.confirm_url.value = postInfo.confirmURL+'/'+data.token+'/'+$scope.paymode.name;
                _form.notify_url.value  = postInfo.notifyURL+'/'+data.token+'/'+$scope.paymode.name; postInfo.returnURL+'/'+$scope.paymode.name+'?token='+data.token+'&__uuid='+data.uuid+'&PayerID=';
                _form.cancel_url.value = postInfo.cancelURL+'/'+$scope.paymode.name+'?token='+data.token+'&__uuid='+data.uuid+'&PayerID=';
                _form.submit();
              }

              if(payBy[0] === 'advcash') {
                var payAmount = ($scope.soloemailProduct.amount * $scope.product.quantity);
                var _form = angular.element('#advcashpay').get(0);
                _form.action = postInfo.postURL;
                _form.ac_account_email.value = postInfo.accountEmail;
                _form.ac_sci_name.value = postInfo.sciName;
                _form.ac_currency.value = postInfo.currency;
                _form.ac_amount.value = payAmount;
                _form.ac_success_url.value = postInfo.returnURL + '/' + payBy[0] + '?token=' + data.token + '&__uuid=' + data.uuid + '&PayerID=';
                _form.ac_fail_url.value = postInfo.cancelURL + '/' + payBy[0] + '?token=' + data.token + '&__uuid=' + data.uuid + '&PayerID=';
                _form.ac_status_url.value = postInfo.notifyURL + '/' + data.token + '/' + payBy[0];
                _form.ac_sign.value = postInfo.sign;
                _form.ac_order_id.value = data.orderId;
                _form.ac_ps.value = ((payBy.length > 1) ? payBy[1] : '');
                _form.submit();
              }
            }, 500);
            $scope.clicked = false;
          }
          if(data.error) {
            $scope.silverPackPurchaseErrorMessage = data.error;
            $scope.clicked = false;
          }
        });
      }
      else {
        $scope.clicked = false;
      }
    };

    $scope.isInprogress = false;
    $scope.purchaseProduct = function(obj, key) {
      if($scope.isInprogress) { return false; }
      if($scope.product.quantity <= 0) { $scope.transferCoinSuccess = 'Please select valid date range.'; return false; }
      $scope.isInprogress = true;
      $scope.transferCoinSuccess = '';
      $scope.soloemailProduct = $scope.products[key];
      $scope.prevForm = obj.buyprodct;
      $scope.waitMessage = '';
      $scope.silverPackPurchaseErrorMessage = '';

      DailyAds.isDateAvailable({
        sdt: ProductDateFormat.formatDate($scope.broadcaststart),
        edt: ProductDateFormat.formatDate($scope.broadcastend)
      }, function(response) {
        if(response.valid === true) {
          Purchase.getValidToken({reqType: 'payment'}, function(_token) {
            if(_token.error) {
              $scope.transferCoinSuccess = _token.message;
            }
            else {
              $scope.paymentRequestToken = _token.reqtoken;
            }

            /* amount to validate transfer limit*/
            $scope.buyInfoProduct.cost = ($scope.soloemailProduct.amount * $scope.product.quantity);
            if(obj) {
              $uibModal.open({
                templateUrl: 'app/products/purchase/paymethodsall.html',
                controller: 'DailyLoginProduct',
                size: 'md',
                scope: $scope,
                backdrop: 'static',
                keyboard: false,
                windowClass: 'zindex'
              });
            }

            $scope.isInprogress = false;
          });
        }
        else {
          $scope.transferCoinSuccess = 'Ooops!!! Selected date range is not available. Please choose different date range.';
          $scope.isInprogress = false;
        }
      });
    };
  });