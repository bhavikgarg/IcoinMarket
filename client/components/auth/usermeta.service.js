'use strict';

angular.module('iCoinApp')
    .factory('Usermeta', function ($resource, ApiPath) {
        return $resource(ApiPath + '/api/kyc/:controller/:id', {
                id: '@_id'
            },
            {
                uploadKyc: {
                    method: 'POST',
                    params: {
                        controller: 'uploads'
                    }
                },
                get: {
                    method: 'GET',
                    params: {
                        controller: 'get'
                    }
                },
                getKycRecords: {
                    method: 'POST',
                    params: {
                        controller: 'get-kyc-records'
                    }
                },
                getSignedKycUrl: {
                    method: 'POST',
                    params: {
                        controller: 'get-signed-url'
                    }
                },
                getUserKycRecord: {
                    method: 'POST',
                    params: {
                        controller: 'get-user-kyc'
                    }
                },
                getPreviousMetas: {
                  method: 'POST',
                  params: {
                    controller: 'rejected-info',
                  }
                }
            });
    });
