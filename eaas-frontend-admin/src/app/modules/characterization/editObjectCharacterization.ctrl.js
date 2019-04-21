module.exports = ['$scope', '$state', '$stateParams', '$uibModal', '$http', 'Objects', 'softwareObj', 'osList',
                     'localConfig', 'environmentList', 'growl', '$translate', 'helperFunctions', 'REST_URLS',
                      function ($scope, $state, $stateParams, $uibModal, $http, Objects, softwareObj, osList,
                      localConfig, environmentList, growl, $translate, helperFunctions, REST_URLS) {
     var vm = this;
    console.log("$stateParams.userDescription", $stateParams.userDescription);

     vm.objectId = $stateParams.objectId;
     vm.objectArchive = $stateParams.objectArchive;
     vm.isSoftware = !($stateParams.swId === "-1");
     vm.softwareObj = softwareObj.data;
     vm.osList = osList;

     if(!$stateParams.objectArchive)
        $stateParams.objectArchive = "default";

     Objects.get({archiveId: $stateParams.objectArchive, objectId: $stateParams.objectId}).$promise.then(function(response) {
        vm.metadata = response.metadata;
        vm.objEnvironments = response.objectEnvironments.environmentList;
        vm.suggested = response.objectEnvironments.suggested;
        vm.fileFormatMap = response.objectEnvironments.fileFormatMap;
        console.log(response);
     });
     vm.description = $stateParams.userDescription;

     vm.automaticCharacterization = function(updateClassification, updateProposal) {
         if (window.confirm($translate.instant('JS_START_CHAR'))) {
             $("html, body").addClass("wait");
             $(".fullscreen-overlay-spinner").show();

             Objects.get({
                archiveId: $stateParams.objectArchive,
                objectId: $stateParams.objectId,
                updateClassification: updateClassification,
                updateProposal, updateProposal
                }).$promise.then(function(response) {
                    vm.suggested = response.objectEnvironments.suggested;
                    vm.metadata = response.metadata;
                    vm.fileFormatMap = response.objectEnvironments.fileFormatMap;
                    vm.objEnvironments.length = 0;
                    vm.objEnvironments.push.apply(vm.objEnvironments, response.objectEnvironments.environmentList);
             })['finally'](function() {
                 $("html, body").removeClass("wait");
                 $(".fullscreen-overlay-spinner").hide();
//                 $state.transitionTo($state.current, $stateParams, {
//                     reload: true,
//                     inherit: false,
//                     notify: true
//                 });
             });
         }
     };

     vm.openDefaultEnvDialog = function(osId, osLabel) {
         $uibModal.open({
             animation: true,
             template: require('./modals/set-default-environment.html'),
             controller: ["$scope", "helperFunctions", "REST_URLS", function($scope, helperFunctions, REST_URLS) {
                 this.defaultEnv = null;
                 this.environments = environmentList.data.environments;
                 this.osId = osId;
                 this.osLabel = osLabel;

                 this.setEnvironment = function() {
                     $http.get(localConfig.data.eaasBackendURL + helperFunctions.formatStr(REST_URLS.setDefaultEnvironmentUrl, this.osId, this.defaultEnv.envId))
                         .then(function(response) {
                             if (response.data.status !== "0") {
                                 growl.error(response.data.message, {title: 'Error ' + response.data.message});
                                 $scope.$close();
                             }
                             else {
                                 console.log("set default env for " + osId + " defaultEnv " + this.defaultEnv.envId);
                             }
                     })['finally'](function() {
                         $scope.$close();
                         $state.reload();
                     });
                 };
             }],
             controllerAs: "setDefaultEnvDialogCtrl"
         });
     };

     vm.openAddEnvDialog = function() {
         $uibModal.open({
             animation: true,
             template: require('./modals/add-environment.html'),
             controller: ['$scope', function($scope) {
                 this.newEnv = null;
                 this.environments = environmentList.data.environments;
                 this.addEnvironment = function() {
                     // check if environment was already added
                     for (var i = 0; i < vm.objEnvironments.length; i++) {
                         if (vm.objEnvironments[i].id === this.newEnv.envId) {
                             growl.warning($translate.instant('JS_ENV_ERR_DUP'));
                             return;
                         }
                     }

                     vm.objEnvironments.push({
                         "id": this.newEnv.envId,
                         "label": this.newEnv.title
                     });
                     $scope.$close();
                 }
             }],
             controllerAs: "addEnvDialogCtrl"
         });
     };

     vm.removeEnvironment = function(env) {
         if (vm.objEnvironments.length === 1) {
             growl.error($translate.instant('JS_ENV_ERR_ZERO'));
             return;
         }

         var i;
         for (i = 0; i < vm.objEnvironments.length; i++) {
             if (vm.objEnvironments[i].id === env.id) {
                 break;
             }
         }
         vm.objEnvironments.splice(i, 1);
     };

     vm.resetChanges = function()
     {
         if (window.confirm($translate.instant('CHAR_CONFIRM_RESET_T'))) {
             $http.post(localConfig.data.eaasBackendURL + REST_URLS.overrideObjectCharacterizationUrl, {
                 objectId: $stateParams.objectId,
                 environments: []
             }).then(function() {
                 $state.go('admin.object-overview');
             });
         }
     }

     vm.saveCharacterization = function() {
             console.log("vm.description " , vm.description);
         $http.post(localConfig.data.eaasBackendURL + REST_URLS.overrideObjectCharacterizationUrl, {
             objectId: $stateParams.objectId,
             objectArchive: $stateParams.objectArchive,
             environments: vm.objEnvironments,
             description: vm.description,
         }).then(function() {
             $state.go('admin.object-overview');
         });
     };

     vm.saveSoftware = function() {
        vm.softwareObj.objectId = $stateParams.objectId;
        vm.softwareObj.label = vm.softwareObj.objectId;
        vm.softwareObj.archiveId = $stateParams.objectArchive;

        if(vm.softwareObj.isOperatingSystem && vm.operatingSystemId)
        {
           vm.operatingSystemId.puids.forEach(function(puid) {
              if(!vm.softwareObj.nativeFMTs.includes(puid.puid))
              {
                  vm.softwareObj.nativeFMTs.push(puid.puid);
              }
           });

        }
        // console.log(JSON.stringify(vm.softwareObj));
        $http.post(localConfig.data.eaasBackendURL + REST_URLS.saveSoftwareUrl, vm.softwareObj).then(function(response) {
           if (response.data.status === "0") {
               growl.success(response.data.message);
               $state.go('admin.sw-overview', {}, {reload: true});

           } else {
               growl.error(response.data.message, {title: 'Error ' + response.data.status});
           }
     });
   };
 }];