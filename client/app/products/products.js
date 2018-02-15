'use strict';

angular.module('iCoinApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('products', {
        url: '/products',
        parent: 'app',
        templateUrl: 'app/products/products.html',
        controller: 'ProductsCtrl',
        authenticate: true
      })
      /* .state('purchase', {
        url: '/purchase/:type',
        templateUrl: 'app/products/purchase/index.html',
        controller: 'PurchaseCtrl'
      }) */
      .state('purchaseAdsCash', {
        url: '/purchase-adscash',
        parent: 'app',
        templateUrl: 'app/products/purchase/purchase-adscash.html',
        controller: 'PurchaseCtrl',
        authenticate : true
      })
      // .state('goldAdvertising', {
      //   url: '/gold-advertising',
      //   templateUrl: 'app/products/purchase/index.html',
      //   controller: 'PurchaseCtrl',
      //   authenticate: true
      // })
      .state('silverAdvertising', {
        url: '/silver-advertising',
        parent: 'app',
        templateUrl: 'app/products/purchase/index.html',
        controller: 'PurchaseCtrl',
        authenticate: true
      })
      .state('purchase_renew', {
        url: '/purchase/renew/:id',
        parent: 'app',
        templateUrl: 'app/products/purchase/index.html',
        controller: 'PurchaseCtrl',
        authenticate: true
      })
      .state('purchaseHistory', {
        url: '/purchase-history',
        parent: 'app',
        templateUrl: 'app/products/purchase/purchaseHistory.html',
        controller: 'PurchaseHistoryCtrl',
        authenticate: true
      }) 
      .state('campaign', {
        url: '/campaign',
        parent: 'app',
        templateUrl: 'app/products/campaign/index.html',
        controller: 'CampaignCtrl',
        authenticate: true
      })
      .state('listcampaign', {
        url: '/list-campaign',
        parent: 'app',
        templateUrl: 'app/products/campaign/list-campaigns.html',
        controller: 'ListCampaignCtrl',
        authenticate: true
      })
      .state('purchasesuccess', {
        url: '/purchase-success/:token',
        parent: 'app',
        templateUrl: 'app/products/purchase/success.html',
        controller: 'PurchaseSuccessCtrl',
        authenticate: false
      })
      .state('purchasefailure', {
        url: '/purchase-failure/:token',
        parent: 'app',
        templateUrl: 'app/products/purchase/failure.html',
        controller: 'PurchaseFailureCtrl',
        authenticate: false
      })
      .state('campaign_edit', {
        url: '/campaign/edit/:id',
        parent: 'app',
        templateUrl: 'app/products/campaign/index.html',
        controller: 'CampaignCtrl',
        authenticate: true
      })
      .state('OrderHistory', {
        url: '/order-history',
        parent: 'app',
        templateUrl: 'app/products/purchase/order-history.html',
        controller: 'OrderHistoryCtrl',
        authenticate: true
      })
      .state('BankWireInvoice', {
        url: '/purchase-invoice/:token',
        // parent: 'app',
        templateUrl: 'app/products/purchase/purchase-invoice.html',
        controller: 'PurchaseInfoCtrl',
        authenticate: false
      })
      .state('BankWireImage', {
        url: '/purchase-image/:token',
        parent: 'app',
        controller: 'UploadImageCtrl',
        authenticate: false
      });
  });
