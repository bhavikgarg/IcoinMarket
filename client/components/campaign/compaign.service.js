'use strict';

angular.module('iCoinApp')
  .factory('Campaign', function ($resource, ApiPath) {
    return $resource(ApiPath + '/api/campaigns/:id/:controller', {
      id: '@_id'
    },
    {
      'create': {
        method: 'POST',
        params: {
          controller:'create'
        }
      },
      'get': {
        method: 'GET',
        params: {
        }
      },
      'getItem': {
        method: 'GET',
        params: {
          controller: 'show'
        }
      },
      'getByType': {
        method: 'GET',
        params: {
          controller: 'list'
        }
      },
      'lastViewTime': {
        method: 'GET',
        params: {
          controller: 'last-view-time'
        }
      },
      'update': {
        method: 'PUT',
        params: {
          controller:'update'
        }
      },
      'updateView': {
        method: 'PUT',
        params: {
          controller:'update-view'
        }
      },
      'remove': {
        method: 'DELETE',
        params: {
          controller:'remove'
        }
      },
      creditsInfo: {
        method: 'GET',
        params: {
          controller: 'credit-info'
        }
      },
      walletInfo: {
        method: 'GET',
        params: {
          controller: 'wallet-info'
        }
      },
      totalCommission: {
        method: 'GET',
        params: {
          controller: 'total-commission'
        }
      },
      commissionInfo: {
        method: 'GET',
        params: {
          controller: 'commission-info'
        }
      },
      revenueInfo: {
        method: 'GET',
        params: {
          controller: 'revenue-info'
        }
      },
      silverWalletInfo: {
        method: 'GET',
        params: {
          controller: 'silver-wallet-info'
        }
      },
      silverEarnInfo: {
        method: 'GET',
        params: {
          controller: 'silver-wallet-text-ads'
        }
      },
      silverTextAdsInfo: {
        method: 'GET',
        params: {
          controller: 'silver-text-ads-create'
        }
      },
      withdrawalInfo: {
        method: 'GET',
        params: {
          controller: 'withdrawal-info'
        }
      },
      usdTransactionsInfo: {
        method: 'GET',
        params: {
          controller: 'usd-info'
        }
      },
      validateUrl: {
        method: 'GET',
        params: {
          controller: 'valid-content-url'
        }
      },
      getCampaignViews:{
    	  method:'GET',
    	  params:{
    		  controller:'views'
    	  }
      },
      getEarnedGoldInfo:{
    	  method:'GET',
    	  params:{
    		  controller:'earned-info-gold'
    	  }
      },
      updateStatus: {
        method: 'DELETE',
        params: {
        }
      }
	  });
  });
