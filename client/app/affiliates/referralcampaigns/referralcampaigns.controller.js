'use strict';

angular.module('iCoinApp')
  .controller('AffiliatesCtrl', function ($scope,$rootScope, $confirm, $window, Affiliates, Utilities, $uibModal, $uibModalStack, Uploadmedia, ApiPath) {
    $scope.affiliates = {
      '_main': '',
      'others': []
    };
    $scope.referralFormUrl  = 'app/affiliates/referalform.html';
    $scope.showReferralForm = false;
    $scope.newAffilate      = {title: ''};
    $scope.landingPages     = [];
    $scope.currentPage      = 1;
    var _baseOrigin = $window.location.origin;

    $scope.closeModal = function() {
      $uibModalStack.dismissAll();
    };

    $scope.loadAffiliates = function() {
      $scope.affiliates = {
        '_main': '',
        'others': []
      };

      Affiliates.get({page: $scope.currentPage}, function(_affiliates) {
        // /var __origin = $window.location.origin + '/refl';
        if(_affiliates.data.length === 0) {
          Affiliates.addDefault(function(defAffilate) {
            $scope.affiliates._main = defAffilate;
            $scope.affiliates._main.linkurl = defAffilate.landingpage + defAffilate.userfriendlyurl;

            $scope.linkURI   = defAffilate.landingpage+defAffilate.userfriendlyurl;
            $scope.signupURI = defAffilate.landingpage+'/'+defAffilate.memberid+'/'+defAffilate.uniqueid;

            // if(!defAffilate.default) {
            //   $scope.signupURI = defAffilate.landingpage+'/'+defAffilate.memberid+'/'+defAffilate.uniqueid;
            // }
          });
        }
        else {
          var affilateList = _affiliates.data;
          affilateList.forEach(function(affilate) {
            if(affilate.linktype === 'default') {
              $scope.affiliates._main = affilate;
              $scope.affiliates._main.linkurl = affilate.landingpage + affilate.userfriendlyurl;
              $scope.linkURI   = affilate.landingpage+affilate.userfriendlyurl;
              $scope.signupURI = affilate.landingpage+'/'+affilate.memberid+'/'+affilate.uniqueid;
              /*if(!affilate.default) {
                $scope.signupURI = affilate.landingpage+'/'+affilate.memberid+'/'+affilate.uniqueid;
              }*/
            }
            else {
              var __affilate = affilate;
              __affilate.linkurl = __affilate.landingpage + __affilate.userfriendlyurl;

              if(!__affilate.defaultLink){
                __affilate.signupURI = __affilate.landingpage+'/'+__affilate.memberid+'/'+__affilate.uniqueid;
              }
              if(__affilate.linktype === 'banner'){
                __affilate.linkurl = _baseOrigin+'/refb/'+__affilate.memberid+'/'+__affilate.uniqueid;
              }
              $scope.affiliates.others.push(__affilate);
            }
          });
        }
        $scope.viewLimit = _affiliates.limit;
        $scope.totalPages = _affiliates.rows;
      });
    };

    $scope.getLandingPages = function() {        
       Uploadmedia.getsaveMedia({
            mediauploadfor: 'Landing Pages'
        }, function(data) {
            $scope.landingPages = (data.data);
            $scope.landingPages.forEach(function(pg) {
            $scope.newAffilate.landingpage = pg.path;
            if(!pg.default){
              $scope.newAffilate.default = pg.default;
            }
        });
        });
    };

    $scope.showCreateReferralForm = function() {
      $scope.showReferralForm = true;
    };

    $scope.createReferral = function(form) {
      if(form.$valid) {
        $scope.newAffilate.defaultLink = true;
        var _location = $window.location;
        /*if($scope.newAffilate.landingpage === _location.protocol+'//'+_location.host+'/refl') {*/
        if($scope.newAffilate.landingpage === ApiPath+'/refl') {  
          $scope.newAffilate.defaultLink = false;
        }
        Affiliates.create($scope.newAffilate, function(data) {
          if(typeof data._id !== 'undefined' && data._id !== '' && data._id != null) {
            $scope.showReferralForm = false;
            $scope.loadAffiliates();
            angular.element('#myModal .close').trigger('click');
          }
        });
      }
    };

    $scope.deleteAffilation = function(key) {
      $confirm({text: 'Are you sure you want to delete?', title: 'Delete Referral', ok: 'Yes', cancel: 'No'})
      .then(function() {
        Affiliates.removeAffilate({
          id: $scope.affiliates.others[key]._id
        }, function() {
          $scope.loadAffiliates();
        });
      });
    };

    $scope.loadAffiliates();
    $scope.getLandingPages();
  });