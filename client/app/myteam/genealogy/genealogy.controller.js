'use strict';

angular.module('iCoinApp')
  .controller('GenealogyCtrl', function ($scope, $q, $http, GeneralogyCreate, Auth, $location, $timeout, $state, $anchorScroll, $window) {
    $scope.username = Auth.getCurrentUser();
    $scope.isCallFirstTime = true;
    //var uniqueLabel     = '';

    $scope.isActive = function(route) {
      return route === $location.path();
    };
    $scope.targetElement = null;

    $scope.loadLevel = function () {
      $state.reload();
    };

    $scope.genealogyTree = [{
      label: $scope.username.name + ' (Me)',
      children: [],
      'customInfo': {
        id: $scope.username.id,
        name: $scope.username.name,
        email: $scope.username.email,
        levelCounter: 1,
        currentPage: 1,
        totalMembers: 1,
        currentLoaded: 0,
        currentIndex: 0
      },
      onSelect: function(data) {
        $scope.viewMember = data;
        $scope.genealogyGridView.viewMember = data.customInfo.id;
        $scope.genealogyGridView.page = data.customInfo.currentPage;

        $scope.totalMembers  = data.customInfo.totalMembers;
        $scope.currentLoaded = data.customInfo.currentLoaded;
      }
    }];

    $scope.username.$promise.then(function() {
      $scope.defId = $scope.username._id;
      $scope.genealogyTree[0].label = ($scope.username.name ? $scope.username.name : $scope.username.username) + ' (Me)';
      $scope.genealogyTree[0].customInfo.id = $scope.defId;
    });

    $scope.defId = $scope.username._id;
    $scope.data = {members: []};
    $scope.listlevel = '1';
    $scope.gridlevel = '1';
    $scope.currentPage = 1;
    $scope.totalMembers = 0;
    $scope.currentLoaded = 0;
    $scope.totalPages = 0;
    $scope.genealogy = {};
    $scope.genealogyGridView = {};
    $scope.viewMember  = {};
    $scope.loadingMessage = '';
    $scope.viewOptions = {
      level: $scope.listlevel,
      page: $scope.currentPage,
      limit: '',
      viewMember: '',
      viewAs: '',
      dir: '',
      from: '',
      to: ''
    };

    $scope.getOptions = function(viewAs, sortDir, copyTo) {
      angular.copy($scope.viewOptions, copyTo);
      copyTo.viewAs = viewAs;
      copyTo.dir = sortDir;
    };

    $scope.getOptions('grid', 'DESC', $scope.genealogyGridView);

    // Load members information for specific level
    // of logged in member or selected member (Grid View)
    $scope.gridlevel = function(level, parentData){
      if(parentData.customInfo.childRecords > 0){
        $scope.currentPage = 1;
        $scope.parentLevel = level+ ' parent';
        $scope.genealogyGridView.level = parseInt(level)+1;
        $scope.genealogyParentGrid = parentData;
        $scope.genealogyTree[0].children = [];
        $scope.genealogyGridView.viewMember = parentData.customInfo.id;
        $scope.genealogyGridView.page = $scope.currentPage;
        $scope.loadlevellist($scope.genealogyTree[0], $scope.genealogyParentGrid, true, null);
      }
    };

    $scope.gridlevelchange = function(){
      $scope.currentPage = 1;
      $scope.genealogyGridView.level = $scope.gridlevel;
      $scope.genealogyTree[0].children = [];
      $scope.genealogyGridView.viewMember = $scope.defId;
      $scope.genealogyGridView.page = $scope.currentPage;
      $scope.loadlist($scope.genealogyTree[0], true, null);
    };

    $scope.firstLevel = function(){
      $state.reload();
    };

    // Load member's Genealogy (Grid View)
    $scope.loadlist = function(childOf, dropdown, gridLevel) {
      var gridObject      = $scope.genealogyGridView;
      $scope.totalMembers = ((childOf.customInfo && childOf.customInfo.totalMembers) ? childOf.customInfo.totalMembers : 1);
      $scope.loadingMessage = 'Please wait, while loading...';
      //console.log(gridObject);
      if(childOf.children.length === 0 || childOf.children.length < $scope.totalMembers) {
        if(gridLevel != null && gridLevel > 0) {
          gridObject.level = gridLevel;
        }

        gridObject.dd = (dropdown ? 1 : 0);
        GeneralogyCreate.listCurrentUserMembers(gridObject, Auth, function(response) {
          $scope.data = response;
          $scope.info = response.memberInfo;
          $scope.pageLimit = response.pageLimit;
          $scope.overAllMembers = response.totalUsers;
          var _memberInfo = response.memberInfo || [] ;
          var deferred    = $q.defer();
          var promise     = deferred.promise;
          promise.then(function() {
            _memberInfo.forEach(function(memInfo) {
              $scope.totalChilds = _memberInfo.length;
              childOf.children.push({
                'label': memInfo.name + ' ( '+ memInfo.users + ' )',
                'children': [],
                'expanded': false,
                'sponsorId': memInfo.sponsorId,
                'customInfo': {
                  id: memInfo.id,
                  name: memInfo.name,
                  email: memInfo.email,
                  level: $scope.genealogyGridView.level,
                  levelCounter: ($scope.levelCounter > 0 ? (parseInt($scope.levelCounter) + 1) : 1),
                  currentPage: 0,
                  totalMembers: memInfo.users,
                  currentLoaded: $scope.totalChilds,
                  childRecords: memInfo.users,
                  currentIndex: childOf.children.length
                },
              });
            });
          }).then(function() {
            if(childOf.customInfo) {
              childOf.customInfo.totalMembers  = response.totalUsers;
              childOf.customInfo.currentLoaded = ($scope.currentPage < response.totalPages ? ($scope.currentPage * $scope.pageLimit) : childOf.customInfo.totalMembers);
              childOf.customInfo.currentPage = $scope.currentPage;
            }
            $scope.totalMembers  = childOf.customInfo.totalMembers;
            $scope.currentLoaded = childOf.customInfo.currentLoaded;
            $scope.viewMember    = childOf;

            if(!$scope.isCallFirstTime) {
              childOf.expanded = !childOf.expanded;
            }
            childOf.expanded = true;
            $scope.isCallFirstTime = false;
            $scope.loadingMessage = '';

            //var getRecords = angular.element('.first-level').find('li > span').attr('child-data');

            if($scope.totalMembers > $scope.pageLimit && $scope.currentLoaded < $scope.totalMembers) {
              angular.element('.first-level > li:last-child > .btn').addClass('show');
            } else {
              angular.element('.first-level > li:last-child > .btn').addClass('hide');
            }

          });

          deferred.resolve();
        });
      }
    };

    // Load member's Genealogy (Grid View)
    $scope.loadlevellist = function(childOf, dropdown, gridLevel) {
      var gridObject      = $scope.genealogyGridView;
      //$scope.totalMembers = ((childOf.customInfo && childOf.customInfo.totalMembers) ? childOf.customInfo.childRecords : 1);
      $scope.loadingMessage = 'Please wait, while loading...';
      if(childOf.children.length === 0 || childOf.children.length < $scope.totalMembers) {
        if(gridLevel != null && gridLevel > 0) {
          gridObject.level = gridLevel;
        }
        gridObject.dd = (dropdown ? 1 : 0);
        GeneralogyCreate.listCurrentUserLevelMembers(gridObject, Auth, function(response) {
          $scope.data = response;
          $scope.info = response.memberInfo;
          $scope.overAllMembers = response.totalUsers;
          // /var _memberInfo = response.memberInfo || [] ;
          var deferred = $q.defer();
          var promise = deferred.promise;
          promise.then(function() {
            response.memberInfo.forEach(function(memInfo) {
              childOf.children.push({
                'label': memInfo.name + ' ( '+ memInfo.users + ' )',
                'children': [],
                'expanded': false,
                'sponsorId': memInfo.sponsorId,
                'customInfo': {
                  id: memInfo.id,
                  name: memInfo.name,
                  email: memInfo.email,
                  level: $scope.genealogyGridView.level,
                  levelCounter: ($scope.levelCounter > 0 ? (parseInt($scope.levelCounter) + 1) : 1),
                  currentPage: 0,
                  totalMembers: memInfo.users,
                  currentLoaded: childOf.children.length,
                  childRecords: memInfo.users,
                  currentIndex: childOf.children.length
                },
              });
            });
          }).then(function(){
            if($scope.toggle == true){
              $scope.targetElement.next().slideToggle();
            }

            if(childOf.customInfo) {
              childOf.customInfo.totalMembers  = response.totalUsers;
              childOf.customInfo.currentLoaded = ($scope.currentPage < response.totalPages ? ($scope.currentPage * $scope.pageLimit) : childOf.customInfo.totalMembers);
              childOf.customInfo.currentPage = $scope.currentPage;
            }

            $scope.totalMembers  = response.totalUsers;
            $scope.currentLoaded = childOf.children.length;
            $scope.totalPages = response.totalPages;
            //$scope.viewMember    = childOf;

            if(!$scope.isCallFirstTime) {
              childOf.expanded = !childOf.expanded;
            }
            childOf.expanded = true;
            $scope.isCallFirstTime = false;
            $scope.loadingMessage = '';

            if($scope.targetElement != null){
              //$scope.targetElement.next('ul').find('li:last-child > .btn').addClass('show');
              // var getRecords = $scope.targetElement.attr('child-data');
              if($scope.totalMembers > $scope.pageLimit && $scope.currentLoaded < $scope.totalMembers && $scope.currentPage < $scope.totalPages) {
                $scope.targetElement.next().next('.btn').addClass('show');
              }else{
                $scope.targetElement.next().next('.btn').addClass('hide');
              }
            }
            else {
              // var getRecords = angular.element('.first-level > li > span').attr('child-data');
              if($scope.totalMembers > $scope.pageLimit && $scope.currentLoaded < $scope.totalMembers && $scope.currentPage < $scope.totalPages) {
                angular.element('.first-level > li:last-child > .btn').addClass('show');
              }else{
                angular.element('.first-level > li:last-child > .btn').addClass('hide');
              }
            }
          });

          deferred.resolve();
        });
      }
    };

    $scope.loadNextPage = function(sponsorId, memberInfo, event) {
      //var level = memberInfo.customInfo.levelCounter;
      var ele = event.target;
      //console.log(angular.element(ele).parent().parent().next('div').attr('current-page'));
      var currentLevel = angular.element(ele).parent().find('ul > li > span').attr('data-level');
      //console.log(angular.element(ele).parent().find('span').attr('sponsor-id'), angular.element(ele).parent().find('span').attr('data-level'));
      if($scope.targetElement != null){
        $scope.targetElement.next('ul').find('li').removeClass('show');
        $scope.targetElement.next('ul').find('li:last-child > .btn').removeClass('show');
      }else{
        angular.element('.first-level').find('li > ul > li > .btn').addClass('hide');
        angular.element('.first-level > li:last-child > .btn').addClass('show');
      }

      $scope.genealogyGridView.viewMember = sponsorId;
      $scope.viewMember = memberInfo;

      $scope.toggle = false;
      $scope.currentPage  = $scope.viewMember.customInfo.currentPage + 1;
      $scope.totalMembers = $scope.viewMember.customInfo.totalMembers;
      $scope.levelCounter = parseInt(currentLevel)-1;
      $scope.genealogyGridView.page = $scope.viewMember.customInfo.currentPage+1;
      $scope.viewMember.customInfo.currentPage = $scope.currentPage;
      if(currentLevel == 1){
        $scope.loadlist($scope.viewMember, false, null);
      }
      else {
        $scope.loadlevellist($scope.viewMember, false, null);
      }

      // $scope.loadlevellist($scope.viewMember, false, null);
      // $scope.viewMember.forEach(function(_res){
      //   angular.element(el).parent().find('ul').append('<li class="level"></li>');
      // });
    };

    // Call to load clicked member Genealogy (Grid View)
    $scope.loadGridMemberInfo = function(level, member, event) {
      var el = event.target;
      $scope.toggle = true;

      if(level > 7) { event.preventDefault(); return false; }

      if(angular.element(el).attr('class') === 'fa fa-user'){
        var element = angular.element(el).parent();
        angular.element(el).parent().next().slideToggle();
      }else{
        var element = angular.element(el);
      }

      $scope.targetElement = element;

      if(member.customInfo.childRecords > 0 && level < 8){
        $scope.viewMember = member;
        $scope.genealogyGridView.viewMember = member.customInfo.id;
        $scope.genealogyGridView.page = member.customInfo.currentPage;
        $scope.parentLevel = level+ ' parent';
        $scope.genealogyGridView.level = parseInt(level);
        $scope.totalMembers  = member.customInfo.childRecords;
        $scope.currentLoaded = member.children.length;
        $scope.currentPage   = member.customInfo.currentPage + 1;
        $scope.levelCounter = parseInt(level);
        $scope.getTotalUser = member.customInfo.totalMembers;
        if(member.children.length === 0) {
          $scope.loadlevellist(member, false, null);
        }
      }


      if(element.parent().parent().hasClass('first-level')){
        if(element.attr('child-data') !== undefined){
          $state.reload();
        }
      }
      if(element.attr('child-data') > 0){
        //angular.element('.first-level li span').removeClass('selected');
        angular.element(el).next().slideToggle();
        $window.scrollTo(0, angular.element('.first-level').offsetTop);
        //angular.element('#scatterchart_material').parent().focus();
        angular.element('#scatterchart_material').animate({
           scrollTop: 0
        }, 'slow');
        //angular.element(el).addClass('selected');
        if(element.hasClass('selected')) {
          element.removeClass('selected');
          var getParentChildren = parseInt(element.parent().parent().parent().find('span').attr('child-data'));
          var getCurrentLoaded = parseInt(element.parent().parent().parent().find('ul > li.level-'+level).length);
          element.parent().prevAll().show();
          element.parent().nextAll().find('.selected').next().slideToggle();
          element.parent().prevAll().find('.selected').next().slideToggle();
          element.parent().prevAll().find('.selected').removeClass('selected');
          element.next().next('.btn').addClass('hide');
          if(getParentChildren > $scope.pageLimit && getCurrentLoaded < getParentChildren){
            element.parent().parent().next('.btn').removeClass('hide');
          }
        }else{
          //var getChildren = element.attr('child-data');
          element.addClass('selected');
          element.parent().parent().next('.btn').addClass('hide');
          if($scope.getTotalUser > $scope.pageLimit && $scope.currentLoaded < $scope.getTotalUser){
            element.next().next('.btn').addClass('show');
            element.next().next('.btn').removeClass('hide');
          }
          element.parent().prevAll().find('.btn').addClass('hide');
          element.parent().prevAll().hide();
        }
      }
    };

    $scope.loadlist($scope.genealogyTree[0], false, null);   // Default: Load logged in member Genealogy (Grid View)
  });
 