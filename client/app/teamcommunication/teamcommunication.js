'use strict';

angular.module('iCoinApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('message', {
        url: '/teamcommunication',
        parent: 'app',
        templateUrl: 'app/teamcommunication/message/message.html',
        controller: 'MessageCtrl',
        authenticate: true
      })
      .state('sponsorMessage', {
        url: '/teamcommunication',
        parent: 'app',
        templateUrl: 'app/teamcommunication/message/message.html',
        controller: 'SponsorMessageCtrl',
        authenticate: true
      })
      .state('MessageList', {
        url: '/teamcommunication/:listType',
        parent: 'app',
        params: {
          listType: 'inbox'
        },
        views: {
          '': {
            templateUrl: 'app/teamcommunication/inboxsent/list-messages.html',
            controller: 'MessageListCtrl',
          }
        },
        authenticate: true
      })
      .state('messageView', {
        url: '/teamcommunication/view/:id/:sent',
        parent: 'app',
        templateUrl: 'app/teamcommunication/view/view.html',
        controller: 'MessageViewCtrl',
        authenticate: true
      })
      .state('messageReply', {
        url: '/teamcommunication/:id/:reply',
        parent: 'app',
        templateUrl: 'app/teamcommunication/message/message.html',
        controller: 'MessageCtrl',
        authenticate: true
      });
  });
