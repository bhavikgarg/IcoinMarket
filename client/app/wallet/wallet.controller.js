'use strict';

angular.module('iCoinApp')
  .controller('WalletCtrl', function ($scope, $rootScope, $window, Cache, $uibModal, $uibModalStack, Campaign, Purchase, User, Auth, Withdrawal, Utilities, $filter, $state, $timeout, growl, MIN_WITHDRAWAL_LIMIT, NO_LIMIT_FUND_TRANSFER_USERS, API_CONSTANTS) {
    $window.scrollTo(0, 0);
    $scope.rows = [];
    // $scope.totalPurchase = 0;
    // $scope.totalSpent    = 0;
    // $scope.totalEarned   = 0;
    // $scope.balanceCoins  = 0;
    $scope.datatest = {
        message : 'my message'
    }
    $scope.sortType     = 'createdAt'; // set the default sort type
    $scope.withdrawalSortType     = 'createdAt';
    $scope.commissionSortType     = 'createdAt';
    $scope.earnedSortType     = 'createdAt';
    $scope.revenueSortType     = 'createdAt';
    $scope.revenueSortType     = 'createdAt';
    $scope.usdTransactionsSortType     = 'createdAt';
    $scope.sortReverse  = true;  // set the default sort order
    $scope.earnedSortReverse = true;
    $scope.withdrawalSortReverse  = true;  // set the default sort order
    $scope.commissionSortReverse  = true;  // set the default sort order
    $scope.revenueSortReverse  = true;  // set the default sort order
    $scope.usdTransactionsSortReverse  = true;  // set the default sort order
    $scope.dateFilter = true;
    $scope.coinFilter = true;
    $scope.withdrawalDateFilter = true;
    $scope.withdrawalCoinFilter = true;
    $scope.commissionDateFilter = true;
    $scope.usdTransactionsDateFilter = true;
    $scope.commissionCoinFilter = true;
    $scope.earnedCoinDateFilter = true;
    $scope.cearnedCoinFilter = true;
    $scope.revenueDateFilter = true;
    $scope.revenueCoinFilter = true;
    $scope.usdTransactionsCoinFilter = true;
    $scope.withdrawalLimits = 1;
    $scope.revenueLimits = 1;
    $scope.walletLimits = 1;
    $scope.commissionLimits = 1;
    $scope.usdWalletLimits = 1;
    $scope.usdWallet = {};
    $scope.adsCashWallet = {};
    $scope.isLoggedIn = Auth.isLoggedIn;

    $scope.gateways = [{
        key: 'bitcoinBlockIO',
        image: 'bitcoin.png'
    }, {
        key: 'litecoinBlockIO',
        image: 'litecoin.png'
    }];

    $scope.withdraw = {
      amount : MIN_WITHDRAWAL_LIMIT,
      btc : 0,
      address : '',
      reqToken : '',
      // adscash : 0,
      withdrawamount : 0,
      // repurchase : 0,
      otp: ''
    };
    $scope.NO_LIMIT_FUND_TRANSFER_USERS = NO_LIMIT_FUND_TRANSFER_USERS;
    $scope.min_add_fund = 100;
    $scope.disableWithdrawal = false;
    $scope.withdrawalError = '';
    $scope.WithdrawalSuccess = '';
    $scope.withdrawalReqError = '';
    $scope.disableProcessWithdraw = false;

    $scope.adminFee   = 0;
    $scope.wdeditinfo = {
      amount: '',
      method: ''
    };

    $scope.currentPage = 1;
    $scope.currentWithdrawalPage = 1;
    $scope.currentCommissionPage = 1;
    $scope.currentRevenuePage = 1;
    $scope.currentUsdWalletPage = 1;
    $scope.totalPages = 0;
    $scope.totalWithdrawalPages = 0;
    $scope.totalCommissionPages = 0;
    $scope.totalRevenuePages = 0;
    $scope.totalUsdWalletPages = 0;
    $scope.errorWallet = '';
    $scope.errorWithdrawal = '';
    $scope.errorRevenue = '';
    $scope.errorCommission = '';
    $scope.errorUsdWallet = '';

    $scope.enterWdOtp = false;
    $scope.enterOtp = false;
    $scope.otpSentSuccess = '';
    $scope.otpSentError = '';
    $scope.otpWdSentSuccess = '';
    $scope.otpWdSentError = '';

    $scope.transferCoins = {
      email: '',
      coins: 10,
      reqToken: '',
      otp: ''
    };
    $scope.transferCoinError   = '';
    $scope.transferCoinSuccess = '';
    $scope.transferCoinLock    = false;
    $scope.fileUploading = false;
    $scope.buyInfoGoldCoins = { proceed : false };
    $scope.paymentError = '';
    $scope.subtype = 'P';
  //  $scope.message = '';
    $scope.withdrawadc = {
      amount : 100,
      address : '',
      reqToken : '',
      balance : 0,
      withdrawamount : 0,
      otp: '',
      limits : {
        min : API_CONSTANTS.MIN_ADC_WITHDRAWAL_LIMIT,
        max : API_CONSTANTS.MAX_ADC_WITHDRAWAL_LIMIT
      }
    };

  Auth.getCurrentUser().$promise.then(function(user) {
    $scope.userRole = user.role;
  });

    $scope.showTransferPopup = function() {
      // data-toggle="modal" data-target="#cointransfer"
      $scope.enterOtp = false;
      Purchase.getValidToken({reqType: 'transfer'}, function(_token) {
        if(_token.error) {
          $scope.transferCoinError = _token.message;
        }
        else {
          $scope.transferCoins.reqToken = _token.reqtoken;
        }

        $uibModal.open({
          templateUrl: 'app/products/purchase/coin-transfer.html',
          size: 'md',
          scope: $scope,
          backdrop: 'static',
          keyboard: false,
          windowClass: 'zindex'
        });
      });
    };

    $scope.showADCWithdrawalPopup = function() {
      $scope.disableAdcWithdrawal = true;
      $scope.enterWdOtp = false;
      $scope.withdrawalAdcError = '';
      //$scope.withdrawadc.amount = API_CONSTANTS.MIN_ADC_WITHDRAWAL_LIMIT;
      $scope.withdrawalAdcReqError = 'Please wait..';
      Purchase.getValidToken({reqType : 'withdrawal'}, function(data) {
        if(data.error) {
          $scope.withdrawalAdcReqError = data.message + '. Refresh and try again..';
        } else {
          $scope.withdrawadc.reqToken = data.reqtoken;
          Purchase.getPurchasedPacksInfo({type: 'adscash'}, function(data) {
            if(!data.error && data.acoins > 0){
              $scope.adcBalance = data.acoins;
              if($scope.withdrawadc.amount > data.acoins) {
                $scope.withdrawalAdcError = 'You do not have enough Adscash balance to withdraw '+$scope.withdrawadc.amount+' ADS';
                $scope.disableProcessWithdraw = false;
                $scope.withdrawalAdcReqError = 'You do not have enough Adscash balance to withdraw '+$scope.withdrawadc.amount+' ADS';
                $scope.disableAdcWithdrawal = false;
              } else {
                $scope.withdrawadc.withdrawaltype = 'adscash';
                Purchase.initializeWithdrawal($scope.withdrawadc, function(response) {
                  if(response.error) {
                    $scope.withdrawalAdcReqError = response.message;
                   /* $timeout(function() {
                      $window.location.reload();
                    }, 2000);*/
                  } else {
                      $scope.withdrawadc.amount = response.amount;
                      //$scope.withdrawadc.withdrawamount = response.withdrawamount;
                      $scope.withdrawadc.reqToken = response.token;
                      $scope.withdrawadc.withdrawalid = response.id;
                     $scope.withdrawalAdcReqError = '';
                      var modalInstance = $uibModal.open({
                        templateUrl: 'app/products/purchase/adscash-withdrawal.html',
                        size: 'md',
                        scope: $scope,
                        backdrop: 'static',
                        keyboard: false,
                        windowClass: 'zindex'
                      });
                  }
                });
              }
            }
            else{
              $scope.withdrawalAdcReqError = 'Unable to get current adscash balance.';
            }
          });
        }
      })
    }

    $scope.generateAndSendOtp = function(type, wtype) {
      $scope.transferCoinError = '';
      $scope.transferCoinSuccess = '';
      $scope.enterOtp = false;
      $scope.enterWdOtp = false;
      if(wtype == 'adscash' && !/^(0x)?[0-9a-f]{40}$/i.test($scope.withdrawadc.naddress) ){
        $scope.withdrawalAdcError = 'Invalid Ether address.';
         return false;
      }
      Purchase.generateAndSendOtp({type: type, withdrawaltype : wtype },function(info) {
        if(info.error) {
          if(type === 'transfer'){
            $scope.otpSentError = info.message;
          }
          else{
            $scope.otpWdSentError = info.message;
          }
          $scope.transferCoinError = info.message;
        } else {
          if(type === 'transfer'){
            $scope.otpSentSuccess = 'OTP has been sent to your registered email';
          }
          else{
            $scope.otpWdSentSuccess = 'OTP has been sent to your registered email';
          }
          $scope.enterOtp = true;
          $scope.enterWdOtp = true;
        }
      });
    };

    $scope.resendOtp = function(type) {
      Purchase.resendOtp({type: type}, function(response){
        if(!response.error) {
          $scope.transferCoinSuccess = 'OTP resent successfully';
          $scope.withdrawalSuccess = 'OTP resent successfully';
          $timeout(function () {
            $scope.transferCoinSuccess = '';
            $scope.withdrawalSuccess = '';
          }, 2000);
        }
      });
    };

    $scope.transferUSDCoins = function() {
      $scope.transferCoinError = '';
      $scope.transferCoinSuccess = '';
      $scope.transferCoinLock = true;
      // $scope.transferCoins['reqToken'] = $scope.transferToken;

      Purchase.transferUSDCoins($scope.transferCoins, function(info) {
        if(info.error && info.otpError) {
          $scope.transferCoinError = info.message;
          $scope.transferCoinLock = false;
          $scope.transferCoins.reqToken = info._t;
        }
        else if(info.error && !info.otpError){
          $scope.transferCoinError = info.message;
          $scope.transferCoinLock = false;
          $timeout(function() {
            $scope.transferCoins = {
              email: '',
              coins: 100,
              reqToken: ''
            };
            $scope.transferCoinLock = false;
            $scope.transferCoinSuccess = '';
            $scope.closeModal();
          }, 2500);
        }
        else {
          $scope.usdWallet.balance = $scope.usdWallet.balance - $scope.transferCoins.coins;
          $scope.transferCoinSuccess = info.message;

          $timeout(function() {
            $scope.transferCoins = {
              email: '',
              coins:100,
              reqToken: ''
            };

            $scope.transferCoinLock = false;
            $scope.transferCoinSuccess = '';
            //angular.element('#cointransfer .close').trigger('click');
            $scope.closeModal();
          }, 1500);
        }
      });
    };

    $scope.showWithdrawalPopup = function() {
      $scope.disableWithdrawal = true;
      $scope.enterWdOtp = false;
      $scope.withdrawalReqError = 'Please wait..';
      Purchase.getValidToken({reqType : 'withdrawal'}, function(data) {
        if(data.error) {
          $scope.withdrawalReqError = data.message + '. Refresh and try again..';
        } else {
          $scope.withdraw.reqToken = data.reqtoken;
          Purchase.getPurchasedPacksInfo({type: 'usd'}, function(data) {
            $scope.usdBalance = data.balance;
            if($scope.withdraw.amount > $scope.usdBalance) {
              $scope.withdrawalError = 'You do not have enough USD balance to withdraw '+$scope.withdraw.amount+' USD';
              $scope.disableProcessWithdraw = false;
              $scope.withdrawalReqError = 'You do not have enough USD balance to withdraw '+$scope.withdraw.amount+' USD';
              $scope.disableWithdrawal = false;
            } else {
                if ($scope.usdBalance - $scope.withdraw.amount < 10) {
                    $scope.withdrawalError = 'You cannot withdraw your Signup Bonus.';
                    $scope.disableProcessWithdraw = false;
                    $scope.withdrawalReqError = 'You cannot withdraw your Signup Bonus.';
                    $scope.disableWithdrawal = false;
                } else {
                  $scope.withdraw.withdrawaltype = 'usd';
                  Purchase.getBTCforUSD($scope.withdraw, function(response) {
                    if(response.error) {
                      $scope.withdrawalReqError = response.message;
                      // $timeout(function() {
                      //   $window.location.reload();
                      // }, 2000);
                    } else {
                      $scope.withdraw.btc = response.btc;
                      // $scope.withdraw.adscash = response.adscash;
                      // $scope.withdraw.repurchase = response.repurchase;
                      $scope.withdraw.withdrawamount = response.withdrawamount;
                      $scope.withdraw.reqToken = response.token;
                      $scope.withdraw.currentbtcrate = response.currentbtcrate;
                      $scope.withdraw.withdrawalid = response.id;
                      $scope.withdrawalReqError = '';
                      $uibModal.open({
                        templateUrl: 'app/products/purchase/usd-withdrawal.html',
                        size: 'md',
                        scope: $scope,
                        backdrop: 'static',
                        keyboard: false,
                        windowClass: 'zindex'
                      });
                    }
                  });
                }
            }
          });
        }
      });
    };

    $scope.processUSDWithdrawal = function(withdrawForm) {
      $scope.disableProcessWithdraw = true;
      $scope.withdrawalError = 'Please wait while request is processed..';
      $scope.withdrawalSuccess = '';
      if(withdrawForm.$valid && $scope.withdraw && $scope.withdraw.address !== '') {
        Withdrawal.saveInfo($scope.withdraw, function(response) {
          if(!response.error) {
              $scope.withdrawalError = '';
              $scope.withdrawalSuccess = response.message;
              setTimeout(function(){
                $scope.closeAllDialogs();
                $window.location.reload();
              }, 2000);
          } else if(response.error && response.otpError) {
              $scope.withdrawalError = response.message;
              $scope.disableProcessWithdraw = false;
          } else if(response.error && !response.otpError) {
            $scope.withdrawalError = response.message;
            $scope.disableProcessWithdraw = false;
            setTimeout(function(){
              $scope.withdrawalError = '';
              $scope.closeAllDialogs();
              $window.location.reload();
            }, 2000);
          }
        });
      } else {
        $scope.withdrawalError = 'Please provide appropriate inputs';
      }
    };

    $scope.cancelUSDWithdrawal = function() {
      if($scope.withdraw && $scope.withdraw.withdrawalid) {
        Withdrawal.cancelUSDWithdrawal({wdid: $scope.withdraw.withdrawalid}, function(response) {
          if(!response.error) {
            $scope.enterWdOtp = false;
            $scope.withdraw = {
              amount : MIN_WITHDRAWAL_LIMIT,
              address : '',
              btc : 0,
              reqToken : '',
              adscash : 0,
              withdrawamount : 0,
              repurchase : 0,
              otp : ''
            };
            $scope.withdrawalError = '';
            $scope.disableProcessWithdraw = false;
            $scope.WithdrawalSuccess = '';
            $scope.disableWithdrawal = false;
            $uibModalStack.dismissAll();
          } else {
            $scope.withdrawalError = response.message;
            setTimeout(function() {
              $scope.withdrawalError = '';
            }, 1000);
          }
        });
      }
    };

    $scope.processADCWithdrawal = function(withdrawForm) {
      $scope.disableProcessWithdraw = true;
      $scope.withdrawalAdcError = 'Please wait while request is processed..';
      $scope.withdrawalAdcSuccess = '';
      $scope.withdrawadc.address = $scope.withdrawadc.naddress ? $scope.withdrawadc.naddress : $scope.withdrawadc.address;
      if(withdrawForm.$valid && $scope.withdrawadc && $scope.withdrawadc.address != '') {
        Withdrawal.saveInfo($scope.withdrawadc, function(response) {
          if(!response.error) {
              $scope.withdrawalAdcError = '';
              $scope.withdrawalAdcSuccess = response.message;
              setTimeout(function(){
                $scope.closeAllDialogs();
                $window.location.reload();
              }, 2000);
          } else if(response.error && response.otpError) {
              $scope.withdrawalAdcError = response.message;
              $scope.disableProcessWithdraw = false;
          } else if(response.error && !response.otpError) {
            $scope.withdrawalAdcError = response.message;
            $scope.disableProcessWithdraw = false;
            setTimeout(function(){
              $scope.withdrawalAdcError = '';
              $scope.closeAllDialogs();
              $window.location.reload();
            }, 2000);
          }
        })
      } else {
        $scope.withdrawalAdcError = 'Please provide appropriate inputs';
      }
    }

    $scope.cancelAdsCashWithdrawal = function(){
       $scope.withdrawadc = {
                amount : 100,
                address : '',
                reqToken : '',
                otp : '',
                limits : {
                  min : API_CONSTANTS.MIN_ADC_WITHDRAWAL_LIMIT,
                  max : API_CONSTANTS.MAX_ADC_WITHDRAWAL_LIMIT
                }
              };
              $scope.withdrawalAdcError = '';
              $scope.withdrawalAdcSuccess = '';
              $scope.enterWdOtp = false;
            $scope.disableProcessWithdraw = false;
            $scope.disableWithdrawal = false;
            $uibModalStack.dismissAll();
    }

    $scope.closeModal = function() {
      $scope.transferCoins = {
        coins :10,
        reqToken : ''
      };
      $scope.transferCoinSuccess = '';
      $scope.transferCoinError = '';
      $scope.transferCoinLock = false;
      // $scope.withdraw = {
      //   amount : 100,
      //   address : '',
      //   btc : 0,
      //   reqToken : '',
      //   adscash : 0,
      //   withdrawamount : 0,
      //   repurchase : 0
      // };
      // $scope.withdrawalError = '';
      // $scope.disableProcessWithdraw = false;
      // $scope.WithdrawalSuccess = '';
      // $scope.disableWithdrawal = false;
      $uibModalStack.dismissAll();
    };

    $scope.totalActiveEarnings = 0;
    $scope.totalExEarnings     = 0;
    // Purchase.revenueshare({}, function(data) {
    //   $scope.revenue = data;
    //   $scope.revenue.silverpacks.forEach(function(pack) {
    //     var tpacks = parseInt(pack.totalpacks),
    //         tearn  = pack.totalearning,
    //         rcost  = parseInt(pack.revenuecloseamount);
    //     pack.earnUSD  = (((tpacks * 25) / (tpacks * 1000)) * tearn);
    //     pack.progress = ((pack.earnUSD / (tpacks * rcost)) * 100);
    //     pack.maxLen   = (tpacks * rcost);
    //
    //     $scope.totalActiveEarnings += pack.earnUSD;
    //   });
    // });
    // Purchase.expiredPacks({}, function(data) {
    //   $scope.exrevenue = data;
    //   $scope.exrevenue.silverpacks.forEach(function(pack) {
    //     var tpacks = parseInt(pack.totalpacks),
    //         tearn  = pack.totalearning,
    //         rcost  = parseInt(pack.revenuecloseamount);
    //     pack.earnUSD  = (((tpacks * 25) / (tpacks * 1000)) * tearn);
    //     pack.progress = ((pack.earnUSD / (tpacks * rcost)) * 100);
    //     pack.maxLen   = (tpacks * rcost);
    //
    //     $scope.totalExEarnings += pack.earnUSD;
    //   });
    // });

    if(Auth.isLoggedIn()) {
      Auth.getCurrentUser().$promise.then(function(info) {
        $scope.userinfo = info;
        $scope.wdeditinfo.advcashinfo = info.advcash;
        $scope.wdeditinfo.bitcoininfo = info.bitcoin;
        $scope.wdeditinfo.payzainfo   = info.payza;
        $scope.min_add_fund = (Auth.getBusinessRoles().indexOf(info.role) >= 0 ? 2500 : 100);
        $scope.buyInfo.usd = (Auth.getBusinessRoles().indexOf(info.role) >= 0 ? 2500 : 100);
      });
    }

    $scope.loadingText = '';
    $scope.loadPage = function() {
      $scope.errorPurchased = '';
      $scope.loadingText = 'Please wait while loading...';
      // Campaign.walletInfo({page: $scope.currentPage}, function(walletInfo) {
      //   $scope.loadingText = '';
      //   $scope.rows        = walletInfo.data;
      //   $scope.totalPages  = walletInfo.rows;
      //   $scope.walletLimit = walletInfo.limit;
      //   $scope.errorWallet = '';
      //   $scope.walletLimits = 1;
      //   if( walletInfo.rows > 25) {
      //     $scope.walletLimits = Math.ceil(walletInfo.rows / 25);
      //   }
      // });
    };

    // Go to Specifc Page
    $scope.updatePage = function(type) {
      //alert($scope.getCommissionPage, $scope.getRevenuePage, $scope.getWithdrawalPage);
      //Commission Go to Page
      if($scope.getCommissionPage && type === 'commission') {
        if($scope.getCommissionPage > $scope.commissionLimits) {
          $scope.errorCommission = 'Page not found';
        }else {
          $scope.currentCommissionPage = $scope.getCommissionPage;
          $scope.loadCommissionInfo();
        }
      }

      // Revenue Go to Page
      if($scope.getRevenuePage && type === 'revenue') {
        if($scope.getRevenuePage > $scope.revenueLimits) {
          $scope.errorRevenue = 'Page not found';
        }else {
          $scope.currentRevenuePage = $scope.getRevenuePage;
          $scope.loadRevenueInfo();
        }
      }

      // Withdrawal Go to Page
      if($scope.getWithdrawalPage && type === 'withdrawal') {
        if($scope.getWithdrawalPage > $scope.withdrawalLimits) {
          $scope.errorWithdrawal = 'Page not found';
        }else {
          $scope.currentWithdrawalPage = $scope.getWithdrawalPage;
          $scope.loadWithdrawalPage();
        }
      }

      // Purchased Go to Page
      if($scope.getPurchasedPage && type === 'purchase') {
        if($scope.getPurchasedPage > $scope.walletLimits) {
          $scope.errorPurchased = 'Page not found';
        }else {
          $scope.currentPurchasedPage = $scope.getPurchasedPage;
          $scope.loadPage();
        }
      }

      if($scope.getUsdWalletPage && type === 'usdWallet') {
        if($scope.getUsdWalletPage > $scope.usdWalletLimits) {
          $scope.errorUsdWallet = 'Page not found';
        } else {
          $scope.currentUsdWalletPage = $scope.getUsdWalletPage;
          $scope.loadUsdTransactions();
        }
      }

    };

    $scope.loadWithdrawalPage = function() {
      $scope.loadingText = 'Please wait while loading...';
      Campaign.withdrawalInfo({page: $scope.currentWithdrawalPage}, function(withdrawalInfo) {
        $scope.loadingText = '';
        $scope.withdrawals = withdrawalInfo.data;
        $scope.totalWithdrawalPages  = withdrawalInfo.rows;
        $scope.withdrawalLimit = withdrawalInfo.limit;
        $scope.errorWithdrawal = '';
        $scope.withdrawalLimits = 1;
        if( withdrawalInfo.rows > 25) {
          $scope.withdrawalLimits = Math.ceil(withdrawalInfo.rows / 25);
        }
      });
    };

    $scope.loadAdsCreated = function() {
       $scope.loadingText = 'Please wait while loading...';
       Campaign.get({page: $scope.createdAdsPage,'type[]':['fbshare','fblike']}, function(info) {
           console.log(info);
           $scope.campaigns  = info.data;
           $scope.totalPages = info.rows;
         });
    };

    // $scope.loadTotalCommission = function() {
    //   $scope.totalCommission = 0;
    //   Campaign.totalCommission(function(_data) {
    //     if(_data && _data.totalCoins){
    //       $scope.totalCommission = _data.totalCoins[0].coins;
    //     }
    //   });
    // };

    $scope.loadGoldCoinsTabs = function(){
   	 $scope.loadingText = 'Please wait while loading...';

        Campaign.getEarnedGoldInfo({page: $scope.earnedGoldCoinPage}, function(earnedInfo) {

          $scope.loadingText = '';
          $scope.earnedGold = earnedInfo.data;
          $scope.totalEarnedGoldCoinPage  = earnedInfo.rows;
        });
    };

    $scope.withdrawalPayment = function(){
      $scope.disableButton = true;
      $scope.errorMessage = '';
      Purchase.getPurchasedPacksInfo({type: 'gold'}, function(data) {
        $scope.allTimeGoldPacks = data.apacks;
        $scope.goldCoins = data.acoins;

        $scope.userinfo = $scope.userinfo;
        $uibModal.open({
          templateUrl: 'app/wallet/withdrawal-popup.html',
          scope: $scope,
          size:  'md',
          windowClass: 'zindex'
        });

      });
    };

    //$scope.loadTotalCommission();

    $scope.loadCommissionInfo = function() {
      $scope.loadingText = 'Please wait while loading...';
      Campaign.commissionInfo({page: $scope.currentCommissionPage}, function(commissionInfo) {
        $scope.loadingText = '';
        $scope.commissions = commissionInfo.data;
        $scope.totalCommissionPages  = commissionInfo.rows;
        $scope.totalCommissionLimit = commissionInfo.limit;
        $scope.errorCommission = '';
        $scope.commissionLimits = 1;
        if( commissionInfo.rows > 25) {
          $scope.commissionLimits = Math.ceil(commissionInfo.rows / 25);
        }
      });
    };

    $scope.loadRevenueInfo = function() {
      $scope.loadingText = 'Please wait while loading...';
      Campaign.revenueInfo({page: $scope.currentRevenuePage}, function(revenueInfo) {
        $scope.loadingText = '';
        $scope.revenues = revenueInfo.data;
        $scope.totalRevenuesPages  = revenueInfo.rows;
        $scope.revenueInfoLimit = revenueInfo.limit;
        $scope.errorRevenue = '';
        $scope.revenueLimits = 1;
        if( revenueInfo.rows > 25) {
          $scope.revenueLimits = Math.ceil(revenueInfo.rows / 25);
        }
      });
    };

    $scope.loadUsdTransactions = function(){
      $scope.errorUsdWallet = '';
      $scope.loadingText = 'Please wait while loading...';
      Campaign.usdTransactionsInfo({page: $scope.currentUsdWalletPage, subtype:$scope.subtype}, function(transactions) {
        $scope.loadingText = '';
        $scope.usdTransactions        = transactions.data;
        $scope.totalUsdWalletPages  = transactions.rows;
        $scope.usdTransactionsLimit = transactions.limit;
        $scope.errorUsdWallet = '';
        $scope.usdWalletLimits = 1;
        if( transactions.rows > 25) {
          $scope.usdWalletLimits = Math.ceil(transactions.rows / 25);
        }
      });
    };

    $scope.getFundTransferList = function(filter){
        $scope.subtype = filter;
        $scope.loadUsdTransactions();
    }

    if($scope.isLoggedIn() && $scope.userRole !== 'user') {
      $scope.loadUsdTransactions();
    }

    Purchase.getTotalCommissionEarned(function(data) {
        $scope.totalCommission = 0;

      if(!data.error) {
        $scope.totalCommission = data.commission;
      }
    });

    Purchase.getPurchasedPacksInfo(function(data) {
        Cache.put("usd_balance", data.usd);
      $scope.usdWallet.balance = data.usd;
      $scope.adsCashWallet.balance = data.adscash;
    });

    $scope.reqId = '';
    $scope.errorMessage  = '';
    $scope.disableButton = false;
    $scope.saveWithdrawalInfo = function(form) {
      $scope.disableButton = true;
      $scope.errorMessage = 'Please wait, while processing your request ...';

      if(form.$valid && ($scope.wdeditinfo.method === 'bitcoin' || $scope.wdeditinfo.method === 'advcash' || $scope.wdeditinfo.method === 'stp' || ($scope.wdeditinfo.method === 'payza' && $scope.showIntantTransfer === true))) {
        var isValid = true;
        Purchase.getPurchasedPacksInfo({type: 'gold'}, function(data) {
          $scope.allTimeGoldPacks = data.apacks;
          $scope.goldCoins = data.acoins;

          if($scope.goldCoins >= $scope.wdeditinfo.amount && isValid) {
            $scope.wdeditinfo.reqToken = $scope.reqId;
            Withdrawal.saveInfo($scope.wdeditinfo, function(data) {
              if(data._id) {
                $scope.wdeditinfo = {
                  amount: '',
                  method: ''
                };

                $uibModalStack.dismissAll();
                $state.go('WithdrawalSuccess', {tid: data.creditlogid});
              }
              else {

                $scope.errorMessage = 'Sorry!, We are unable to take your request now. Please try after some time.';
                if((data.error || data.error == null) && data.message) {
                  $scope.errorMessage = 'Sorry!, ' + data.message;
                }
              }
              $scope.disableButton = false;
            });
          }
          else {
            $scope.errorMessage  = (isValid ? 'You do not have that much coins to transfer.' : $scope.errorMessage);
            $scope.disableButton = false;
          }
        });
      }
      else {
        $scope.disableButton = false;
        $scope.errorMessage  = 'Please fill all information and withdrawal coins must be less than or equal to balance coins';
      }
    };

    $scope.calculateInfo = function() {

      Withdrawal.getAdminFee({type: $scope.wdeditinfo.method}, function(info) {

        if(info.error) {
          $scope.disableButton = true;
          $scope.errorMessage  = 'Sorry!, ' + info.message;
        }
        else {
          $scope.reqId    = info.reqtoken;
          $scope.adminFee = info.fee;
          $scope.withdrawalAmt = (($scope.wdeditinfo.amount <= $scope.goldCoins) ? ($scope.wdeditinfo.amount * $scope.unitPrice) : 0);
          $scope.advWithdrawalAmount = (($scope.wdeditinfo.amount <= $scope.goldCoins) ? (($scope.wdeditinfo.amount * $scope.unitPrice) - ($scope.wdeditinfo.amount * $scope.unitPrice * $scope.adminFee)) : 0);
          $scope.bitcoinTransferAmount = (($scope.wdeditinfo.amount <= $scope.goldCoins) ? (($scope.wdeditinfo.amount * $scope.unitPrice) - ($scope.wdeditinfo.amount * $scope.unitPrice * $scope.adminFee)) : 0);
          $scope.payzaWithdrawalAmount = (($scope.wdeditinfo.amount <= $scope.goldCoins) ? (($scope.wdeditinfo.amount * $scope.unitPrice) - ($scope.wdeditinfo.amount * $scope.unitPrice * $scope.adminFee)) : 0);
          $scope.stpWithdrawalAmount = (($scope.wdeditinfo.amount <= $scope.goldCoins) ? (($scope.wdeditinfo.amount * $scope.unitPrice) - ($scope.wdeditinfo.amount * $scope.unitPrice * $scope.adminFee)) : 0);

          $scope.disableButton = false;
          $scope.errorMessage  = '';
        }
      });
    };

    $scope.showWithdrawalInfo = function(key) {
      $scope.wdeditinfo = {};
      $uibModal.open({
        templateUrl: 'app/wallet/withdrawal-info-popup.html',
        scope: $scope,
        size: 'md'
      });

      Withdrawal.getByTransactionId({wdid: key}, function(resp) {
        $scope.wdeditinfo = resp || {};
        var row = $filter('filter')($scope.withdrawals, {wkey: key});
        $scope.wdeditinfo.comment = ((row && row[0] && row[0].comment) ? row[0].comment : '-');
      });
    };

    $scope.buyInfo = { usd : 25, error : null };
    $scope.paymode = { name : 'bitcoinBlockIO'};
    $scope.showPaymentQRCode = false;

    $scope.addFund = function() {
      $scope.showPayMethods($scope.buyInfo);
    };

    $scope.showPayMethods = function(form) {
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
            templateUrl: 'app/products/purchase/paymethods.html',
            size: 'md',
            scope: $scope,
            backdrop: 'static',
            keyboard: false,
            windowClass: 'zindex'
          });
        }
      });
    };
    $scope.purchasePacks = function(){
      if($scope.buyInfo.usd > 0) {
        $scope.waitMessage = ' Please wait, while we are processing your request...';
        $scope.paymentError = '';
        var productInfo = {
          amount: $scope.buyInfo.usd,
          name: 'US Dollars',
          id : 'usd',
          type: $scope.paymode.name,
          reqToken: $scope.paymentRequestToken
        };

        //var payInfo = angular.extend({'_token': $cookies.get('token') }, productInfo);


        Purchase.doPayment(productInfo, function(data) {
          $scope.waitMessage = '';
          $scope.paymentError = '';
          if(data.error) {
            $scope.paymentError = data.message;
          }
          else{
            $scope.showPaymentQRCode = true;
            $scope.buyInfo.response = data.data;
          }
        },function(err){
          $scope.waitMessage = '';
          $scope.paymentError = err;
        });
      }
      else{
        $scope.waitMessage = '';
        $scope.paymentError = 'Not valid information';
      }
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
          else if (!resp.error && resp.istemp == 1) {
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

    $scope.payLater = function(){
      $scope.paymentError = 'This Invoice is valid for the next 3 hours, any payments to this address after this duration might not be credited.';
      setTimeout(function(){
        $scope.closeDialog();
        $scope.closeAllDialogs();
      }, 5000);
    };

    $scope.cancelInvoice = function(paymentid){
      $scope.paymentError = 'Please wait.';
      Purchase.cancelTransaction({id: paymentid, type : $scope.paymode.name }, function() {
          $scope.paymentError = '';
          $scope.closeDialog();
          $scope.closeAllDialogs();
      });
    };


    $scope.closeAllDialogs = function() {
      $uibModalStack.dismissAll();
    };

    $scope.closeDialog = function() {
      $scope.showPaymentQRCode = false;
      $scope.paymentError = '';
      angular.element('#payoptions .close').trigger('click');
    };

    $scope.showWithdrawalDetails = function(data) {
      $scope.withdrawalData = data;
    };

    $scope.loadPage();
    //$scope.loadWithdrawalPage();
    //$scope.loadPurchaseInfo();
  })
  .controller('CashWallet', function(){

  })
  .controller('GoldWallet', function(){

  })
  .controller('SilverWallet', function($scope, Campaign, Auth, Withdrawal) {
    $scope.currentPage = 1;
    $scope.earnedCurrentPage = 1;
    $scope.currentWithdrawalPage = 1;
    $scope.createdAdsPage = 1;
    $scope.silverTextAdsCurrentPage = 1;
    $scope.totalPages = 0;
    $scope.totalWithdrawalPages = 0;
    $scope.errorPurchased = '';
    $scope.errorEarned = '';
    $scope.errorAd = '';
    $scope.purchasedPages = 1;
    $scope.earnedPages = 1;
    $scope.adPages = 1;

    $scope.sortType     = 'createdAt'; // set the default sort type
    $scope.sortReverse  = true;  // set the default sort order
    $scope.dateFilter = true;
    $scope.coinFilter = true;

    $scope.earnSortReverse  = true;  // set the default sort order
    $scope.earnDateFilter = true;
    $scope.earnCoinFilter = true;

    $scope.adSortReverse  = true;  // set the default sort order
    $scope.adDateFilter = true;
    $scope.adCoinFilter = true;

    $scope.loadPurchasePageText = '';
    $scope.loadPurchasePage = function(pgObj) {
      $scope.errorPurchased = '';
      if(pgObj && pgObj.getPurchasedPage) {
        $scope.currentPage = pgObj.getPurchasedPage;
      }else{
        $scope.currentPage = pgObj ? pgObj.currentPage : $scope.currentPage;
      }

      $scope.loadPurchasePageText = 'Please wait while loading...';
      Campaign.silverWalletInfo({page: $scope.currentPage}, function(walletInfo) {
        $scope.loadPurchasePageText = '';
        $scope.purchaseRows         = walletInfo.data;
        $scope.purchaseTotalPages   = walletInfo.rows;
        $scope.silverViewLimit      = walletInfo.limit;
        if($scope.purchaseTotalPages > 25) {
          $scope.purchasedPages = Math.ceil($scope.purchaseTotalPages / 25);
        }
      });
    };

    $scope.loadEarnedPageText = '';
    $scope.loadEarnedPage = function(pgObj) {
      $scope.errorEarned = '';
      if(pgObj && pgObj.getEarnedPage) {
        $scope.earnedCurrentPage = pgObj.getEarnedPage;
      }else{
        $scope.earnedCurrentPage = pgObj ? pgObj.earnedCurrentPage : $scope.earnedCurrentPage;
      }
      $scope.loadEarnedPageText = 'Please wait while loading...';
      Campaign.silverEarnInfo({page: $scope.earnedCurrentPage}, function(walletInfo) {
        $scope.loadEarnedPageText  = '';
        $scope.earnedRows          = walletInfo.data;
        $scope.earnedTotalPages    = walletInfo.rows;
        $scope.silverEarnViewLimit = walletInfo.limit;
        if($scope.earnedTotalPages > 25) {
          $scope.earnedPages = Math.ceil($scope.earnedTotalPages / 25);
        }
      });
    };

    $scope.loadExpensePageMessage = '';
    $scope.loadExpensePage = function(pgObj) {
      $scope.errorAd = '';
      if(pgObj && pgObj.getAdPage) {
        $scope.silverTextAdsCurrentPage = pgObj.getAdPage;
      }else{
        $scope.silverTextAdsCurrentPage = pgObj ? pgObj.silverTextAdsCurrentPage : $scope.silverTextAdsCurrentPage;
      }

      $scope.loadExpensePageMessage = 'Please wait while loading...';
      Campaign.silverTextAdsInfo({page: $scope.silverTextAdsCurrentPage}, function(walletInfo) {
        $scope.loadExpensePageMessage  = '';
        $scope.silverTextAdsRows       = walletInfo.data;
        $scope.silverTextAdsTotalPages = walletInfo.rows;
        $scope.silverTextAdsViewLimit  = walletInfo.limit;
        if($scope.silverTextAdsTotalPages > 25) {
          $scope.adPages = Math.ceil($scope.silverTextAdsTotalPages / 25);
        }
      });
    };

    // Go to Specifc Page
    $scope.updatePage = function(pageObject, type) {
      // Purchased Go to Page
      if(pageObject.getPurchasedPage != undefined && type === 'purchase') {
        $scope.getPurchasedPage = pageObject.getPurchasedPage;
        if($scope.getPurchasedPage > $scope.purchasedPages) {
          $scope.errorPurchased = 'Page not found';
        }else {
          $scope.loadPurchasePage(pageObject);
        }
      }

      // Earned Coins Go to Page
      if(pageObject.getEarnedPage != undefined && type === 'earned') {
        $scope.getEarnedPage = pageObject.getEarnedPage;
        if($scope.getEarnedPage > $scope.earnedPages) {
          $scope.errorEarned = 'Page not found';
        }else {
          $scope.loadEarnedPage(pageObject);
        }
      }

      // Text Ad Go to Page
      if(pageObject.getAdPage != undefined && type === 'ad') {
        $scope.getAdPage = pageObject.getAdPage;
        if($scope.getAdPage > $scope.adPages) {
          $scope.errorAd = 'Page not found';
        }else {
          $scope.loadExpensePage(pageObject);
        }
      }
    };

    $scope.loadPurchasePage();
    $scope.loadEarnedPage();
    $scope.loadExpensePage();
  })
  .controller('WithdrawalSuccessCtrl', function($scope, $stateParams, Withdrawal){

    $scope.uniquetransactionid = $stateParams.tid;

    Withdrawal.getByTransactionId({wdid: $stateParams.tid}, function(data) {
      $scope.widthdrawal = data;
    });

  })
  .controller('RevenueShare', function($scope, $rootScope, $state, $stateParams, Purchase){
    $scope.totalActiveEarnings = 0;
    $scope.totalExEarnings     = 0;
    Purchase.revenueshare({}, function(data) {
      $scope.revenue = data;
      $scope.revenue.silverpacks.forEach(function(pack) {
        var tpacks = parseInt(pack.totalpacks),
            tearn  = pack.totalearning,
            rcost  = parseInt(pack.revenuecloseamount);
        pack.earnUSD  = (((tpacks * 25) / (tpacks * 1000)) * tearn);
        pack.progress = ((pack.earnUSD / (tpacks * rcost)) * 100);
        pack.maxLen   = (tpacks * rcost);

        $scope.totalActiveEarnings += pack.earnUSD;
        //pack.earnUSD  = Math.ceil(pack.earnUSD);
      });
    });

    Purchase.expiredPacks({}, function(data) {
      $scope.exrevenue = data;
      $scope.exrevenue.silverpacks.forEach(function(pack) {
        var tpacks = parseInt(pack.totalpacks),
            tearn  = pack.totalearning,
            rcost  = parseInt(pack.revenuecloseamount);
        pack.earnUSD  = (((tpacks * 25) / (tpacks * 1000)) * tearn);
        pack.progress = ((pack.earnUSD / (tpacks * rcost)) * 100);
        pack.maxLen   = (tpacks * rcost);

        $scope.totalExEarnings += pack.earnUSD;
        pack.earnUSD  = Math.ceil(pack.earnUSD);
      });
    });
  });
