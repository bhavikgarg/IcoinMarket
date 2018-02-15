'use strict';

angular.module('iCoinApp')
    .factory('Uploadmedia', function($resource, ApiPath) {
        return $resource(ApiPath + '/api/uploadmedia/:id/:controller', {
            id: '@_id'
        }, {
            saveMedia: {
                method: 'POST',
                params: {
                    controller: 'save-media'
                }
            },
            getsaveMedia: {
                method: 'GET',
                params: {
                    controller: 'media'
                }
            },
            deleteMedia: {
                method: 'POST',
                params: {
                    controller: 'delete-media'
                }
            },
            updateMediaSequence: {
                method: 'PUT',
                params: {
                    controller: 'update-media-sequence'
                }
            }
        });
    });