'use strict';

angular.module('iCoinApp')
  .factory('Purchase', function ($resource, ApiPath) {
    return $resource(ApiPath + '/api/pay/:id/:txnid/:type/:token/:controller/:viewas/:reqType', {
      id: '@_id'
    },
    {
      'getGateways': {
        method: 'GET',
        params: {
          controller: 'gateways'
        }
      },
      'revenueshare': {
        method: 'GET',
        params: {
          controller: 'revenueshare'
        }
      },
      'expiredPacks': {
        method: 'GET',
        params: {
          controller: 'exrevenueshare'
        }
      },
      'doPayment': {
        method: 'POST',
        params: {
        }
      },
      'doProductPayment': {
        method: 'POST',
        params: {
          controller: 'product'
        }
      },
      'showByToken': {
        method: 'GET',
        params: {
          controller: 'view'
        }
      },
      availableCredits: {
        method: 'GET',
        params: {
          controller: 'available-credits'
        }
      },
      getPurchasedPacksInfo: {
        method: 'POST',
        params: {
          controller: 'packs-info'
        }
      },
      getOrderHistory: {
        method: 'GET',
        params: {
          controller: 'order-history'
        }
      },
      saveBankWireInfo: {
        method: 'POST',
        params: {
          controller: 'bank-wire-info'
        }
      },
      getBankWireInfo: {
        method: 'GET',
        params: {
          controller: 'bank-wire-invoice'
        }
      },
      getAdminBankWireInfo: {
        method: 'GET',
        params: {
          controller: 'bank-wire-finfo'
        }
      },
      updateBankWireAccept: {
        method: 'POST',
        params: {
          controller: 'update-bank-wire'
        }
      },
      savePaypalOfflineInfo: {
        method: 'POST',
        params: {
          controller: 'paypal-info'
        }
      },
      cancelTransaction: {
        method: 'POST',
        params: {
          controller: 'cancel-transaction'
        }
      },
      viewTransaction: {
        method: 'GET',
        params: {
          controller: 'view-transaction'
        }
      },
      updateReceiptPath: {
        method: 'POST',
        params: {
          controller: 'update-receipt-path'
        }
      },
      generateAndSendOtp: {
        method: 'POST',
        params: {
          controller: 'generate-and-send-otp'
        }
      },
      transferUSDCoins: {
        method: 'POST',
        params: {
          controller: 'transfer-usd-coins'
        }
      },
      transferFeeRegister: {
        method: 'GET',
        params: {
          controller: 'transfer-fee-register'
        }
      },
      canUsePaypal: {
        method: 'GET',
        params: {
          controller: 'paypal-available'
        }
      },
      userPaymentInfo: {
        method: 'POST',
        params: {
          controller: 'user-payments-info'
        }
      },
      blockPayment: {
        method: 'POST',
        params: {
          controller: 'block-complete-payment'
        }
      },
      markCompletePayment: {
        method: 'POST',
        params: {
          controller: 'mark-complete'
        }
      },
      getPaymentsInfo: {
        method: 'GET',
        params: {
          controller: 'payments-list'
        }
      },
      getRevenueCutof: {
        method: 'GET',
        params: {
          controller: 'revenue-cutof'
        }
      },
      updateRevenueCutof: {
        method: 'POST',
        params: {
          controller: 'update-cutof'
        }
      },

      getPackInfo: {
        method: 'GET',
        params: {
          controller: 'total-getpackinfo'
        }
      },

      getSilverInfo: {
        method: 'GET',
        params: {
          controller: 'total-getsilverpackinfo'
        }
      },
      getValidToken: {
        method: 'POST',
        params: {
          controller: 'token'
        }
      },
      initializeWithdrawal: {
        method : 'POST',
        params : {
          controller : 'initialize-withdrawal'
        }
      },
      getAdminPayPalInfo: {
        method: 'GET',
        params: {
          controller: 'paypal-finfo'
        }
      },
      updatePayPalAccept: {
        method: 'POST',
        params: {
          controller: 'update-paypal'
        }
      },
      getPayPalInfo: {
        method: 'GET',
        params: {
          controller: 'paypal-invoice'
        }
      },
      getCurrencyRateInfo: {
        method: 'GET',
        params: {
          controller: 'currency-rate'
        }
      },
      getAdsCashCurrencyRate: {
        method: 'GET',
        params: {
          controller: 'adscash-current-rate'
        }
      },

      updateCurrencyRate: {
        method: 'PUT',
        params: {
          controller: 'update-currency-rate'
        }
      },
      getGoldCoinBalance: {
        method: 'GET',
        params: {
          controller: 'ci-gold-coins-balance'
        }
      },
      verifyPayment: {
        method: 'POST',
        params: {
          controller: 'verify-payment'
        }
      },
      viewTransactionStatus: {
        method: 'GET',
        params: {
          controller: 'view-transaction-status'
        }
      },
      approveTransaction: {
        method: 'POST',
        params: {
          controller: 'approve-transaction'
        }
      },
      exportPurchases: {
        method: 'GET',
        params: {
          controller: 'export-purchase'
        }
      },
      getStatistics: {
        method: 'POST',
        params: {
          controller: 'total-circulation'
        }
      },
      getCurrentCirculation: {
        method: 'GET',
        params: {
          controller: 'current-circulation'
        }
      },
      getBTCforUSD: {
        method : 'POST',
        params : {
          controller : 'eq-btc-adscash'
        }
      },
      resendOtp: {
        method: 'POST',
        params: {
          controller: 'resend-otp'
        }
      },
      getTotalCommissionEarned: {
        method: 'GET',
        params: {
          controller: 'commission-earned'
        }
      }
	  });
  });
