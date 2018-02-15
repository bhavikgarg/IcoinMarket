'use strict';

angular.module('iCoinApp')
  .controller('AdminAffilateBannersCtrl', function($scope, $location, $window, Affiliates, Utilities, AdminAccess, $uibModal, $uibModalStack) {

    AdminAccess.hasAdminAccess();
    $scope.isSoloAddAdmin = AdminAccess.isSoloAddAdmin;
    $scope.isFinanceAdmin = AdminAccess.isFinanceAdmin;
    $scope.isWatchUserAdmin = AdminAccess.isWatchUserAdmin;
    $scope.isModeratorAdmin     = AdminAccess.isModeratorAdmin;
    $scope.isSupervisorAdmin    = AdminAccess.isSupervisorAdmin;

    $scope.banner    = {
      width: 0,
      height: 0,
      image: ''
    };

    $scope.imageFileInfo = function(flowFile) {
      var fileReader = new FileReader();
      fileReader.readAsDataURL(flowFile.file);
      fileReader.onload = function (event) {
        var img = new Image;
        img.onload = $scope.resizeImage;
        img.src = event.target.result;

        $scope.banner.image = 'data:image/png;base64';
      };

      return !!{png:1,gif:1,jpg:1,jpeg:1}[flowFile.getExtension()];
    };

    $scope.createBanner = function() {
      Affiliates.createBanner($scope.banner, function() {
        $location.url('/admin/affiliates/banners');
      });
    };

    $scope.resizeImage = function() {
      $uibModal.open({
        templateUrl: 'app/loader/loader.html',
        scope: $scope,
        backdrop: 'static',
        keyboard: false
      });

      Utilities.saveFile({imageData: this.src, access: 'public-read', uploadType: 'banner'}, function(response) {
        if(!response.error) {
          $scope.banner.image = response.imagePath;
        }
        $uibModalStack.dismissAll();
      });
    };

    $scope.imageToDataUri = function (img, width, height) {
      // create an off-screen canvas
      var canvas = document.createElement('canvas'),
          ctx = canvas.getContext('2d');

      // set its dimension to target size
      canvas.width = width;
      canvas.height = height;

      // draw source image into the off-screen canvas:
      ctx.drawImage(img, 0, 0, width, height);

      // encode image to data-uri with base64 version of compressed image
      return canvas.toDataURL();
    };
  })