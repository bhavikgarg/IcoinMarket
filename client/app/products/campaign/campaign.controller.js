'use strict';

angular.module('iCoinApp')
  .constant('PriorityOptions', [
    {'key': 15, name: 'Priority High'},
    {'key': 10, name: 'Priority Medium'},
    {'key': 5, name: 'Priority Low'}
  ])
  .constant('SharePriorityOptions', [
    {'key': 40, name: 'Priority High'},
    {'key': 30, name: 'Priority Medium'},
    {'key': 20, name: 'Priority Low'}
  ])
  .constant('LikePriorityOptions', [
    {'key': 40, name: 'Priority High'},
    {'key': 30, name: 'Priority Medium'},
    {'key': 20, name: 'Priority Low'}
  ]).controller('CampaignCtrl', function($scope, $location,$stateParams, Campaign, PriorityOptions, Auth) {


    $scope.username = Auth.getCurrentUser();

    $scope.isActive = function(route) {
      return route === $location.path();
    };

    if($stateParams.id) {
        Campaign.get({id: $stateParams.id}, function(data) {
          $scope.type = data.type.toLowerCase();
        });
      }

  })
  .controller('ListCampaignCtrl', function($scope, $location, Campaign, PriorityOptions, Auth) {
    $scope.username = Auth.getCurrentUser();
    $scope.currentPage = 1;
    $scope.totalPages  = 0;
    $scope.PriorityOptions=PriorityOptions;
    $scope.pages = 1;
    $scope.error = '';

    $scope.loadPage = function() {
      Campaign.get({page: $scope.currentPage}, function(info) {
        $scope.error = '';
        $scope.campaigns  = info.data;
        $scope.totalPages = info.rows;
        $scope.viewLimit  = info.limit;
        if( $scope.totalPages > 25) {
          $scope.pages = Math.ceil($scope.totalPages/25);
        }
      });
    };

   $scope.CompaignCreditsHistory = function(campaign){
     if (campaign.type === 'text'){
      return false;
     }
      
     $scope.model_campaign_id = campaign.id;
	   Campaign.getCampaignViews({
		   id: campaign.id
         }, function(resp) {
           console.log(resp.data);
           $scope.views = resp.data;
           angular.element('#CampaignCreditsmodel').modal('show');
         });
    };

    $scope.isActive = function(route) {
      return route === $location.path();
    };

    // Go to Specific Page
    $scope.updatePage = function() {
      if($scope.getPage) {
        if($scope.getPage > $scope.pages) {
          $scope.error = 'Page not found';
        }else {
          $scope.currentPage = $scope.getPage;
          $scope.loadPage();
        }
      }
    };

    $scope.loadPage();
  })
  .controller('TextCampaign', function($scope, $location, $stateParams, Campaign, PriorityOptions, Utilities, Purchase){

    $scope.isActive = function(route) {
      return route === $location.path();
    };

    $scope.campaignType ='';
    $scope.canEditCredits = true;
    $scope.showError = false;
    $scope.errorMessage = '';
    $scope.templateUrl = 'app/products/campaign/textCampaign.html';
    $scope.priorityOptions = PriorityOptions;
    // $scope.genres = [];
    Campaign.creditsInfo(function(creditInfo) {
      $scope.credits = creditInfo;
    });

    // Utilities.getGenre(function(data) {
    //   $scope.genres = data.genres;
    // });

    $scope.campaign = {
      title: '',
      url: '',
      description: '',
      priority: '15',
      quality: '',
      credits: '',
      processCredits : 0
    };

    if($stateParams.id) {
      Campaign.get({id: $stateParams.id}, function(data) {
        $scope.campaign = {
          title: data.title,
          url: data.viewUrl,
          description: data.description,
          priority: parseInt(data.priority),
          quality: data.extraTime,
          credits: data.credits,
          processCredits : data.credits
        };
        // $scope.categories = data.categories;
        $scope.canEditCredits = data.allowEdit;
        // if(data.categories[0] === -1) {
        //   $scope.categories = [];
        // }
        $scope.applyValidation();
      });
    }

    $scope.imageFileInfo = function(flowFile, event, flow, key) {
      $scope.updateKey = key;
      var fileReader = new FileReader();
      fileReader.readAsDataURL(flowFile.file);
      fileReader.onload = function (event) {
        var img = new Image;
        img.onload = $scope.resizeImage;
        img.src = event.target.result;
      };

      return !!{png:1,gif:1,jpg:1,jpeg:1}[flowFile.getExtension()];
    };

    $scope.resizeImage = function() {
      $scope.purchaseReceipt = '';
      Utilities.saveFile({imageData: this.src}, function(response) {
        if(!response.error) {
          $scope.campaign.imagepath = response.imagePath;
        }
      });
    };

    $scope.paymentRequestToken = '';
    $scope.preview = function() {
      var userSilverCoins = ($scope.credits.silverCoins + parseInt($scope.campaign.processCredits));
      Purchase.getValidToken({reqType: 'payment'}, function(_token) {
        if(_token.error) {
          $scope.showError = true;
          $scope.errorMessage = _token.message;
        }
        else {
          $scope.paymentRequestToken = _token.reqtoken;
          $scope.showError = false;

          var totalTime  = parseInt($scope.campaign.priority); //$scope.credits.minViewTime;
          var userNeedCr = parseInt($scope.campaign.credits);
          var viewUsers  = (userNeedCr > 0 ? Math.ceil($scope.campaign.credits / totalTime) : 0);
          console.log(viewUsers);
          if(userNeedCr === 0 || isNaN(userNeedCr) || userNeedCr <= userSilverCoins) {
            if(viewUsers === 0 || (viewUsers * totalTime) === $scope.campaign.credits) {
              var _quality  = parseInt($scope.campaign.quality);
              var dtcredits = ((!isNaN(_quality) && _quality > 0 && viewUsers > 0) ? (viewUsers * (_quality/$scope.credits.dtCreditUnit)) : 0);
              if(dtcredits > 0 && !isNaN(_quality) && _quality > 0 && $scope.credits.dtCredits < dtcredits) {
                $scope.errorMessage = 'You need to purchase DT-Credits or leave blank quality field. You can add quality by editing campaign; after campaign is created.';
                $scope.showError = true;
              }
              // else if ($scope.campaign.url.indexOf('http://') == -1) {
              //   $scope.showError = true;
              // }
              else {
                $scope.showError = false;
                $scope.templateUrl = 'app/products/campaign/success.html';
              }
            }
            else {
              $scope.errorMessage = 'You need to assign either ' + ((viewUsers - 1) * totalTime) + ' OR ' + (viewUsers * totalTime) + ' credits for this campaign.';
              $scope.showError = true;
            }
          }
          else {
            $scope.errorMessage = 'You have only ' + $scope.credits.silverCoins + ' credits, Please purchase more "Silver Coins" or assign credits later on';
            $scope.showError = true;
          }
        }
      });
    };

    $scope.edit = function(){
      $scope.templateUrl = 'app/products/campaign/textCampaign.html';
    };

    // $scope.categories = [];
    $scope.applyValidation = function() {
      // var _len = $scope.genres.length;
      // for(var idx=0; idx < _len; idx++) {
      //   $scope.genres[idx].genreDisable = false;
      // }

      // if($scope.categories.length >= 3) {
      //   for(var idx=0; idx < _len; idx++) {
      //     $scope.genres[idx].genreDisable = ($scope.categories.indexOf($scope.genres[idx].key) == -1);
      //   }
      // }
    };

    $scope.save = function(){
      $scope.campaign = {
        name: $scope.campaign.title,
        viewurl: $scope.campaign.url,
        description: $scope.campaign.description,
        priority: parseInt($scope.campaign.priority),
        quality: $scope.campaign.quality,
        credits: $scope.campaign.credits,
        campaigntype: 'text',
        // categories: $scope.categories,
        imagepath: $scope.campaign.imagepath,
        reqToken: $scope.paymentRequestToken,
        processCredits : $scope.campaign.processCredits
      };

      $scope.campaign.title = $scope.campaign.name;
      $scope.campaign.url = $scope.campaign.viewurl;

      $scope.saveError = '';

      if($stateParams.id) {
        // Edit Campaign
        $scope.campaign._id = $stateParams.id;
        Campaign.update($scope.campaign, function(data) {
            $scope.saveError = data.message;
            if(typeof data._id !== 'undefined') {
              $location.url('/list-campaign');
            }
            else {
              $scope.saveError = data.message;
            }
          });
        // if($scope.campaign.categories.length < 3) {
        //   $scope.saveError = 'Please select at least 3 categories';
        //   $scope.campaign.title = $scope.campaign.name;
        //   $scope.campaign.url = $scope.campaign.viewurl;
        // }
        // else {
        //   Campaign.update($scope.campaign, function(data) {
        //     $scope.saveError = data.message;
        //     if(typeof data._id !== 'undefined') {
        //       $location.url('/list-campaign');
        //     }
        //     else {
        //       $scope.saveError = data.message;
        //     }
        //   });
        // }
      }
      else {
        // Saving Text Campaign
        Campaign.create($scope.campaign, function(data) {
            if(data.error == true) {
              $scope.saveError = data.message;
            }
            else {
              if(typeof data.id !== 'undefined') {
                $location.url('/list-campaign');
              }
              else {
                $scope.saveError = data.error;
              }
            }
          });
        // if($scope.campaign.categories.length < 3) {
        //   $scope.saveError = 'Please select at least 3 categories';
        //   $scope.campaign.title = $scope.campaign.name;
        //   $scope.campaign.url = $scope.campaign.viewurl;
        // }
        // else {
        //   Campaign.create($scope.campaign, function(data) {
        //     if(data.error == true) {
        //       $scope.saveError = data.message;
        //     }
        //     else {
        //       if(typeof data.id !== 'undefined') {
        //         $location.url('/list-campaign');
        //       }
        //       else {
        //         $scope.saveError = data.error;
        //       }
        //     }
        //   });
        // }
      }
    };

    // Validate URL is visible in IFrame or Not
    $scope.validateIframeLoading = function() {
      if(typeof $scope.campaign.url === 'undefined' || $scope.campaign.url === '') {
        $scope.showError = true;
        $scope.errorMessage = 'Please enter full url';
      }
      else {
        Campaign.validateUrl({loadUrl: $scope.campaign.url}, function(resp) {
          $scope.errorMessage = '';
          $scope.showError = false;

          if(!resp.valid) {
            $scope.errorMessage = resp.error;
            $scope.showError = true;
          }
        });
      }
    };
  })
  .controller('FacebookLikeCampaign', function($scope, $location, $stateParams, Campaign, Purchase, Utilities,LikePriorityOptions){

    $scope.isActive = function(route) {
      return route === $location.path();
    };
    $scope.campaignType = '';
    $scope.canEditCredits = true;
    $scope.showErrorUrl = false;
    $scope.showErrorCoins = false;
    $scope.errorMessageUrl = '';
    $scope.errorMessageCoins = '';
    $scope.templateUrl = 'app/products/campaign/facebookLikeCampaign.html';
    $scope.priorityOptions = LikePriorityOptions;
    // $scope.genres = [];
    Campaign.creditsInfo(function(creditInfo) {
      $scope.credits = creditInfo;
    });

    // Utilities.getGenre(function(data) {
    //   $scope.genres = data.genres;
    // });

    $scope.campaign = {
      title: '',
      url: '',
      description: '',
      priority: '40',
      quality: '',
      credits: ''
    };

    if($stateParams.id) {
      Campaign.get({id: $stateParams.id}, function(data) {
        $scope.campaign = {
          title: data.title,
          url: data.viewUrl,
          description: data.description,
          priority: data.priority,
          quality: data.extraTime,
          credits: data.credits
        };
        // $scope.categories = data.categories;
        $scope.canEditCredits = (data.expirecredits > 0);
        // if(data.categories[0] === -1) {
        //   $scope.categories = [];
        // }
        $scope.applyValidation();
      });
    }

    $scope.imageFileInfo = function(flowFile, event, flow, key) {
      $scope.updateKey = key;
      var fileReader = new FileReader();
      fileReader.readAsDataURL(flowFile.file);
      fileReader.onload = function (event) {
        var img = new Image;
        img.onload = $scope.resizeImage;
        img.src = event.target.result;
      };

      return !!{png:1,gif:1,jpg:1,jpeg:1}[flowFile.getExtension()];
    };

    $scope.resizeImage = function() {
      $scope.purchaseReceipt = '';
      Utilities.saveFile({imageData: this.src}, function(response) {
        if(!response.error) {

          $scope.campaign.imagepath = response.imagePath;
        }
      });
    };

    $scope.validateCoins = function(){
        var totalTime  = parseInt($scope.campaign.priority); //$scope.credits.minViewTime;
        var userNeedCr = parseInt($scope.campaign.credits);
        var viewUsers  = (userNeedCr > 0 ? Math.ceil($scope.campaign.credits / totalTime) : 0);

        if(userNeedCr === 0 || isNaN(userNeedCr) || userNeedCr <= $scope.credits.goldCoins) {
          if(viewUsers === 0 || (viewUsers * totalTime) === $scope.campaign.credits) {
        	  $scope.errorMessageCoins = '';
        	    $scope.showErrorCoins = false;
          }
          else {
            $scope.errorMessageCoins = 'You need to assign either ' + ((viewUsers - 1) * totalTime) + ' OR ' + (viewUsers * totalTime) + ' credits for this campaign.';
            $scope.showErrorCoins = true;
          }
        }
        else {
          $scope.errorMessageCoins = 'You have only ' + $scope.credits.goldCoins + ' credits, Please purchase more "Gold Coins" or assign credits later on';
          $scope.showErrorCoins = true;
        }
    };

    $scope.paymentRequestToken = '';
    $scope.preview = function() {
      Purchase.getValidToken({reqType: 'payment'}, function(_token) {
        if(_token.error) {
          $scope.showError = true;
          $scope.errorMessage = _token.message;
        }
        else {
          $scope.paymentRequestToken = _token.reqtoken;
          $scope.showError = false;
          $scope.campaignType = 'fblike';
           var totalTime  = parseInt($scope.campaign.priority); //$scope.credits.minViewTime;
           var userNeedCr = parseInt($scope.campaign.credits);
           var viewUsers  = (userNeedCr > 0 ? Math.ceil($scope.campaign.credits / totalTime) : 0);

           if(userNeedCr === 0 || isNaN(userNeedCr) || userNeedCr <= $scope.credits.goldCoins) {
             if(viewUsers === 0 || (viewUsers * totalTime) === $scope.campaign.credits) {
               var _quality  = parseInt($scope.campaign.quality);
               var dtcredits = ((!isNaN(_quality) && _quality > 0 && viewUsers > 0) ? (viewUsers * (_quality/$scope.credits.dtCreditUnit)) : 0);
               if(dtcredits > 0 && !isNaN(_quality) && _quality > 0 && $scope.credits.dtCredits < dtcredits) {
                 $scope.errorMessage = 'You need to purchase DT-Credits or leave blank quality field. You can add quality by editing campaign; after campaign is created.';
                 $scope.showError = true;
               }
               // else if ($scope.campaign.url.indexOf('http://') == -1) {
               //   $scope.showError = true;
               // }
               else {
                 $scope.showError = false;
                 $scope.templateUrl = 'app/products/campaign/success.html';
               }
             }
             else {
               $scope.errorMessage = 'You need to assign either ' + ((viewUsers - 1) * totalTime) + ' OR ' + (viewUsers * totalTime) + ' credits for this campaign.';
               $scope.showError = true;
             }
           }
           else {
             $scope.errorMessage = 'You have only ' + $scope.credits.goldCoins + ' credits, Please purchase more "Gold Coins" or assign credits later on';
             $scope.showError = true;
           }
        }
      });
    };

    $scope.edit = function(){
      $scope.templateUrl = 'app/products/campaign/facebookLikeCampaign.html';
    };

    $scope.categories = [];
    $scope.applyValidation = function() {
      // var _len = $scope.genres.length;
      // for(var idx=0; idx < _len; idx++) {
      //   $scope.genres[idx].genreDisable = false;
      // }

      // if($scope.categories.length >= 3) {
      //   for(var idx=0; idx < _len; idx++) {
      //     $scope.genres[idx].genreDisable = ($scope.categories.indexOf($scope.genres[idx].key) == -1);
      //   }
      // }
    };

    $scope.save = function(){

      $scope.campaign = {
        name: $scope.campaign.title,
        viewurl: $scope.campaign.url,
        description: $scope.campaign.description,
        priority: parseInt($scope.campaign.priority),
        quality: $scope.campaign.quality,
        credits: $scope.campaign.credits,
        campaigntype: 'fblike',
        // categories: $scope.categories,
        imagepath: $scope.campaign.imagepath,
        reqToken : $scope.paymentRequestToken
      };

      $scope.saveError = '';

      if($stateParams.id) {
        // Edit Campaign
        $scope.campaign._id = $stateParams.id;
        if($scope.campaign.categories.length < 3) {
          $scope.saveError = 'Please select at least 3 categories';
          $scope.campaign.title = $scope.campaign.name;
          $scope.campaign.url = $scope.campaign.viewurl;
        }
        else {
          Campaign.update($scope.campaign, function(data) {

            if(typeof data._id !== 'undefined') {
              $location.url('/list-campaign');
            }
          });
        }
      }
      else {
         Campaign.create($scope.campaign, function(data) {

            if(typeof data.id !== 'undefined') {
              $location.url('/list-campaign');
            }
          });
        // Saving Facebook like  Campaign
        // if($scope.campaign.categories.length < 3) {
        //   $scope.saveError = 'Please select at least 3 categories';
        //   $scope.campaign.title = $scope.campaign.name;
        //   $scope.campaign.url = $scope.campaign.viewurl;
        // }
        // else {

        //   Campaign.create($scope.campaign, function(data) {

        //     if(typeof data.id !== 'undefined') {
        //       $location.url('/list-campaign');
        //     }
        //   });
        // }
      }
    };
   //End saving compaign

    // Validate URL is visible in IFrame or Not
    $scope.validateIframeLoading = function() {

    	$scope.showErrorUrl = false;
      if($scope.campaign.url== undefined) {
        $scope.showErrorUrl = true;
        $scope.errorMessageUrl = 'Please enter facebook page url';
      }

      if(!$scope.showErrorUrl){
	      if (/^(http|https):\/\/(|www.)facebook.com\/[a-zA-Z-0-9_\-\.\/\?\=]+$/i.test($scope.campaign.url)){
	    	    $scope.errorMessageUrl = '';
		        $scope.showErrorUrl = false;
	      }else{
	    	  $scope.errorMessageUrl = 'Not a valid Facebook Page URL. A valid URL looks like https://facebook.com/{page_name} or https://facebook.com/pages/{page_name}/{id}';
		      $scope.showErrorUrl = true;
	      }
      }

     if(!$scope.showErrorUrl){
    	 Campaign.validateUrl({loadUrl: $scope.campaign.url}, function(resp) {
    		 $scope.errorMessageUrl = '';
    		 $scope.showErrorUrl = false;

    		 if(!resp.valid) {
    			 $scope.errorMessageUrl = resp.error;
    			 $scope.showErrorUrl = true;
    		 }
    	 });
     }
    };

  })
  .controller('FacebookShareCampaign', function($scope, $location, $stateParams, Campaign, SharePriorityOptions, Purchase, Utilities){

    $scope.isActive = function(route) {
      return route === $location.path();
    };

    $scope.canEditCredits = true;
    $scope.showErrorUrl = false;
    $scope.showErrorCoins = false;
    $scope.errorMessageUrl = '';
    $scope.errorMessageCoins = '';
    $scope.templateUrl = 'app/products/campaign/facebookShareCampaign.html';
    $scope.priorityOptions = SharePriorityOptions;
    // $scope.genres = [];
    Campaign.creditsInfo(function(creditInfo) {
      $scope.credits = creditInfo;
    });

    $scope.showgif = function(){
       var $imgParent = $('#show_gif_share_tut');
       $imgParent.html(' ');
       var url = '../assets/images/facebook/howToFBShare.gif?v='+Math.ceil(Math.random(999)*100);
       $imgParent.html('<img width="100%" src="'+url+'">');
       angular.element('#Sharemodelpopup').modal('show');
    };

    // Utilities.getGenre(function(data) {
    //   $scope.genres = data.genres;
    // });

    $scope.campaign = {
      title: '',
      url: '',
      description: '',
      priority: '40',
      quality: '',
      credits: ''
    };

    if($stateParams.id) {

      Campaign.get({id: $stateParams.id}, function(data) {

        $scope.campaign = {
          title: data.title,
          url: data.viewUrl,
          description: data.description,
          priority: data.priority,
          quality: data.extraTime,
          credits: data.credits
        };
        // $scope.categories = data.categories;
        $scope.canEditCredits = (data.expirecredits > 0);
        // if(data.categories[0] === -1) {
        //   $scope.categories = [];
        // }
        $scope.applyValidation();
      });
    }

    $scope.imageFileInfo = function(flowFile, event, flow, key) {
      $scope.updateKey = key;
      var fileReader = new FileReader();
      fileReader.readAsDataURL(flowFile.file);
      fileReader.onload = function (event) {
        var img = new Image;
        img.onload = $scope.resizeImage;
        img.src = event.target.result;
      };

      return !!{png:1,gif:1,jpg:1,jpeg:1}[flowFile.getExtension()];
    };

    $scope.resizeImage = function() {
      $scope.purchaseReceipt = '';
      Utilities.saveFile({imageData: this.src}, function(response) {
        if(!response.error) {

          $scope.campaign.imagepath = response.imagePath;
        }
      });
    };

    $scope.validateCoins = function(){
        var totalTime  = parseInt($scope.campaign.priority); //$scope.credits.minViewTime;
        var userNeedCr = parseInt($scope.campaign.credits);
        var reg = /^\d+$/;
        var validateint= reg.test($scope.campaign.credits);

        if(!validateint)
        {
            $scope.errorMessageCoins = 'You need to enter a valid number greater than or equal to '+totalTime;
            $scope.showErrorCoins = true;
            return;
        }
        if(isNaN(userNeedCr) || userNeedCr < 1){
        	$scope.errorMessageCoins = 'You need to enter a positive number greater than or equal to '+totalTime;
            $scope.showErrorCoins = true;
        }else{
        	var viewUsers  = (userNeedCr > 0 ? Math.ceil($scope.campaign.credits / totalTime) : 0);

        	if(userNeedCr === 0 || isNaN(userNeedCr) || userNeedCr <= $scope.credits.goldCoins) {
        		if(viewUsers === 0 || (viewUsers * totalTime) === $scope.campaign.credits) {
        			$scope.errorMessageCoins = '';
        			$scope.showErrorCoins = false;
        		}
        		else {
              if($scope.campaign.credits<totalTime)
              {
        			$scope.errorMessageCoins = 'You need to assign minimum ' + (totalTime)+ ' credits for this campaign.';
              }
              else
              {
                $scope.errorMessageCoins = 'You need to assign either ' + ((viewUsers - 1) * totalTime) + ' OR ' + (viewUsers * totalTime) + ' credits for this campaign.';
              }
              //$scope.errorMessageCoins = 'You need to assign minimum ' + (viewUsers * totalTime) + ' credits for this campaign.';
        			$scope.showErrorCoins = true;
        		}
        	}
        	else {
        		$scope.errorMessageCoins = 'You have only ' + $scope.credits.goldCoins + ' credits, Please purchase more "Gold Coins" or assign credits later on';
        		$scope.showErrorCoins = true;
        	}

        }

    };
    $scope.paymentRequestToken = '';
    $scope.preview = function() {

      Purchase.getValidToken({reqType: 'payment'}, function(_token) {
        if(_token.error) {
          $scope.showError = true;
          $scope.errorMessage = _token.message;
        }
        else {
          $scope.paymentRequestToken = _token.reqtoken;
          $scope.showError = false;
          $scope.campaign.url= $scope.invalidateURL($scope.campaign.url);
          $scope.campaignType = 'fbshare';
           var totalTime  = parseInt($scope.campaign.priority); //$scope.credits.minViewTime;
           var userNeedCr = parseInt($scope.campaign.credits);
           var viewUsers  = (userNeedCr > 0 ? Math.ceil($scope.campaign.credits / totalTime) : 0);

           if(userNeedCr === 0 || isNaN(userNeedCr) || userNeedCr <= $scope.credits.goldCoins) {
             if(viewUsers === 0 || (viewUsers * totalTime) === $scope.campaign.credits) {
               var _quality  = parseInt($scope.campaign.quality);
               var dtcredits = ((!isNaN(_quality) && _quality > 0 && viewUsers > 0) ? (viewUsers * (_quality/$scope.credits.dtCreditUnit)) : 0);
               if(dtcredits > 0 && !isNaN(_quality) && _quality > 0 && $scope.credits.dtCredits < dtcredits) {
                 $scope.errorMessage = 'You need to purchase DT-Credits or leave blank quality field. You can add quality by editing campaign; after campaign is created.';
                 $scope.showError = true;
               }
               else {
                 $scope.showError = false;
                 $scope.templateUrl = 'app/products/campaign/success.html';
               }
             }
             else {
               $scope.errorMessage = 'You need to assign either ' + ((viewUsers - 1) * totalTime) + ' OR ' + (viewUsers * totalTime) + ' credits for this campaign.';
               $scope.showError = true;
             }
           }
           else {
             $scope.errorMessage = 'You have only ' + $scope.credits.goldCoins + ' credits, Please purchase more "Gold Coins" or assign credits later on';
             $scope.showError = true;
           }
        }
      });

    };

    $scope.edit = function(){
      $scope.templateUrl = 'app/products/campaign/facebookShareCampaign.html';
    };

    // $scope.categories = [];
    $scope.applyValidation = function() {
      // var _len = $scope.genres.length;
      // for(var idx=0; idx < _len; idx++) {
      //   $scope.genres[idx].genreDisable = false;
      // }

    };

    $scope.save = function(){
      $scope.campaign = {
        name: $scope.campaign.title,
        viewurl: $scope.invalidateURL($scope.campaign.url),
        description: $scope.campaign.description,
        priority: $scope.campaign.priority,
        quality: $scope.campaign.quality,
        credits: $scope.campaign.credits,
        campaigntype: 'fbshare',
        // categories: $scope.categories,
        imagepath: $scope.campaign.imagepath,
        reqToken: $scope.paymentRequestToken
      };

      $scope.saveError = '';

      if($stateParams.id) {
        // Edit Campaign
        $scope.campaign._id = $stateParams.id;
        $scope.campaign.priority = parseInt($scope.campaign.priority);
          Campaign.update($scope.campaign, function(data) {
            if(typeof data._id !== 'undefined') {
              $location.url('/list-campaign');
            }
          });
        // if($scope.campaign.categories.length < 3) {
        //   $scope.saveError = 'Please select at least 3 categories';
        //   $scope.campaign.title = $scope.campaign.name;
        //   $scope.campaign.url = $scope.campaign.viewurl;
        // }
        // else {
        // 	//$scope.campaign.viewUrl=$scope.invalidateURL($scope.campaign.url);
        //   $scope.campaign.priority = parseInt($scope.campaign.priority);
        //   Campaign.update($scope.campaign, function(data) {
        //     if(typeof data._id !== 'undefined') {
        //       $location.url('/list-campaign');
        //     }
        //   });
        // }
      }
      else {
        // Saving Facebook share  Campaign
          $scope.campaign.priority = parseInt($scope.campaign.priority);
          Campaign.create($scope.campaign, function(data) {
            if(typeof data.id !== 'undefined') {
              $location.url('/list-campaign');
            }
          });
        // if($scope.campaign.categories.length < 3) {
        //   $scope.saveError = 'Please select at least 3 categories';
        //   $scope.campaign.title = $scope.campaign.name;
        //   $scope.campaign.url = $scope.campaign.viewurl;
        // }
        // else {
        //   $scope.campaign.priority = parseInt($scope.campaign.priority);
        //   Campaign.create($scope.campaign, function(data) {
        //     if(typeof data.id !== 'undefined') {
        //       $location.url('/list-campaign');
        //     }
        //   });
        // }
      }
    };
   /*End saving compaign */
    //SHARE
    $scope.invalidateURL = function(url){
    	try{
    		if(url && url.search('src')>-1){
    			var tempURL = url.substring(url.search('src="')+5);
    			tempURL = tempURL.substring(0,tempURL.search('"'));
    			return window.decodeURIComponent(tempURL.substring(tempURL.search('href=')+5));
    		}
    	}catch(err){
    		console.log('error occured in link cleaning');
    	}
    	return url;
    };


    // Validate URL is visible in IFrame or Not
    $scope.validateIframeLoading = function() {
    	$scope.showErrorUrl = false;
      if($scope.campaign.url== undefined) {
        $scope.showErrorUrl = true;
        $scope.errorMessageUrl = 'Please enter full url';
      }


      if(!$scope.showErrorUrl){
	      if($scope.campaign.url){
	    	  if(($scope.campaign.url.indexOf('<iframe')>-1 &&
	    			  $scope.campaign.url.indexOf('</iframe')>-1) || /^(http|https):\/\/(|www.)facebook.com\//i.test($scope.campaign.url)){
	    		    $scope.errorMessageUrl = '';
	    	        $scope.showErrorUrl = false;
	    	  }else{
	    		  $scope.errorMessageUrl = 'Url could be enclosed between <iframe> </iframe> but must contain https://www.facebook.com';
	    	        $scope.showErrorUrl = true;
	    	  }
	      }
      }

      if(!$scope.showErrorUrl){
	      Campaign.validateUrl({loadUrl: $scope.invalidateURL($scope.campaign.url)}, function(resp) {
	        $scope.errorMessageUrl = '';
	        $scope.showErrorUrl = false;

	        if(!resp.valid) {
	          $scope.errorMessageUrl = resp.error;
	          $scope.showErrorUrl = true;
	        }
	      });
       }
    };

  })
  .controller('BannerCampaign', function($scope){

    $scope.templateUrl = 'app/products/campaign/bannerCampaign.html';

    $scope.bannerCampaign = {
      title: '',
      url: '',
      bannerimg: '',
      priority: 'Tappax x 15',
      quality: '',
      credits: ''
    };

    function readURL(input)
    {
      if (input.files && input.files[0]) {
        var reader = new FileReader();
        reader.onload = function (e) {
          document.getElementById('avatar').src =  e.target.result;
          $scope.campaign.banner = e.target.result;
        };
        reader.readAsDataURL(input.files[0]);
        var data = readURL;
        localStorage.setItem('img', data);
      }
    }

    window.readURL=readURL;

    $scope.preview = function() {

      $scope.templateUrl = 'app/products/campaign/success.html';
    };

    $scope.edit = function(){
      $scope.templateUrl = 'app/products/campaign/bannerCampaign.html';
    };

    $scope.save = function(){
      $scope.campaign = {
        title: $scope.campaign.title,
        url: $scope.campaign.url,
        bannerimg: $scope.campaign.banner,
        priority: $scope.campaign.priority,
        quality: $scope.campaign.quality,
        credits: $scope.campaign.credits,
        campaigntype: 'banner'
      };
    };

  })
  .controller('PopupCampaign', function($scope){

    $scope.templateUrl = 'app/products/campaign/popupCampaign.html';

    $scope.popupcampaign = {
      title: '',
      url: '',
      description: '',
      priority: 'Tappax x 15',
      quality: '',
      credits: ''
    };

    $scope.create = function(){
      $scope.popupcampaign = {
        title: $scope.popupcampaign.title,
        url: $scope.popupcampaign.url,
        description: $scope.popupcampaign.description,
        priority: $scope.popupcampaign.priority,
        quality: $scope.popupcampaign.quality,
        credits: $scope.popupcampaign.credits,
        campaigntype: 'popup'
      };
      //console.log($scope.popupcampaign);
      $scope.templateUrl = 'app/products/campaign/success.html';
    };
  });
