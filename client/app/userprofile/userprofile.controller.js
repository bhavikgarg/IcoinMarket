'use strict';

angular.module('iCoinApp')
  .controller('UserprofileCtrl', ['$scope', '$rootScope', '$window', 'User', 'Usermeta', 'DefaultAvatar', 'Utilities',
    'Auth', 'growl', '$location', '$http', 'ApiPath', '$timeout', '$uibModal', '$uibModalStack', function ($scope, $rootScope, $window, User, Usermeta, DefaultAvatar, Utilities, Auth, growl, $location, $http, ApiPath, $timeout, $uibModal, $uibModalStack) {
      $scope.isLoggedIn = Auth.isLoggedIn;
      $scope.userRole = Auth.getCurrentUser() && Auth.getCurrentUser().role;

      if (!$scope.userRole) {
        var currentUser = User.get(function(userData) {
           Auth.setCurrentUser(userData);
           $scope.userRole = userData.role;
         });
      }    
    
      $scope.usermeta = {};
      $scope.username = '';
      $scope.avatar = DefaultAvatar;
      $scope.myImage = '';
      $scope.changeImage = true;
      $scope.userId = '';
      $scope.isSocialSignup = false;
      $scope.stdcode = '';
      $scope.usermeta.showSelfie = false;
      $scope.usermeta.showGovId = false;
      $scope.loaderTest = 'Uploading Image Please Wait';
      $scope.escapeSave = false;
      // $scope.genres = [];

      $scope.isActive = function (route) {
        return route === $location.path();
      };

      $scope.allowedFileSize = function (file) {
        return (file.size >= (1024 * 50) && file.size <= (1024 * 1024 * 5));
      };

      // Utilities.getGenre(function (data) {
      //   $scope.genres = data.genres;
      // });

      Auth.getCurrentUser().$promise.then(function (_user) {
        $scope.data = _user;
        $scope.userId = _user._id;
        $scope.userinfo = _user;
        $scope.userinfo.country=_user.countryName;
        $scope.userinfo.avatar = (_user.avatar || DefaultAvatar);
        $scope.avatarImage = $scope.userinfo.avatar;
        $scope.isSocialSignup = (_user.google || _user.facebook || _user.twitter);
        var _stdcode = $scope.userinfo.mobile;
        _stdcode = _stdcode ? (_stdcode + '').split('-') : '';
        $scope.stdcode = (_stdcode.length > 1 ? _stdcode[0] : '+');
        $scope.userinfo.stdcode=$scope.stdcode;
        $scope.userinfo.mobileNo = (_stdcode.length > 1 ? (_stdcode[1] * 1) : (_stdcode[0] * 1));

        if($scope.userinfo.secondaryMobile)
        {
        var _stdcode2 = $scope.userinfo.secondaryMobile;
        _stdcode2 = _stdcode2 ? (_stdcode2 + '').split('-') : '';
        $scope.userinfo.stdcode2=(_stdcode2.length > 1 ? _stdcode2[0] : '+');
        $scope.userinfo.secondaryMobileNo = (_stdcode2.length > 1 ? (_stdcode2[1] * 1) : (_stdcode2[0] * 1));
        }
        $scope.callStatus = _user.callStatus;

        // if (_user.categories && _user.categories[0] === -1) {
        //   $scope.userinfo.categories = $scope.genres.map(function (item) { return item.key; });
        // }
        console.log($scope.userinfo);
      });

      $scope.showImageCrop = function () {
        //$scope.changeImage = false;
      };

      $scope.edit = function () {
        var el = event.target;
        $(el).closest('.userinfo').find('.val').removeAttr('readonly');
      };

      $scope.cancel = function () {
        $window.location.reload();
      };

      // Save user's information (Part 1 of $scope.save)
      $scope.saveKycInformation = function (data, postData) {
        $http.post(ApiPath + '/api/kyc/save-kyc', postData).then(function (res) {
          if (res.data.error) {
            growl.addErrorMessage('Error : ' + res.data.message, { ttl: 5000 });
          } else {
            growl.addSuccessMessage(res.data.message, { ttl: 5000 });
          }
        }, function () {
          growl.addErrorMessage('Something went wrong. Please try again', { ttl: 5000 });
        });

        $timeout(function () {
          $scope.saveUserInformation(data);
        }, 3000);
      };

      // Save user's information (Part 2 of $scope.save)
      $scope.saveUserInformation = function (_data) {
        User.update(_data, function (res) {
            $rootScope.memberInfo.name = res.name;
            growl.addSuccessMessage('Successfully Updated', { ttl: 3000 });
        });
      };

      $scope.saveAvatar = function () {
        $scope.userinfo.avatar2 = $scope.UserAvatar.compressed.dataURL;
        if ($scope.userinfo.avatar2 != '' && $scope.userinfo.avatar2.indexOf('https://') < 0) {
          $uibModal.open({
            templateUrl: 'app/loader/loader.html',
            controller: 'UserprofileCtrl',
            scope: $scope,
            backdrop: 'static',
            keyboard: false
          });

          Utilities.saveFile({ imageData: $scope.userinfo.avatar2, utype: 'upd', access: 'public-read' }, function (response) {
            if (!response.error) {
              var _data = $scope.userinfo;
              _data.avatar = response.imagePath;
              User.update(_data, function (res) {
                $uibModalStack.dismissAll();
                growl.addSuccessMessage('Successfully Updated', { ttl: 3000 });
                $rootScope.memberInfo.avatar = res.avatar;
              });
            }
            else {
              growl.addInfoMessage('Unable to change your avatar, Please try after sometime.', { ttl: 3000 });
              $uibModalStack.dismissAll();
            }
          });
        }
        else {
          growl.addErrorMessage('Please change your avatar and then click save', { ttl: 3000 });
          $uibModalStack.dismissAll();
        }
      };

    //   $scope.onFileSelect = function($files) {
    //     for (var i = 0; i < $files.length; i++) {
    //         var file = $files[i];
    //         if (!file.type.match(/image.*/)) {
    //             // this file is not an image.
    //         };
    //         $scope.upload = $upload.upload({
    //             url: BASE_URL + 'upload.php',
    //             data: {myObj: $scope.myModelObj},
    //             file: file
    //         }).progress(function(evt) {
    //                 // console.log('percent: ' + parseInt(100.0 * evt.loaded / evt.total));
    //                 // $scope.fileProgress = evt.loaded / evt.total * 100.0;
    //             }).success(function(data, status, headers, config) {
    //                 // file is uploaded successfully
    //                 $scope.userinfo.avatar2 = data;
    //             });
    //     }
    // };

      $scope.save = function (formObj) {
         // $scope.escapeSave ==true  // for temporarily. (CPTiwari)
        $scope.escapeSave=true;
        if ($scope.escapeSave) {
          if (formObj.$valid) {
            var data = angular.extend({ _id: $scope.userId }, $scope.userinfo);
            data.avatar = $scope.userinfo.avatar;
            if ($scope.userinfo.stdcode && $scope.userinfo.stdcode !== '' && $scope.userinfo.mobileNo) {
              data.mobile = $scope.userinfo.stdcode + '-' + $scope.userinfo.mobileNo;
              $scope.userinfo=$scope.userinfo.stdcode + '-' + $scope.userinfo.mobileNo;
            }
            if ($scope.userinfo.stdcode2 && $scope.userinfo.stdcode2 !== '' && $scope.userinfo.secondaryMobileNo) {
              data.secondaryMobile = $scope.userinfo.stdcode2 + '-' + $scope.userinfo.secondaryMobileNo;
              $scope.userinfo.secondaryMobile=$scope.userinfo.stdcode2 + '-' + $scope.userinfo.secondaryMobileNo;
            }
            // This Code commented By CP Tiwari
            // if (!$scope.usermeta.taxid || ($scope.usermeta.taxid && $scope.usermeta.taxid.trim() === '')) {
            //   $scope.saveTaxId(function (val) {
            //     if (val) {
            //       $scope.saveKycInformation(data, { 'doctype': $scope.usermeta.doctype });
            //     }
            //   });
            // }
            // else {
            //   $scope.saveKycInformation(data, { 'doctype': $scope.usermeta.doctype });
            // }
            // This Line Added By CP Tiwari
            $scope.saveUserInformation(data);
          }
          else {
            growl.addErrorMessage('Please fill all required fields', { ttl: 3000 });
          }
        }

      };

      $scope.showSaveAvatar = false;
      var handleFileSelect = function (evt) {
        var file = evt.currentTarget.files[0];
        var reader = new FileReader();
        if (['image/jpeg', 'image/png'].indexOf(file.type) >= 0) {
          reader.onload = function (evt) {
            $scope.$apply(function ($scope) {
              $scope.showSaveAvatar = true;
              $scope.changeImage = false;
            });
          };
          reader.readAsDataURL(file);
        }
      };

      angular.element(document.querySelector('#fileInput')).on('change', handleFileSelect);
      $scope.uploadType = '';

      $scope.setUploadInfo = function (data, showMessage) {
        var message = '';
        switch ($scope.uploadType) {
          case 'gov':
            $scope.userinfo.personaldoc = data;
            message = 'Successfully uploaded "Government ID / TAX ID Number Document"';
            break;
          case 'bss':
            $scope.userinfo.bitcoinscreenshot = data;
            message = 'Successfully uploaded "Bitcoin Screen-Shot"';
            break;
          case 'pid':
            $scope.userinfo.photoid = data;
            message = 'Successfully uploaded "Your Photo Id"';
            break;
          case 'selfie':
            $scope.usermeta.selfie = data;
            message = 'Successfully uploaded "Selfie"';
            break;
          case 'govimage':
            $scope.usermeta.selfie = data;
            message = 'Successfully uploaded "Government Id"';
            break;
        }

        if (showMessage) {
          growl.addSuccessMessage(message, { ttl: 3000 });
        }
      };

      $scope.imageFileInfo = function (flowFile, event, flow, uploadType) {
        var fileReader = new FileReader();
        $scope.uploadType = uploadType;

        fileReader.readAsDataURL(flowFile.file);
        fileReader.onload = function (event) {
          var img = new Image;
          img.onload = $scope.resizeImage;
          img.src = event.target.result;

          $scope.setUploadInfo('data:image/png;base64', false);
        };

        return !!{ png: 1, gif: 1, jpg: 1, jpeg: 1 }[flowFile.getExtension()];
      };

      $scope.resizeImage = function () {
        var image = $scope.imageToDataUri(this);
        $scope.uploadDisable = true;
        Utilities.saveFile({ imageData: image, utype: 'upd', access: 'private' }, function (response) {
          if (!response.error) {
            $scope.setUploadInfo(response.imagePath, true);
          }
          $scope.uploadDisable = false;
        });
      };

      $scope.imageToDataUri = function (img) {
        // create an off-screen canvas
        var canvas = document.createElement('canvas'),
          ctx = canvas.getContext('2d');

        // set its dimension to target size
        canvas.width = img.width;
        canvas.height = img.height;

        // draw source image into the off-screen canvas:
        ctx.drawImage(img, 0, 0, img.width, img.height);

        // encode image to data-uri with base64 version of compressed image
        return canvas.toDataURL();
      };

      $scope.getISDCodes = function () {
        Utilities.getISDCodes(function (data) {
          $scope.isdCodes = data.isdCodes;
        });
      };

      $scope.getISDCodes();

      $scope.getCountries = function () {
        Utilities.getCountries(function (data) {
          $scope.countries = data.countries;
        });
      };

      $scope.getCountries();

      $scope.setCountryCode = function () {
        $scope.countries.forEach(function (country) {
          if (country.name === $scope.userinfo.country) {
            $scope.userinfo.countryCode = country.code;
            $scope.userinfo.country = country.name;
            $scope.userinfo.countryName = country.name;
          }
        });
      };

      $scope.selfieError = '';
      $scope.imageFileInfoSelfie = function (flowFile, event, flow, uploadType) {
        if (!!{ png: 1, gif: 1, jpg: 1, jpeg: 1 }[flowFile.getExtension()] && $scope.allowedFileSize(flowFile)) {
          var fileReader = new FileReader();
          $scope.uploadType = uploadType;

          fileReader.readAsDataURL(flowFile.file);
          fileReader.onload = function (event) {
            var img = new Image;
            img.onload = $scope.resizeImageSelfie;
            img.src = event.target.result;

            $scope.setUploadInfo('data:image/png;base64', false);
          };
          $scope.selfieError = '';
        }
        else {
          $scope.selfieError = 'Error : Invalid file type. We only accept JPG, JPEG, GIF, PNG of size 50KB to 5MB';
        }
      };

      $scope.resizeImageSelfie = function () {
        var image = $scope.imageToDataUri(this);
        $scope.uploadDisable = true;
        $uibModal.open({
          templateUrl: 'app/loader/loader.html',
          controller: 'UserprofileCtrl',
          scope: $scope,
          backdrop: 'static',
          keyboard: false
        });
        //growl.addInfoMessage("Upload in progress. Please wait..., Page will reload once uploading is done", {ttl: 10000});
        Usermeta.uploadKyc({ imageData: image, type: 'selfie' }, function (response) {
          if (response.error == false) {
            $scope.setUploadInfo(response.result.url, true);
            $scope.usermeta.showSelfie = true;
            $scope.usermeta.selfie = response.result.url;
            $window.location.reload();
            //growl.addSuccessMessage( "Photo uploaded Successfully", {ttl: 5000});
          } else {
            growl.addErrorMessage('Error : ' + response.message, { ttl: 5000 });
          }
          $uibModalStack.dismissAll();
          $scope.uploadDisable = false;
        });
      };

      $scope.docidError = '';
      $scope.imageFileInfoGovId = function (flowFile, event, flow, uploadType) {
        $scope.docidError = '';
        if (!$scope.usermeta.doctype.id_1 || $scope.usermeta.doctype.id_1 == 'NA') {
          $scope.docidError = 'Error : Please select any of Government ID type below.';
          return false;
        }
        if (!!{ png: 1, gif: 1, jpg: 1, jpeg: 1 }[flowFile.getExtension()] && $scope.allowedFileSize(flowFile)) {
          var fileReader = new FileReader();
          $scope.uploadType = uploadType;

          fileReader.readAsDataURL(flowFile.file);
          fileReader.onload = function (event) {
            var img = new Image;
            img.onload = $scope.resizeImageGovId;
            img.govtIDType = $scope.usermeta.doctype.id_1;
            img.src = event.target.result;

            $scope.setUploadInfo('data:image/png;base64', false);
            $scope.docidError = '';
          };
        }
        else {
          $scope.docidError = 'Error : Invalid file. We only accept JPG, JPEG, GIF, PNG of size 50KB to 5MB';
        }
      };

      $scope.resizeImageGovId = function () {
        var image = $scope.imageToDataUri(this);
        var govtIDType = this.govtIDType;
        $scope.uploadDisable = true;
        $uibModal.open({
          templateUrl: 'app/loader/loader.html',
          controller: 'UserprofileCtrl',
          scope: $scope,
          backdrop: 'static',
          keyboard: false
        });
        //growl.addInfoMessage('Upload, in progress . Please wait. Page will reload once uploading is done', {ttl: 10000});
        Usermeta.uploadKyc({ imageData: image, type: 'id_1', doctype: govtIDType }, function (response) {
          if (response.error == false) {
            $scope.setUploadInfo(response.result.url, true);
            $scope.usermeta.govimage = response.result.url;
            $scope.usermeta.showGovId = true;
            $window.location.reload();
            //growl.addSuccessMessage( 'Photo uploaded Successfully', {ttl: 5000});
          } else {
            growl.addErrorMessage('Error : ' + response.message, { ttl: 5000 });
          }
          $uibModalStack.dismissAll();
          $scope.uploadDisable = false;
        });
      };

      // Usermeta.get(function (kyc) {
      //   $scope.usermeta.govid = (kyc && kyc.result && kyc.result.user.govid || '');
      //   $scope.usermeta.taxid = (kyc && kyc.result && kyc.result.user.taxid || '');
      //   $scope.usermeta.selfie = (kyc && kyc.result && kyc.result.s3asset.selfie || '');
      //   $scope.usermeta.govimage = (kyc && kyc.result && kyc.result.s3asset.id_1 || '');
      //   $scope.usermeta.status = (kyc && kyc.result && kyc.result.kyc_flag || 'UNVERIFIED');
      //   $scope.usermeta.doctype = kyc && kyc.result && kyc.result.doctype;
      //   $scope.usermeta.assetsStatus = kyc && kyc.result && kyc.result.assetsStatus;
      //   $scope.usermeta.rejectReason = kyc && kyc.result && kyc.result.rejectReason;
      //   if ($scope.usermeta.selfie) {
      //     $scope.usermeta.showSelfie = true;
      //   }
      //   if ($scope.usermeta.govid) {
      //     $scope.usermeta.showGovId = true;
      //   }
      //   $scope.escapeSave = ($scope.usermeta.govid != '' && $scope.usermeta.taxid != '' && $scope.usermeta.selfie != '' && $scope.usermeta.govimage != '');
      // });

      //@TODO Remove Hardcoded urls from here
      $scope.getSignedUrl = function (url) {
        $http.post(ApiPath + '/api/kyc/get-signed-url', { url: url }).then(function (res) {
          if (res.data.error) {
            growl.addErrorMessage('Error : ' + res.data.message, { ttl: 5000 });
          } else {
            $window.open(res.data.result.url, '_blank');
          }
        }, function () {
          growl.addErrorMessage('Something went wrong. Please try again', { ttl: 5000 });
        });
      };

      $scope.saveGovId = function () {

        $scope.escapeSave = true;
        $http.post(ApiPath + '/api/kyc/save-govid', { govId: $scope.usermeta.govid }).then(function (res) {
          if (res.data.error) {
            growl.addErrorMessage('Error : ' + res.data.message, { ttl: 5000 });
          } else {
            growl.addSuccessMessage('Government ID updated Successfully', { ttl: 5000 });
          }
        }, function () {
          growl.addErrorMessage('Something went wrong. Please try again', { ttl: 5000 });
        });
      };

      $scope.saveTaxId = function () {
        $scope.escapeSave = true;
        var taxId = ($scope.usermeta.taxid || 'TEMP' + parseInt(Math.random() * 10000));
        $http.post(ApiPath + '/api/kyc/save-taxid', { taxId: taxId }).then(function (res) {
          if (res.data.error) {
            growl.addErrorMessage('Error : ' + res.data.message, { ttl: 5000 });
          }
          else {
            growl.addSuccessMessage('TAX ID updated Successfully', { ttl: 5000 });
          }
        }, function () {
          growl.addErrorMessage('Something went wrong. Please try again', { ttl: 5000 });
        });
      };

      $scope.showfile = function (file) {
        $http.post('/api/utilities/url', { file: file }).then(function (res) {
          $window.open(res.data.url);
        });
      };

      var sponsor = $scope.memberInfo.sponsor;
      if (!sponsor) {
        Utilities.getDefaultSponsorInfo(function (data) {
          User.getById({ reference: data.id }, function (_data) {
            $scope.sponsor = _data;
          });
        });
      } else {
        User.getById({ reference: sponsor }, function (data) {
          $scope.sponsor = data;
        });
      }

    }]);
