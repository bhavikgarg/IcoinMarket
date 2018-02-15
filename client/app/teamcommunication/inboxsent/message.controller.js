'use strict';

angular.module('iCoinApp')
  .service('MessageActions', function(Auth) {
    return {
      markDelete: function(msgId, msgService, callback) {
        msgService.trashMessage({id: msgId}, callback);
      },

      markSpam: function(msgId, msgService, callback) {
        msgService.updateFlags({_id: msgId, isspam: true}, callback);
      },

      markImportant: function(msgId, msgService, callback) {
        msgService.updateFlags({_id: msgId, impmessage: true}, callback);
      },

      markViewed: function(msgId, msgService, callback) {
        msgService.updateFlags({_id: msgId, isview: true}, callback);
      },

      getTeamMembers: function(req, gService, callback) {
        gService.listCurrentUserMembers({
          level: 1,
          page: req.page,
          viewMember: '',
          viewAs: 'list',
          dir: 'DESC',
          from: '',
          to: '',
          dd: -1,
          searchfield: req.searchfield,
          search: req.search
        }, Auth, callback);
      }
    };
  })
  .controller('MessageCtrl', function ($scope, $location, $stateParams, $sce, $rootScope, $window, GeneralogyCreate, MessageService, MessageActions, Auth, $http, PageLimit) {
    $scope.currentuser = Auth.getCurrentUser();
    $scope.isVerified = true;
    $scope.selectAll = true;
    $scope.userid = [];
    $scope.listMembersId = [];
    $scope.memberslist   = [];
    $scope.msgSubject    = '';
    $scope.vm            = {currentPage: 1};
    $scope.totalusers    = 0;
    $scope.counterFrom   = 0;
    $scope.replyof       = ($stateParams.reply ? atob($stateParams.reply).split(',') : []);
    $scope.isReply       = ($scope.replyof.length > 0);
    $scope.limits        = [PageLimit];
    $scope.limit         = PageLimit;
    $scope.searchfield   = 'email';
    $scope.searchinput   = '';
    $scope.showLoadingMessage = false;
    $scope.userDetails   = [];
    $scope.userInfo      = [];
    $scope.userid        = [];
    $scope.selected      = [];
    $scope.options       = {
      rowSelection: true,
      multiSelect: true,
      autoSelect: true,
      decapitate: false,
      largeEditDialog: false,
      boundaryLinks: true,
      limitSelect: true,
      pageSelect: true
    };
    $scope.query         = {
      order: 'name',
      limit: $scope.limit,
      page: 1
    };
    $scope.msgsearch     = {
      'field':'',
      'search':''
    };

    // Load member's Genealogy (List View)
    $scope.loadlist = function(page, searchfield, search) {
      $scope.userInfo = [];
      $scope.showLoadingMessage = true;
      $scope.searchfield = searchfield;
      $scope.search = search;
      $scope.searchinput = search;
      $scope.vm.currentPage = page;
      $scope.selectAll = false;
      MessageActions.getTeamMembers({ page: page, searchfield: searchfield, search: search }, GeneralogyCreate, function(response) {
        $scope.data = response;
        $scope.info = (response.members || []);

        $scope.info.forEach(function(info){
          $scope.memberslist[info.memberInfo.id] = info.memberInfo;
          $scope.userDetails.push(info.memberInfo);
          $scope.userInfo.push(info.memberInfo);
          $scope.userid.push(info.memberInfo.id);
        });

        $scope.totalusers  = response.totalusers;
        $scope.limit       = response.limit;
        $scope.counterFrom = ((page - 1) * $scope.limit);
        $scope.showLoadingMessage = false;
      });

    };

    $scope.updateSearch = function(msgsearch) {
      $scope.msgError = '';
      if(msgsearch.field != null && msgsearch.input != null) {
        var emailRegExp = /^[a-z]+([a-z0-9._-](\+{0,1}))+@[a-z]+\.[a-z.]{2,6}$/i;
        $scope.memberslist = [];
        $scope.userDetails = [];
        $scope.userInfo = [];
        $scope.msgsearch = msgsearch;
        $scope.msgError = 'Please enter valid email';
        if((msgsearch.field === 'email' && msgsearch.input.match(emailRegExp)) || msgsearch.field === 'name'){
          $scope.msgError = '';
          $scope.loadlist($scope.vm.currentPage, $scope.limit, msgsearch.field, msgsearch.input);
        }
      }
      else {
        $scope.loadlist($scope.vm.currentPage, $scope.limit, null, null);
      }
    };



    $scope.updateSearch2 = function(msgsearch) {
        $scope.memberslist = [];
        $scope.userDetails = [];
        $scope.userInfo = [];
        $scope.msgsearch = msgsearch;
        $scope.loadlist($scope.vm.currentPage, 'all', msgsearch.input);
    };


   /* $scope.filterNameEmail = function () {
      var findText = 
    }*/

    $scope.onPaginationChange = function (page, limit) {
      $scope.loadlist(page, limit, $scope.msgsearch.field, $scope.msgsearch.input);
    };

    $scope.backUrl = '';
    if($scope.isReply) {
      MessageService.get({id: $stateParams.id}, function(response) {
        $scope.message = response;
        $scope.msgSubject = 'Re: '+response.subject;
        var _date  = new Date(response.msgDate);
        var _hrs   = _date.getHours();
        var _dtStr = _date.getDate() + '/' + ((_date.getMonth() + 1) < 10 ? '0'+(_date.getMonth() + 1) : (_date.getMonth() + 1)) + '/' + _date.getFullYear() + ' ' + (_hrs > 12 ? (_hrs - 12) : _hrs) + ':' + _date.getMinutes() + ' ' + (_hrs > 12 ? 'PM' : 'AM');
        var sponsor = response.senderInfo || {name: ''};
        $scope.htmlVariable = $sce.trustAsHtml('<br><br><hr><br><p>On '+_dtStr+', '+sponsor.name+' wrote:</p>' + response.msgContent);
        $scope.backUrl = '/teamcommunication/view/'+$stateParams.id+'/'+($scope.currentuser._id === response.senderId ? 1 : 0);
      });
    }

    $scope.selectuser = function(id) {
      var index = $scope.userid.indexOf(id);
      if (index > -1) {
        $scope.userid.splice(index, 1);
      }
      else {
        $scope.userid.push(id);
      }
    };

    $scope.selectUserIds = function(_selectAll) {
      $scope.selectAll = _selectAll;
      if(_selectAll == true ) {
        $scope.userid = angular.copy($scope.listMembersId);
      } else {
        $scope.userid = [];
      }
    };


    $window.onbeforeunload = function() {
      if ($scope.form && $scope.form.$dirty ){
        return false;
      }
    };

    $scope.$on('$locationChangeStart', function(event) {
      if ($scope.form.$dirty && !$scope.form.$submitted && !confirm('Are you sure want to leave this page ?')){
        event.preventDefault();
      }        
      return false;
    });

    $scope.sendMessage = function() {
      $scope.isVerified = false;
      if($scope.selected.length > 0 || ($scope.isReply && $scope.userid.length > 0)){
        $scope.isVerified = true;
        var sentToIds = [];
        $scope.selected.forEach(function(sti) {
          sentToIds.push(sti.id+'');
        });

        var messageInfo = {
          sendto: sentToIds,
          message: $scope.htmlVariable,
          msgsubject: $scope.msgSubject
        };

        if($scope.isReply) {
          messageInfo.replyId = $stateParams.id;
        }

        MessageService.sendMessage(messageInfo, function(response) {
          if(typeof response.token != 'undefined') {
            $location.url('/teamcommunication/sent');
          }
        });
      }
    };

    if(!$scope.isReply) {
      $scope.loadlist($scope.vm.currentPage, null, null);
    }
    else {
      // var replySubject = $scope.replyof[0].replace(/\//g, ",");
      // $scope.msgSubject = 'Re: '+replySubject;
      if($scope.replyof[3] === 1){
        $scope.userid     = [$scope.replyof[6]];
      } else {
        $scope.userid     = [$scope.replyof[2]];
      }
    }

    // 24 hours sent only one email, except reply
    $scope.canSent = true;
    MessageService.get({type: 'sent'}, function(response) {
      var messages = response.messages,
          sentTime = null,
          currTime = new Date();

      if(messages && messages.length > 0) {
        sentTime = new Date(messages[0].msgDate);
        $scope.canSent = ((sentTime.getTime() + (24*60*60*1000)) < currTime.getTime());
      }
    });

    Auth.getCurrentUser().$promise.then(function(_user) {
          $scope.data     = _user;
          $scope.userId   = _user._id;
          $scope.userinfo = _user;
          $scope.userinfo.avatar = (_user.avatar);
          $scope.avatarImage = $scope.userinfo.avatar;
          // var _stdcode = $scope.userinfo.mobile;
          // _stdcode = _stdcode ? (_stdcode+'').split('-') : '';
          // $scope.stdcode = (_stdcode.length > 1 ? _stdcode[0] : '+');
          // $scope.userinfo.mobile = (_stdcode.length > 1 ? (_stdcode[1] * 1) : (_stdcode[0] * 1));
          // if(_user.categories && _user.categories[0] === -1) {
          //   $scope.userinfo.categories = $scope.genres.map(function(item) { return item.key; });
          // }
        });
  });
  
 