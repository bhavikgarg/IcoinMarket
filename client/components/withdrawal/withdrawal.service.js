'use strict';

angular.module('iCoinApp')
  .factory('Withdrawal', function ($resource, ApiPath) {
    return $resource(ApiPath + '/api/withdrawals/:id/:controller', {
      id: '@_id'
    },
    {
      saveInfo: {
        method: 'POST',
        params: {
        }
      },
      returnRequest: {
        method: 'POST',
        params:{
          controller: 'return'
        }
      },
      cancelRequest: {
        method: 'DELETE',
        params:{
        }
      },
      update: {
        method: 'PUT',
        params: {
        }
      },
      getByTransactionId: {
        method: 'POST',
        params: {
          controller: 'wdinfo'
        }
      },
      getAdminFee: {
        method: 'POST',
        params: {
          controller: 'admin-fee'
        }
      },
      doInstantTransfer: {
        method: 'POST',
        params: {
          controller: 'wdtransfer'
        }
      },
      get: {
        method: 'GET',
        params: {
        }
      },
      addDefault: {
        method: 'POST',
        params: {
          controller: 'default-affilate'
        }
      },
      cancelUSDWithdrawal: {
        method: 'POST',
        params: {
          controller: 'cancel-usdwithdrawal'
        }
      }
	  });
  });
