module.exports = ['$scope', '$state', '$stateParams', '$uibModal', '$http', 'Objects', 'softwareObj', 'osList',
                     'localConfig', 'Environments', 'growl', '$translate', 'helperFunctions', 'REST_URLS', '$timeout', 'EaasClientHelper',
                      function ($scope, $state, $stateParams, $uibModal, $http, Objects, softwareObj, osList,
                      localConfig, Environments, growl, $translate, helperFunctions, REST_URLS, $timeout, EaasClientHelper) {
     var vm = this;
    console.log("$stateParams.userDescription", $stateParams.userDescription);

     vm.objectId = $stateParams.objectId;
     vm.objectArchive = $stateParams.objectArchive ? $stateParams.objectArchive : null;
     vm.isSoftware = !($stateParams.swId === "-1");
     vm.softwareObj = softwareObj.data;
     vm.osList = osList;
     vm.objEnvironments = [];

     Objects.get({archiveId: vm.objectArchive, objectId: vm.objectId}).$promise.then(function(response) {
        vm.metadata = response.metadata;
        vm.response = response;
        vm.objEnvironments = response.objectEnvironments.environmentList;
     });

    Environments.query().$promise.then(function(response) {
        vm.environmentList = response;
    });

     vm.description = $stateParams.userDescription;

     vm.checkState = function(_taskId, _modal)
     {
        $http.get(localConfig.data.eaasBackendURL + `tasks/${_taskId}`).then(function(response){
            if(response.data.status == "0")
            {
                if(response.data.isDone)
                {
                    _modal.close();
                    if(response.data.object) {
                        let classificationResult = JSON.parse(response.data.object);
                        vm.suggested = classificationResult.suggested;
                        vm.fileFormatMap = classificationResult.fileFormatMap;
                        vm.objEnvironments.push.apply(vm.objEnvironments, classificationResult.environmentList);
                    }
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

     vm.automaticCharacterization = function(updateClassification, updateProposal) {
         if (window.confirm($translate.instant('JS_START_CHAR'))) {
             
             const modal = $uibModal.open({
                animation: true,
                template: require('./modals/wait.html'),
                controller: ["$scope", function($scope) {

                    this.info = {msg : "Please wait", title : "Analysing object" };
                }],
                controllerAs: "waitMsgCtrl"
            });

             $http.post(localConfig.data.eaasBackendURL + `classification` , {
                archiveId: $stateParams.objectArchive,
                objectId: $stateParams.objectId,
                updateClassification: updateClassification,
                updateProposal: updateProposal
                }).then(function(response) {
                    vm.checkState(response.data.taskId, modal);
                }, function(error) {
                    console.log(error);
                    modal.close();
                });
         }
     };

     vm.openAddEnvDialog = function() {
         $uibModal.open({
             animation: true,
             template: require('./modals/add-environment.html'),
             controller: ['$scope', function($scope) {
                 this.newEnv = null;
                 this.environments = vm.environmentList;

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

     vm.run = async function(envId)
     {
        let components = [];
        let machine = EaasClientHelper.createMachine(envId);
        if(vm.objectId)
            machine.setObject(vm.objectId, vm.objectArchive);
        components.push(machine);

        let clientOptions = await EaasClientHelper.clientOptions(envId);
        $state.go("admin.emuView",  {
            components: components, 
            clientOptions: clientOptions,
            type: 'objectEnvironment',
            returnToObjects: !vm.isSoftware
        }, {}); 
    }

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
        if(vm.metadata)
            vm.softwareObj.label = vm.metadata.title;

        vm.softwareObj.isPublic = vm.isPublic;
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