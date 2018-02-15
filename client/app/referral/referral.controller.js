'use strict';

angular.module('iCoinApp')
  .controller('ReferralCtrl', function ($scope, $stateParams, $location, $cookies, $cookieStore, Affiliates) {

    $cookieStore.put('refTarget', $stateParams.target);

    Affiliates.findByTarget({target: $stateParams.target}, function(referral) {

      $cookieStore.put('refUser', referral.refhash);
      $location.path('/signup/' + referral.refhash);
    });
  })
  .controller('LinkBannerReferralCtrl', function ($scope, $stateParams, $location, $cookies, $cookieStore, Affiliates) {

    var query = {memberid: $stateParams.target, linkid: $stateParams.source};
    // In order to support old referral links which are long
    if(typeof $stateParams.source !== 'undefined' && isNaN($stateParams.source)) {
      query = {target: $stateParams.target};
    }

    $cookieStore.remove('refTarget'); // Remove referral targent cookie
    $cookieStore.remove('refUser'); // Remove referral user cookie

    Affiliates.findByTarget(query, function(referral) {

      if(referral.error) {
        $location.path('/');
        return false;
      }

      $cookieStore.put('refTarget', referral.target);
      $cookieStore.put('refUser', referral.refhash);
      var refUserCode = encodeURIComponent(referral.refhash);
      $location.path('/signup/'+refUserCode);
    });

    /* update link visit start */
    if(query.memberid){
      var linkIndex = -1;
      var visitedLinks = $cookieStore.get('visitedRef') ? $cookieStore.get('visitedRef') : [];
      for(var i=0; i< visitedLinks.length; i++){
        if(visitedLinks[i].memberid === query.memberid && visitedLinks[i].linkid === query.linkid){
          linkIndex = i;
          break;
        }
      }
      if(linkIndex === -1){
        Affiliates.updateVisit({username : query.memberid, uniqueid : query.linkid }, function() {
          visitedLinks.push(query);
          $cookieStore.put('visitedRef', visitedLinks);
          console.log('Link is visited now');
        }, function(err){
          console.log('Unable to update visit'+err);
        });
      }
      else{
        console.log('Link is already visited');
      }
    }
    /* update link visit end */
  });
