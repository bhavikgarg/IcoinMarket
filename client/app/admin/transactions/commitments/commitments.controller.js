angular.module('iCoinApp').controller('CommitmentCtrl', function($scope, $stateParams, $window, User, AdminAccess,CommitmentsService,$uibModal, $uibModalStack) {

    AdminAccess.hasAdminAccess();
    $scope.isSoloAddAdmin = AdminAccess.isSoloAddAdmin;
    $scope.isFinanceAdmin = AdminAccess.isFinanceAdmin;
    $scope.isWatchUserAdmin = AdminAccess.isWatchUserAdmin;
    $scope.isModeratorAdmin     = AdminAccess.isModeratorAdmin;
    $scope.isSupervisorAdmin    = AdminAccess.isSupervisorAdmin;

    $scope.purachses = {};
    $scope.purchaseinfo = {};
    $scope.popInfo = {};
    $scope.currentPage = 1;
    $scope.totalPages = 0;
    $scope.filter = {data: ''};
    $scope.buttonWait = '';
    $scope.pageWait   = '';
    $scope.currentView = '';
    $scope.transactionInfo = {};
    $scope.usdAmount = '';
    $scope.adscashCoins = '';
    $scope.approvedAmount = '';
    $scope.exportMessage = '';
    $scope.loadingText = '';
    $scope.currentView ='';
    $scope.cancel = {};


    // $scope.changeStatusFilter = function(status) {
    //   $scope.currentPage = 1;
    //   $scope.currentView = status;
    //   $scope.loadPage();
    // };

    $scope.currentView ='All';

    $scope.loadPage = function() {
      var userView='';
      if($scope.currentView !='All'){
         var userView=$scope.currentView;
      }
      //var userTzOffset = new Date().getTimezoneOffset(); // -330 for India
      if($scope.tillDate && $scope.fromDate){
          $scope.tillDate = new Date($scope.tillDate);
          $scope.tillDate.setHours(23,59,59,0);
          $scope.tillDate1 = new Date($scope.tillDate.getTime()).toISOString();
          $scope.fromDate = new Date($scope.fromDate);
          $scope.fromDate.setHours(0,0,0,0);
          $scope.fromDate1 = new Date($scope.fromDate.getTime()).toISOString();
        }
      CommitmentsService.listAll( {view: userView, page: $scope.currentPage,  filters: $scope.filter.data, tillDate:$scope.tillDate1, fromDate: $scope.fromDate1}, function(response) {
           $scope.totalPages =response.totalRecords;
           $scope.committmentsData=response.result;
           $scope.commitedAmount=response.commitedAmount;
           $scope.maturityAmount=response.maturityAmount;           
         });
    };

    $scope.cancelCommitment = function(key){
      $scope.cancel.adminComment = '';
      $scope.cancel.commitmentId = $scope.committmentsData[key].id;
      $scope.cancel.commitmentAmount = $scope.committmentsData[key].amount;
      $scope.cancel.userid = $scope.committmentsData[key].userid._id;
      $scope.cancel.commitmentTime = $scope.committmentsData[key].createdat;
      if($scope.committmentsData[key].status != 'CANCELLED'){
          $uibModal.open({
          templateUrl: 'app/admin/transactions/commitments/cancel-commitment.html',
          scope: $scope,
          size: 'md'
        });
      }      
    }

    $scope.doCancelCommitment = function(){
      CommitmentsService.cancelCommitment({commitmentId: $scope.cancel.commitmentId, adminComment:$scope.cancel.adminComment, commitmentAmount:$scope.cancel.commitmentAmount,userId: $scope.cancel.userid, commitmentTime:$scope.cancel.commitmentTime}, function(response){
        if(!response.error){
          //successfully cancelled commitment
          $scope.closeModal();
          $scope.loadPage();
        }
        else{
          console.log("Sorry, unable to cancel commitment.",response.message);
        }
      });
    }

    $scope.closeModal = function() {
      $uibModalStack.dismissAll();
      $scope.openModel = true;
    };


    $scope.exportDataAsExcel = function() {
      	if($scope.committmentsData.length > 0) {
        	var userView='';
      	if($scope.currentView !='All')
        	var userView=$scope.currentView

	    CommitmentsService.listAll({filters: $scope.filter.data, view: userView, tillDate:$scope.tillDate, fromDate: $scope.fromDate, excel:true}, function(res){
	      if(!res.error) {
	        $scope.exportMessage = '';
	        var filepath = '/api/utilities/export/' + res.file;
	        $window.open( filepath );
	      } else {
	        $scope.exportMessage = res.message;
	      }
	    });
	  } else {
	    $scope.exportMessage = 'There are no records to export';
	  }
	};

    $scope.loadPage();

    // logic for date filter
    $scope.tillDate = '';
    $scope.fromDate = '';
    //$scope.fromDate.setDate($scope.tillDate.getDate() - 7);

    $scope.dateFormat = 'yyyy-MM-dd';
    $scope.fromDateOptions = {
      formatYear: 'yy',
      startingDay: 1,
      showWeeks: false,
      //minDate: new Date(),
      maxDate: new Date()
    };

    $scope.fromDatePopup = {
      opened: false
    };
    $scope.tillDateOptions = {
      formatYear: 'yy',
      startingDay: 1,
      showWeeks: false,
      minDate: $scope.fromDate,
      maxDate: new Date()
    };

    $scope.tillDatePopup = {
      opened: false
    };

    $scope.$watch('fromDate', function (nv) {
      $scope.tillDateOptions.minDate = nv;
    });

    $scope.$watch('tillDate', function (nv) {
      if(nv)
        $scope.fromDateOptions.maxDate = new Date(nv.getTime()-(86400000));
    });

    $scope.OpentillDate = function () {
      $scope.tillDatePopup.opened = !$scope.tillDatePopup.opened;
      $scope.fromDatePopup.opened = false;
    };


    $scope.OpenfromDate = function () {
      $scope.fromDatePopup.opened = !$scope.fromDatePopup.opened;
      $scope.tillDatePopup.opened = false;
    };

    $scope.filterbyDate = function(){

    }



  }) // controller ends here