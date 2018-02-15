angular.module('iCoinApp')
    .controller('MyDashboardCtrl', function($scope, $rootScope,Auth, CommitmentsService, $cookies, AdminAccess, $cookieStore, $sce, ApiPath, $uibModal, $uibModalStack, $ngConfirm) {
        $scope.limit = 25;
        $scope.filter = {text: ''};
        $scope.user = {};
        $scope.selectAll = true;
        $scope.selected= [];
        $scope.options = {
            rowSelection: true,
            multiSelect: true,
            autoSelect: true,
            decapitate: false,
            largeEditDialog: false,
            boundaryLinks: true,
            limitSelect: true,
            pageSelect: true
        };

        Auth.getCurrentUser().$promise.then(function (user) {

        });

        AdminAccess.hasAdminAccess();
        $scope.isSupportLogin = AdminAccess.isSupportLogin;

        $scope.pickedCommimentListByPM = function(){
            CommitmentsService.pickedCommimentListByPM(function(data){
                $scope.pickedCommiments=data.result;
            });
        };

        $scope.pickedCommimentListByPM();

        $scope.warningAlert = function(message){
          $ngConfirm({
              title: 'Warning !',
              content: message,
              type: 'red',
              typeAnimated: true,
              buttons: {
                  tryAgain: {
                      text: 'Close',
                      btnClass: 'btn-red',
                      action: function(){
                      }
                  },
              }
          });
       };

       $scope.successAlert = function(message){
        $ngConfirm({
            title: 'Success !',
            content: message,
            type: 'orange',
            typeAnimated: true,
            buttons: {
                tryAgain: {
                    text: 'OK',
                    btnClass: 'btn-orange',
                    action: function(){
                    }
                },
            }
        });
     };
    })