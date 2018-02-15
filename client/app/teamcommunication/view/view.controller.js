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
  .controller('MessageViewCtrl', function ($scope, $sce, $location, $state, $stateParams, $rootScope, MessageService, MessageActions, User, GeneralogyCreate, Auth) {
    $scope.listMembers  = [];
    $scope.showReply    = false;
    $scope.cameFromSent = ($stateParams.sent == 1);
    $scope.receiverInfo = {};
    MessageService.get({id: $stateParams.id}, function(response) {
      $scope.message = response;
      $scope.msgBody = $sce.trustAsHtml(response.msgContent);
      $scope.receiverInfo = response.receiverInfo;

      MessageActions.markViewed($stateParams.id, MessageService, function() {
        $rootScope.$broadcast('message-read');
      });

      Auth.getCurrentUser().$promise.then(function(usr) {
        $scope.showReply = (usr._id !== $scope.message.senderId);
      });
    });

    $scope.deleteMessage = function() {
      MessageActions.markDelete($stateParams.id, MessageService, function(response) {
        if(!response.error) {
          $location.url('/teamcommunication/inbox');
        }
      });
    };

    $scope.markSpam = function() {
      MessageActions.markSpam($stateParams.id, MessageService, function() {
        console.log('marked spam');
      });
    };

    $scope.markImportant = function() {
      MessageActions.markImportant($stateParams.id, MessageService, function() {
        console.log('marked important');
      });
    };

    $scope.reply = function() {
      var replyInfo = btoa([$scope.message.senderInfo.name, $scope.message.senderInfo.email, $scope.message.senderId, ($scope.cameFromSent ? 1 : 0), $scope.receiverInfo.name, $scope.receiverInfo.email, $scope.message.receiverId]);
      $location.url('/teamcommunication/'+$stateParams.id+'/'+replyInfo);
    };
  });