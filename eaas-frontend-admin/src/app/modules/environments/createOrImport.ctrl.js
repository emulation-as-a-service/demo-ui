module.exports = ["$http", "$scope", "$state", "$stateParams", "systemList", "softwareList", "growl", "localConfig", "$uibModal", "$timeout", "helperFunctions", "REST_URLS",
    function ($http, $scope, $state, $stateParams, systemList, softwareList, growl, localConfig, $uibModal, $timeout, helperFunctions, REST_URLS) {
     var vm = this;



     vm.systems = systemList.data.systems;
     vm.softwareList = softwareList.data.descriptions;

     // initialize default values of the form
     vm.hdsize = 1024;
     vm.hdtype = 'url';
     vm.native_config = "";

     vm.imageId = "";
     vm.onSelectSystem = function(item, model) {
         vm.native_config = item.native_config;
     };

     vm.checkState = function(_taskId, _modal)
     {
        var taskInfo = $http.get(localConfig.data.eaasBackendURL + helperFunctions.formatStr(REST_URLS.getTaskState, _taskId)).then(function(response){
             if(response.data.status == "0")
             {
                 if(response.data.isDone)
                 {
                     _modal.close();
                     growl.success("import finished.");
                     $state.go('admin.emulator', {envId: response.data.userData.environmentId, type: 'saveImport' });
                 }
                 else
                     $timeout(function() {vm.checkState(_taskId, _modal);}, 2500);
             }
             else
             {
                 _modal.close();
             }
         });
     };

        vm.changeKvmState = function () {
            if (typeof vm.native_config !== 'undefined') {
                if (vm.native_config.includes('-enable-kvm')) {
                    vm.native_config = vm.native_config.replace(' -enable-kvm', '');
                } else {
                    vm.native_config = vm.native_config.concat(' -enable-kvm');
                }
            } else console.error("naive config is not defined")
        };

        vm.checkeKvmState = function () {
            if (vm.native_config){
            return vm.native_config.includes('-enable-kvm');
            } else return false;
        };

     vm.start = function() {
         if (vm.hdtype == 'new') {
             $http.post(localConfig.data.eaasBackendURL + REST_URLS.createEnvironmentUrl, {
                 size: vm.hdsize + 'M',
                 templateId: vm.selectedSystem.id,
                 label: vm.name, urlString: vm.hdurl,
                     nativeConfig: vm.native_config
             }).then(function(response) {
                 if (response.data.status !== "0")
                     growl.error(response.data.message, {title: 'Error ' + response.data.status});
                 $state.go('admin.emulator', {envId: response.data.id, type: 'saveCreatedEnvironment', softwareId: vm.selectedSoftware.id});
             });
         } else {
             $http.post(localConfig.data.eaasBackendURL + REST_URLS.importImageUrl,
                 {
                     urlString: vm.hdurl,
                     templateId: vm.selectedSystem.id,
                     label: vm.name,
                     nativeConfig: vm.native_config,
                     rom: vm.rom
                 }).then(function(response) {
                     if(response.data.status == "0") {
                         var taskId = response.data.taskId;
                        var modal = $uibModal.open({
                            animation: true,
                            backdrop: 'static',
                            template: require('./modals/wait.html')
                        });
                         vm.checkState(taskId, modal);
                     }
                     else
                     {
                         growl.error(response.data.message, {title: 'Error ' + response.data.status});
                     }
             }, function(response) {
                 console.log("error");
             });
         }
     };
 }];