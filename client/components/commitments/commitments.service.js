'use strict';
angular.module('iCoinApp')
  .factory('CommitmentsService', function ($resource, ApiPath) {
    return $resource(ApiPath + '/api/commitments/:id/:controller', {
      id: '@_id'
    },
    {
      'placeCommitment': {
        method: 'POST',
        params: {
          controller:'place-commitment'
        }
      },
      'commitmentsList': {
        method: 'GET',
        params: {
          controller:'commitments-list'
        }
      },
       'listAll': {
        method: 'GET',
        params: {
        }
      },
      'withdrawCommitment': {
        method: 'POST',
        params: {
          controller:'withdraw-commitment'
        }
      },
      'exportCommitment': {
        method: 'GET',
        params: {
          controller:'export-commitment'
        }
      },
      'getPerDayInvestment': {
                method: 'GET',
                params: {
                    controller: 'get-per-day-investment'
                }
          },
       'UnPickedAmountDetail' : {
                method: 'GET',
                params: {
                    controller: 'unpicked-amount-detail'
                }
       },
       'unPickedCommimentList' : {
                method: 'GET',
                params: {
                    controller: 'unpicked-commiment-list'
                }
       },
       'pickCommiments' : {
               method: 'POST',
                params: {
                    controller: 'pick-commiments'
                }
       },
       'pickedCommimentList' : {
                method: 'GET',
                params: {
                    controller: 'picked-commiment-list'
                }
       },
       'latestInvestmentList' : {
                method: 'GET',
                params: {
                    controller: 'latest-investment-list'
                }
       },
       'pickedCommimentListByPM' : {
                method: 'GET',
                params: {
                    controller: 'picked-commiment-listByPM'
                }
       },
       'getCommitmentsData':{
          method: 'GET',
                params: {
                    controller: 'get-commitments-data'
                }
       },
       'commitedAmountList' : {
                method: 'GET',
                params: {
                    controller: 'commited-amount-list'
                }
       },
       'packagesProfitList' : {
                method: 'GET',
                params: {
                    controller: 'packages-profit-list'
                }
       },
       'updateProfit' : {
                method: 'POST',
                params: {
                    controller: 'update-profit'
                }
       },
       'profitLogList' : {
                method: 'GET',
                params: {
                    controller: 'profit-log-list'
                }
       },
       'cancelCommitment' : {
              method: 'POST',
              params: {
                  controller: 'cancel-commitment'
              }
       },
       'commitmentWithdrawalInfo' : {
              method: 'GET',
              params: {
                  controller: 'commitment-withdrawal-info'
              }
       }
	  });
  });
