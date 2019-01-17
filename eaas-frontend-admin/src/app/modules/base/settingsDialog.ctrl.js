module.exports = ['$state', '$http', '$scope', '$uibModal', 'localConfig', 'kbLayouts', 'growl',  '$timeout', '$uibModalStack','REST_URLS', 'helperFunctions',
    function ($state, $http, $scope, $uibModal, localConfig, kbLayouts, growl, $timeout, $uibModalStack, REST_URLS, helperFunctions)
{
     var vm = this;

     vm.emulator = null;
     vm.emulatorType = null;
     vm.fstype = "ext4";
     vm.alias = "";
     vm.version = null;
     vm.emulators = ["qemu-system", "basilisk2", "beebem", "hatari", "kegs-sdl", "pce-atari-st", "pce-ibmpc", "sheepshaver", "vice-sdl", "fs-uae", "contralto", "visualboyadvance"];
    $scope.runtime = 0;

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

       //Next Step
     vm.import = function () {

         var convertedEnv = [];
         var convertedArgs = [];
         var escapeEl = document.createElement('textarea');

         if (vm.imageType === "dockerhub") {
             vm.archiveType = "dockerhub";
         }

         var unescape = function (html) {
             escapeEl.innerHTML = html;
             return escapeEl.textContent;
         };

         $http.post(localConfig.data.eaasBackendURL + REST_URLS.importEmulator,
             {
                 urlString: vm.imageUrl,
                 runtimeID: vm.runtime,
                 name: vm.name,
                 tag: vm.tag,
                 alias: vm.alias,
                 version: vm.version,
                 emulatorType: vm.emulatorType,
                 fstype: vm.fstype,
                 isEmulator: true,
                 processArgs: [""],
                 processEnvs: vm.env,
                 inputFolder: vm.imageInput,
                 outputFolder: vm.imageOutput,
                 imageType: "dockerhub",
                 title: vm.title,
                 description: vm.containerDescription,
                 author: vm.author,
                 guiRequired: vm.gui
             }).then(function (response) {

             if (response.data.status === "0") {
                 var taskId = response.data.taskId;
                 vm.modal = $uibModal.open({
                     backdrop: 'static',
                     animation: true,
                     templateUrl: 'partials/wait.html'
                 });
                 vm.checkState(taskId, true);
                 $uibModalStack.dismissAll();
             }
             else {
                 $state.go('error', {errorMsg: {title: 'Error ' + response.data.message + "\n\n" + vm.description}});
                 $uibModalStack.dismissAll();
             }
         });
     };

     vm.checkState = function (_taskId, stayAtPage) {
         var taskInfo = $http.get(localConfig.data.eaasBackendURL + helperFunctions.formatStr(REST_URLS.getContainerTaskState, _taskId)).then(function (response) {
             if (response.data.status == "0") {
                 if (response.data.isDone) {

                     vm.id = response.data.userData.environmentId;
                     vm.modal.close();
                     growl.success("import successful.");
                     $state.go('admin.standard-envs-overview', {}, {reload: true});
                 }
                 else
                     $timeout(function () {
                         vm.checkState(_taskId, stayAtPage);
                     }, 2500);
             }
             else {
                 vm.modal.close();
                 $state.go('error', {errorMsg: {title: 'Error ' + response.data.message}});
             }
         });
     };
 }];