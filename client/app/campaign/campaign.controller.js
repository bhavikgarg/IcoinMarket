'use strict';

angular.module('iCoinApp')
  .controller('CampaignViewCtrl', function($scope, Auth){
    $scope.username = Auth.getCurrentUser();
  })
  .controller('CampaignTextViewCtrl', function ($scope, $http, $stateParams, Utilities, Campaign, Auth, User, PacksInfo, $location, $state, $window, $uibModal, $uibModalStack, $interval, $timeout, $rootScope, $cookies, SharePriorityOptions, LikePriorityOptions, growl) {
    $scope.items ='';
    $scope.skip=0;
    $scope.sharecount=0;
    $scope.isDisabled = true;
    $scope.loadingAds = false;

    $scope.dailylimit = 0;
    $scope.viewed     = 0;
    $scope.pending    = 0;
    //var startTimer;
    // two different priority options, because what if they are different.
    $scope.LikePriorityOptions=LikePriorityOptions;
    $scope.SharePriorityOptions = SharePriorityOptions;
    $scope.purchaseInfo = {
            gold: {},
            silver: {}
          };
    $scope.campaignType = $stateParams.type;
    $scope.getStyle =  $scope.campaignType === 'text'?'all':'none';

    //  window.fbAsyncInit = function() {
    //   window.FB.Event.subscribe('edge.create', function(href,widget) {
    //       console.log('you  have successfully liked the post!!');
    //       growl.addSuccessMessage("You have successfully liked the post", {ttl: 5000});
    //       var id = '',viewTime='',dayLimit='',viewed='';
    //
    //       if(widget){
    //         id = (widget.attributes.getNamedItem('data-custom-id') ? widget.attributes.getNamedItem('data-custom-id').value : '');
    //         viewTime = (widget.attributes.getNamedItem('data-custom-viewtime') ? widget.attributes.getNamedItem('data-custom-viewtime').value : '');
    //       }
    //         if($scope.items.indexOf(id) > -1) {
    //           return false;
    //           }
    //           Campaign.updateView({
    //             _id: id,
    //             type:'fblike',
    //             viewcount: parseInt(viewTime)
    //           });
    //           PacksInfo.getPurchase('gold', function(data) {
    //             $scope.purchaseInfo['gold'] = data;
    //           });
    //
    //      $scope.items=$scope.items+','+id;
    //      angular.element('#'+id).addClass('fadeout');
    //   });
    //
    //    window.FB.Event.subscribe('edge.remove', function(response) {
    //       growl.addErrorMessage( "You should not unlike the post" , {ttl: 5000} );
    //       console.log('There should not be unlike !!');
    //    });
    // };

    $scope.campaignText = $scope.campaignType == 'fblike'?'Facebook Fanpage Like':$scope.campaignType === 'fbshare'?'Facebook Share':'Text';

    $scope.remainingTime = function() {
      if($scope.viewed >=  10){
        Campaign.lastViewTime({
          type: 'text',
          userid: $scope.username._id,
          limit: 12
        }, function(data) {
          if(!data.error) {
            var viewTime    = new Date(data.viewTime),
                currentTime = new Date();
            if(viewTime.getTime() < currentTime.getTime()) {
              User.updateExpiryTime({time:data.viewTime}, function(data){
                if(data.success == 1){
                  $scope.startTimer();
                }
              });
            }

            if(viewTime.getTime() > currentTime.getTime()) {
              $scope.startTimer();
            }
          }
        });
      }else{
        $scope.startTimer();
      }
    };

    $scope.timeDiffSec = {};
    $scope.startTimer = function() {
      if($scope.pending === 0){
        User.getExpiryTime(function(data) {
          var nextViewTime = moment(data.expiryTime),
              currentTime  = moment();
          $rootScope.memberInfo = data;  // Updated as user just finish watching ads
          $timeout(function() {
            $scope.timeDiffSec.seconds  = parseInt(nextViewTime.diff(currentTime, 'seconds'));
            $scope.$broadcast('timer-start');
          }, 100);
        });
      }
    };

    $scope.viewadd = function(time, url, id, type) {
      if (type !=='text'){
        return false;
      }

      $scope.campaignId = id;
      $uibModal.open({
        templateUrl: 'app/campaign/campaign-preview.html',
        controller: 'CampaignPreviewCtrl',
        size: 'lg',
        scope: $scope,
        windowClass: 'large-width',
        backdrop: 'static',
        keyboard: false
      });

      // $timeout(function() {
      //   $scope.getdata();
      // }, 1000);
    };

    $scope.closeallmodals = function() {
      $uibModalStack.dismissAll();
    };


    $scope.getdata = function(viewmore) {

      if(viewmore==='viewmoreads' || viewmore==='text')
      {
        $scope.skip=0;
      }
      else
      {
        $scope.skip=$scope.skip+12;
      }
      $scope.loadingAds = true;
      $scope.campaigns = Campaign.getByType({
    	  type: $scope.campaignType,
        limit: 12,
        skip: $scope.skip
      }, function(data) {
        $scope.loadingAds = false;
        $scope.campaign   = data.campaigns;
        $scope.dailylimit = data.daylimit;
        $scope.viewed     = data.viewed;
        if(data.daylimit && data.viewed){
          $scope.pending = (($scope.viewed > $scope.dailylimit) ? 0 : ($scope.dailylimit - $scope.viewed));
        }
        if(!data.viewed || data.viewed == 0) {
          $scope.pending = $scope.dailylimit;
        }

        if($scope.viewed >= 10 && $scope.pending === 0) {
          $scope.remainingTime();
        }else{
          $scope.startTimer();
        }
      });
    };
   $scope.shareButton = function(id,url,viewTime){
     if (FB) {
       FB.ui({
         method: 'share',
         href : url,
         display : 'popup'
       }, function(response){

            if(id === 'preview') {
              return false;
            }
            if(response && typeof response === 'object'){
              growl.addSuccessMessage( 'You have successfully shared the post' , {ttl: 5000} );
              if($scope.items.indexOf(id) > -1) {
                return false;

              }
              Campaign.updateView({
                 _id: id,
                 type:'fbshare',
                 viewcount: viewTime
               }, function(res){
                 if(res.err){
                   var $message = $('#message');
                     $message.html(' ');
                     $message.html(res.err);
                      angular.element('#alertpopup').modal('show');
                 }
               });
               PacksInfo.getPurchase('gold', function(data) {
              	  $scope.purchaseInfo.gold = data;
               });

               $scope.items=$scope.items+','+id;
               $scope.sharecount=$scope.sharecount+1;
               //document.getElementById(id).className += ' fadeout';
               angular.element('#'+id).addClass('fadeout');
               if($scope.sharecount>=12)
               {
                  $scope.getdata('viewmoreads');
                  $scope.sharecount=0;
               }

            } else {
              growl.addErrorMessage('Error in sharing the post' , {ttl: 5000} );
            }

      });
    }
    else {
      {
        console.log('Please wait till facebook sdk load');
      }
    }
   };

   $scope.getdata('text');
  })
  .controller('CampaignPreviewCtrl', function($scope, $sce, $interval, $timeout, $location, $state, Campaign, PacksInfo, Auth){

    var stop;
    $scope.username     = Auth.getCurrentUser();
    $scope.campaign     = {};
    $scope.viewTime     = 0;
    $scope.viewUrl      = '';
    $scope.showNext     = false;
    $scope.showTimer    = false;
    $scope.buttonText   = 'Next Add';
    $scope.headingText  = 'View Campaigns';
    $scope.purchaseInfo = {
      gold: {},
      silver: {}
    };

    $scope.loadCampaign = function(campaignId) {

      Campaign.get({
        id: campaignId
      }, function(data) {
        $scope.campaign = data;
        $scope.viewed = $scope.viewed + 1;
        if(data) {
          var viewUrl      = data.viewUrl, _viewUrl = '';
          $scope.viewTime  = (data.viewTime ? parseInt(data.viewTime) : 0);
          $scope.viewTime += (data.extraTime ? parseInt(data.extraTime) : 0);
          $scope.tkViewUrl = '/api/campaigns/show-add/' + campaignId;

          viewUrl = ((viewUrl && viewUrl.trim() !== '') ? viewUrl.split('://') : []);
          if(viewUrl.length === 2) {
            if(viewUrl[0].toLowerCase() === 'http') {
              _viewUrl = 'http://'+viewUrl[1];
            }
            else if(viewUrl[0].toLowerCase() === 'https') {
              _viewUrl = 'https://'+viewUrl[1];
            }
            else {
              _viewUrl = 'http://'+viewUrl[1];
            }
          }
          else {
            viewUrl = viewUrl.split(':/');
            if(viewUrl.length === 2) {
              _viewUrl = 'http://'+viewUrl[1];
            }
            else {
              _viewUrl = 'http://login.icoinmarket.com';
            }
          }

          $scope.viewUrl = $sce.trustAsResourceUrl(_viewUrl);
        }
      });
    };

    $scope.startViewCounter = function() {
      $scope.showTimer = true;
      stop = $interval(function () {
        if($scope.viewTime == 0) {
          $scope.showTimer = false;
          $interval.cancel(stop);
          $scope.onViewComplete();
        }
        else {
          $scope.viewTime--;
        }
      }, 1000);
    };

    $timeout($scope.startViewCounter, 2000);

    $scope.onViewComplete = function() {

      Campaign.updateView({
        _id: $scope.campaignId, //$stateParams.id,
        viewcount: $scope.campaign.viewTime,
        daylimit : $scope.dailylimit,
        viewed : $scope.viewed,
        type : $scope.campaign.type == 'text'? 'view' : $scope.campaign.type
      });


      $scope.showNext = true;
    };

    $scope.showNextCampaign = function() {
      $scope.closeallmodals();
      $state.reload();
    };

    $scope.loadCampaign($scope.campaignId,$scope.campaignType);
  })
  .controller('TaskCtrl', function($scope, Tasks){

    Tasks.getUserTaks(function(info) {
      $scope.tasks = info.data;
    });

  })
  .controller('TaskControlDetail', function($scope, $stateParams, $location, Tasks){
    $scope.postUrl = '';
    $scope.username = '';
    $scope.userid = '';

    Tasks.getItem({id: $stateParams.taskid}, function(data) {
      $scope.task = data;
    });

    $scope.currentValue = function(obj){
      $scope.postUrl = obj.postUrl;

      if(obj.postUrl.indexOf('data-href="') > -1) {
        $scope.check = obj.postUrl.split('cite="')[1].split('"')[0];
        $scope.post = obj.postUrl.split('data-href="')[1].split('"')[0];

        // get usename and userid
        $scope.username = $scope.post.split('.com/')[1].split('/')[0];
        $scope.userid = $scope.post.split('.com/')[1].split('/')[2];

        if($scope.check==$scope.post) {
          $scope.postUrl = $scope.post;
        } else {
          $scope.postUrl = $scope.postUrl.replace($scope.postUrl, '');
        }

      } else {
        $scope.postUrl = $scope.postUrl.replace($scope.postUrl, '');
      }
    };

    $scope.showError = '';
    $scope.submit = function() {

      Tasks.addUserDoneTask({
        taskid: $scope.task._id,
        exuserid: $scope.userid,
        exusername: $scope.username,
        exposturl: $scope.postUrl
      }, function(data) {

        if(data.error) {

          $scope.showError = data.error;
        }
        else {

          $location.path('/tasks');
        }
      });
    };

  });
