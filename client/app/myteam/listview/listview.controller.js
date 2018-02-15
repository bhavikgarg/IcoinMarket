'use strict';

angular.module('iCoinApp')
  .controller('GenealogyListCtrl', function ($scope, $http, GeneralogyCreate, Auth, $location) {
    $scope.username = Auth.getCurrentUser();
    $scope.pages = 1;
    $scope.error = '';
    $scope.isRequestPending = false;

    $scope.isActive = function(route) {
      return route === $location.path();
    };

    $scope.data = {members: []};
    $scope.listlevel = '1';
    $scope.gridlevel = '1';
    $scope.currentPage = 1;
    $scope.genealogy = {};
    $scope.genealogyGridView = {};
    $scope.goldpacksarray = [ { label: 'All', min: 0, max: 0} , { label: '0 - 10', min: 0, max: 10}, { label: '10 - 50', min:10, max: 50}, { label : '50 - 100', min:50, max: 100}];
    $scope.goldpacks = $scope.goldpacksarray[0];
    $scope.ranksarray = [{ label : 'All', value : 0}];
    $scope.rank = $scope.ranksarray[0];
    $scope.usersarray = [ { label: 'All', min: 0, max: 0} , { label: '0 - 10', min: 0, max: 10}, { label: '10 - 50', min:10, max: 50}, { label : '50 - 100', min:50, max: 100}];
    $scope.users = $scope.usersarray[0];
    $scope.silverpacksarray = [ { label: 'All', min: 0, max: 0} , { label: '0 - 10', min: 0, max: 10}, { label: '10 - 50', min:10, max: 50}, { label : '50 - 100', min:50, max: 100}];
    $scope.silverpacks = $scope.silverpacksarray[0];

    for(var i=0;i<=$scope.maxrank;i++){
        $scope.ranksarray.push({ label: i, value: i});
        $scope.ranksarray.push({ label: 1, value: 1});
    }
    $scope.viewOptions = {
      level: $scope.listlevel,
      page: $scope.currentPage,
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

    $scope.getOptions('list', 'DESC', $scope.genealogy);

    // Load members information for specific level
    // of logged in member or selected member (List View)
    $scope.listlevelchange = function(){
      $scope.genealogy.minusers = $scope.users.min;
      $scope.genealogy.maxusers = $scope.users.max;
      $scope.genealogy.rank = $scope.rank.value;
      $scope.genealogy.mingoldpacks = $scope.goldpacks.min;
      $scope.genealogy.maxgoldpacks = $scope.goldpacks.max;
      $scope.genealogy.minsilverpacks = $scope.silverpacks.min;
      $scope.genealogy.maxsilverpacks = $scope.silverpacks.max;
      $scope.genealogy.level = $scope.listlevel;
      $scope.passlevel();
    };

    // Load member's Genealogy (List View)
    $scope.passlevel = function(pgObj){
      $scope.isRequestPending = true;
      $scope.error = '';
      if(angular.isObject(pgObj)) {
        $scope.currentPage = pgObj.currentPage;
        $scope.genealogy.page = pgObj.currentPage;
      }

      GeneralogyCreate.listCurrentUserMembers($scope.genealogy, Auth, function(response) {
        $scope.analytics = response.members;
        $scope.userlist = response.members;
        $scope.flagUrl = response.flagUrl;

        $scope.levelsarray = [];
        for(var i=1;i<=$scope.maxlevel;i++){
            $scope.levelsarray.push(i);
        }
        $scope.maxrank = response.maxrank;
        $scope.maxgoldpacks = response.maxrank;
        $scope.maxsilverpacks = response.maxsilverpacks;
        $scope.maxusers = response.maxusers;

        $scope.totalPages = response.totalusers;
        $scope.pageLimit = response.limit;

        if(response.totalusers > $scope.pageLimit) {
          $scope.pages = Math.ceil(response.totalusers/$scope.pageLimit);
        }

        $scope.viewFrom = ($scope.currentPage - 1) * $scope.pageLimit;
        $scope.isRequestPending = false;
      });
    };

    // Call to load clicked member Genealogy (List View)
    $scope.loadMemberInfo = function(memberId) {
      $scope.genealogy.viewMember = memberId;
      $scope.passlevel();
    };

    // Go to Specific Page
    $scope.updatePage = function(pageObj) {
      if($scope.getPage) {
        if($scope.getPage > $scope.pages || $scope.getPage < 1) {
          $scope.error = 'Page not found';
        } else {
          $scope.currentPage = $scope.getPage;
          $scope.passlevel(pageObj);
        }
      }
    };

    $scope.passlevel();  // Default: Load logged in member Genealogy (List View)
    $scope.getFlagUrl = function(member) {
      return $scope.flagUrl.replace('FLAG_COUNTRY_CODE', member.country.toLowerCase());
    };
  });
 