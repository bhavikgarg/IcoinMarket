'use strict';

angular.module('iCoinApp')
  .controller('AffiliatesDefaultCtrl', function ($scope, $confirm, $window, $location,$uibModalStack, Affiliates, Utilities,Uploadmedia) {
    $scope.linkURI    = '';
    $scope.leadPages  = [];
    $scope.signupPage  = [];
    $scope.affiliates = {
      '_main': {}
    };

    $scope.closeModal = function() {
      $uibModalStack.dismissAll();
    };

    $scope.getLandingPages = function() {        
        Uploadmedia.getsaveMedia({
            mediauploadfor: 'Landing Pages'
        }, function(data) {
            $scope.leadPages = (data.data);
        });
    };

     $scope.getLinkurl = function() {
        Affiliates.get(function(_affiliates) {
          if(_affiliates.data.length === 0) {
            Affiliates.addDefault(function(defAffilate) {
              $scope.affiliates._main = defAffilate;
              $scope.affiliates._main.linkurl = defAffilate.landingpage + defAffilate.userfriendlyurl;
              $scope.linkURI   = defAffilate.userfriendlyurl;
              $scope.signupURI = '/'+defAffilate.memberid+'/'+defAffilate.uniqueid;
            });
          }
          else {
            var affilateList = _affiliates.data;
            affilateList.forEach(function(affilate) {
              if(affilate.linktype === 'default') {
                $scope.affiliates._main = affilate;

                $scope.affiliates._main.linkurl = affilate.landingpage + affilate.userfriendlyurl;
                $scope.linkURI   = affilate.userfriendlyurl;
                $scope.signupURI = '/'+affilate.memberid+'/'+affilate.uniqueid;
              }
            });

            if(!$scope.affiliates._main.linkurl || ($scope.affiliates._main.linkurl && $scope.affiliates._main.linkurl === '')) {
              Affiliates.addDefault(function(defAffilate) {
                $scope.affiliates._main = defAffilate;

                $scope.affiliates._main.linkurl = defAffilate.landingpage + defAffilate.userfriendlyurl;
                $scope.linkURI   = defAffilate.userfriendlyurl;
                $scope.signupURI = '/'+defAffilate.memberid+'/'+defAffilate.uniqueid;
              });
            }
          }
        });
      };

    $scope.setLandingPage = function(key) {    
      var referral = $scope.affiliates._main;
      var leadPage = $scope.leadPages[key];
      Affiliates.update({landingpage: leadPage.fileurl, defaultLink:leadPage.defaultLink, _id: referral._id}, function(resp) {
        if(resp._id && resp._id === referral._id) {
           $scope.getLandingPages();
           $scope.getLinkurl();
        }
      });
    };
    $scope.getLandingPages();
    $scope.getLinkurl();
  });