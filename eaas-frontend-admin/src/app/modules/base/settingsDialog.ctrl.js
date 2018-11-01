module.exports = ['$state', '$http', '$scope', '$uibModal', 'localConfig', 'kbLayouts', 'growl', 'REST_URLS', function ($state, $http, $scope, $uibModal, localConfig, kbLayouts, growl, REST_URLS) {
     var vm = this;
     vm.serverLogUrl = localConfig.data.eaasBackendURL + "Emil/serverLog";
     vm.usageLogUrl = localConfig.data.eaasBackendURL + "Emil/usageLog";
     vm.importEnvs = function () {
         $scope.$close();

         $http.get(localConfig.data.eaasBackendURL + REST_URLS.initEmilEnvironmentsURL).then(function (response) {
                 if (response.data.status === "0") {
                     $state.go('admin.standard-envs-overview', {}, {reload: true});
                     growl.success(response.data.message);
                 } else {
                     growl.error(response.data.message, {title: 'Error ' + response.data.status});
                 }
             }
         );
     };

     vm.openLogs = function(url) {
         window.open(url);
     }

     vm.syncObjects = function () {
         $scope.$close();

         $http.get(localConfig.data.eaasBackendURL + REST_URLS.syncUrl).then(function (response) {
                 if (response.data.status === "0") {
                     $state.go('admin.standard-envs-overview', {}, {reload: true});
                     growl.success(response.data.message);
                 } else {
                     growl.error(response.data.message, {title: 'Error ' + response.data.status});
                 }
             }
         );
     };

     vm.syncImages = function () {
         $scope.$close();

         $http.get(localConfig.data.eaasBackendURL + REST_URLS.syncImagesUrl).then(function (response) {
                 if (response.data.status === "0") {
                     $state.go('admin.standard-envs-overview', {}, {reload: true});
                     growl.success(response.data.message);
                 } else {
                     growl.error(response.data.message, {title: 'Error ' + response.data.status});
                 }
             }
         );
     };
     vm.showSetKeyboardLayoutDialog = function () {
         $uibModal.open({
             animation: true,
             template: require('./modals/set-keyboard-layout.html'),
             resolve: {
                 kbLayouts: function () {
                     return kbLayouts; // refers to outer kbLayouts variable
                 }
             },
             controller: "SetKeyboardLayoutDialogController as setKeyboardLayoutDialogCtrl"
         });
     };
 }];