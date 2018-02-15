'use strict';

angular.module('iCoinApp')
   .controller('UploadmediaCtrl', function($scope, Uploadmedia, growl) {
      $scope.filter = { data: ''};
      $scope.showList = true;
      $scope.mediauploadfor = "Market Presentations";
      /*$scope.uploadmedia = {};
      $scope.uploadmedia.mediauploadfor='Market Presentations';
      $scope.uploadmedia.defaultLink = 'True';
      $scope.uploadmedia.mediatype = 'PDF';*/
      $scope.saveMediaList = [];

      $scope.setShowList = function(showList) {
         $scope.showList = showList;
      };

      $scope.getsaveMedia = function() {
         Uploadmedia.getsaveMedia({
            mediauploadfor: $scope.mediauploadfor
         }, function(data) {
            $scope.saveMediaList = (data.data);
         });
      };

      $scope.getsaveMedia();

      $scope.saveMedia = function(form) {
         if (form.$valid) {
            $scope.saveError = '';
            $scope.loading = true;
            $scope.uploadmedia.defaultLink === 'true' ? $scope.uploadmedia.defaultLink=true : $scope.uploadmedia.defaultLink=false;
            Uploadmedia.saveMedia($scope.uploadmedia, function(response) {
               if (!response.error) {
                  $scope.saveSuccess = "Media File URL has been Added successfully.";
                  growl.addSuccessMessage($scope.saveSuccess, {
                     ttl: 5000
                  });
                  $scope.showList = true;
                  $scope.mediauploadfor = $scope.uploadmedia.mediauploadfor;
                  $scope.getsaveMedia();
                  $scope.uploadmedia = {};
                  $scope.form.$setPristine();
               } else {
                  $scope.saveError = response.message;
               }
               $scope.loading = false;
            });
         } else {
            $scope.saveError = 'Please provide appropriate inputs';
         }
      };

      $scope.saveMediaSequence = function(formSequence, data) {
         if (formSequence.$valid) {
            $scope.saveError = '';
            $scope.loading = true;
            Uploadmedia.updateMediaSequence(data, function(response) {
               if (!response.error) {
                  $scope.SequencesaveSuccess = "Media sequence has been updated successfully.";
                  growl.addSuccessMessage($scope.SequencesaveSuccess, {
                     ttl: 5000
                  });
               } else {
                  $scope.saveError = response.message;
                  growl.addErrorMessage('Error occurred (' + $scope.saveError + '). Please try again', {
                     ttl: 5000
                  });
               }
               $scope.loading = false;
            });
         } else {
            $scope.saveError = 'Inputs for updating media sequence is not appropriate';
         }
      };

      $scope.deactivateUploadMedia = function(_id) {
         Uploadmedia.deleteMedia({
            id: _id,
            active: false
         }, function() {
            $scope.getsaveMedia();
         });
      };

      $scope.activateUploadMedia = function(_id) {
         Uploadmedia.deleteMedia({
            id: _id,
            active: true
         }, function() {
            $scope.getsaveMedia();
         });
      };
   });