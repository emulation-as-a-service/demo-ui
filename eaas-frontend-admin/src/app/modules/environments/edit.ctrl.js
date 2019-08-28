import {publisher} from "./templates/publish-environment";

module.exports = ["$http", "$rootScope", "$scope", "$state", "$stateParams", "Environments", "localConfig",
            "growl", "$translate", "objectDependencies", "helperFunctions", "operatingSystemsMetadata", "softwareList", "$uibModal",
             "$timeout", "nameIndexes", "REST_URLS",
    function ($http, $rootScope, $scope, $state, $stateParams, Environments, localConfig,
            growl, $translate, objectDependencies, helperFunctions, operatingSystemsMetadata, softwareList, $uibModal,
            $timeout, nameIndexes, REST_URLS) {

       const replicateImage = publisher($http, $uibModal, $state, $timeout, growl, localConfig, REST_URLS, helperFunctions);
       let handlePrefix = "11270/";
       var vm = this;
       vm.networking = {};
       vm.config = localConfig.data;
       
       vm.editMode = false;
       let emulatorContainerVersionSpillter = "|";

       vm.showAdvanced = false;
       vm.landingPage = localConfig.data.landingPage;

       vm.isObjectEnv = $stateParams.objEnv;

       vm.operatingSystemsMetadata = {};
       if(operatingSystemsMetadata)
         vm.operatingSystemsMetadata = operatingSystemsMetadata.data.operatingSystemInformations;

       this.dependencies = objectDependencies.data;
       vm.isObjectEnv = $stateParams.objEnv;
       vm.emulator = null;

        this.env = {};
        if(!$stateParams.envId)
        {
            $state.go('admin.standard-envs-overview', {}, {reload: false});
            return;
        }

        vm.showDateContextPicker = false;

        Environments.get({envId: $stateParams.envId}).$promise.then(function(response) {
            vm.env = response;
            vm.emulator = vm.env.emulator;

            if (typeof vm.env.xpraEncoding != "undefined" && vm.env.xpraEncoding != null)
                vm.xpraEncoding = vm.env.xpraEncoding;
            else
                vm.xpraEncoding = "jpeg";

            vm.envTitle = vm.env.title;
            vm.author = vm.env.author;
            vm.envDescription = vm.env.description;
            vm.enableRelativeMouse = vm.env.enableRelativeMouse;
            vm.enablePrinting = vm.env.enablePrinting;
            vm.nativeConfig = vm.env.nativeConfig;
            if (vm.env.networking)
                vm.networking = vm.env.networking;
            vm.useXpra = vm.env.useXpra;
            vm.canProcessAdditionalFiles = vm.env.canProcessAdditionalFiles;
            vm.shutdownByOs = vm.env.shutdownByOs;
            vm.userTag = vm.env.userTag;
            vm.drives = vm.env.drives;
            vm.isLinuxRuntime = vm.env.isLinuxRuntime;

            for (var i = 0; i < vm.operatingSystemsMetadata.length; i++) {
                if (vm.operatingSystemsMetadata[i].id === vm.env.os)
                {
                    vm.os = vm.operatingSystemsMetadata[i];
                }
            }

            if(localConfig.data.features.handle) {
                $http.get(localConfig.data.eaasBackendURL + REST_URLS.getHandleList).then(function (response) {
                     if (response.data.handles.includes(handlePrefix + vm.env.envId.toUpperCase())) {
                         vm.handle = handlePrefix + vm.env.envId;
                     }
                });
            }

            let emulatorContainerName = null;
            if(nameIndexes.data.entries.entry) {
              nameIndexes.data.entries.entry.forEach(function (element, i) {
                  if (!element.key.toLowerCase().includes(vm.emulator.toLowerCase()))
                      delete nameIndexes.data.entries.entry[i];
                  else
                      emulatorContainerName = element.value.name;
              });
              vm.nameIndexes = nameIndexes.data.entries.entry;
            } else {
               vm.nameIndexes = [];
            }
            vm.nameIndexes.unshift(vm.getNameIndexObj("latest", emulatorContainerName, null));

            if (typeof vm.env.containerName !== "undefined" && typeof vm.env.containerVersion !== "undefined")
            {
              let name = vm.env.containerName;
              let version = vm.env.containerVersion;

              vm.nameIndexes.forEach(function(element, i)
              {
                  if(element.value.version === version)
                      vm.emulatorContainer = element;
              });
            }
            else
                vm.emulatorContainer = vm.nameIndexes[0];
        });

            vm.getNameIndexObj = function(key, name, version){
                  return {
                      key: key,
                      value: {
                          name: name,
                          version: version
                      }
                  }
            };

           vm.createHandle = function () {
                    jQuery.when(
                        $http.post(localConfig.data.eaasBackendURL + REST_URLS.postHandleValue, {
                            handle: handlePrefix + vm.env.envId,
                            value: vm.landingPage + "?id=" + vm.env.envId
                        })
                    ).then(function (response) {
                        if (response.status === 200) {
                            vm.handle = handlePrefix + vm.env.envId;
                        } else {
                            growl.error('Handle is not defined!!');
                        }
                    });
           };

           vm.addSoftware = function(envId) {
                 $uibModal.open({
                     animation: true,
                     template: require('./modals/select-sw.html'),
                     controller: ["$scope", function($scope) {
                         this.envId = envId;
                         this.software = softwareList.data.descriptions;
                         this.returnToObjects = $stateParams.showObjects;
                     }],
                     controllerAs: "addSoftwareDialogCtrl"
                 });
            };

           this.saveEdit = function() {
               var timecontext = null;
               if(this.showDateContextPicker)
               {
                   console.log('Date(UNIX Epoch): ' + vm.datetimePicker.date.getTime());
                   timecontext = vm.datetimePicker.date.getTime();
               }

               this.env.title = this.envTitle;
               this.env.description = this.envDescription;
               $http.post(localConfig.data.eaasBackendURL + REST_URLS.updateDescriptionUrl, {
                   envId: $stateParams.envId,
                   title: this.envTitle,
                   author: this.author,
                   description: this.envDescription,
                   time: timecontext,
                   enablePrinting: vm.enablePrinting,
                   enableRelativeMouse: this.enableRelativeMouse,
                   shutdownByOs: this.shutdownByOs,
                   os: this.os ? this.os.id : null,
                   userTag: this.userTag,
                   useXpra : this.useXpra,
                   nativeConfig: this.nativeConfig,
                   processAdditionalFiles : vm.canProcessAdditionalFiles,
                   networking : vm.networking,
                   containerEmulatorName : vm.emulatorContainer.value.name,
                   containerEmulatorVersion : vm.emulatorContainer.value.version,
                   xpraEncoding: vm.xpraEncoding,
                   drives : vm.drives,
                   linuxRuntime : vm.isLinuxRuntime
               }).then(function(response) {
                   if (response.data.status === "0") {
                       growl.success($translate.instant('JS_ENV_UPDATE'));
                   } else {
                       growl.error(response.data.message, {title: 'Error ' + response.data.status});
                   }
                   $state.go('admin.edit-env', {envId: response.data.id, objEnv: vm.isObjectEnv}, {reload: true});
               });
           };

           this.fork = function(revId) {
               $http.post(localConfig.data.eaasBackendURL + REST_URLS.forkRevisionUrl, {
                   id: revId
               }).then(function(response) {
                   if (response.data.status === "0") {
                       growl.success($translate.instant('JS_ENV_UPDATE'));
                       $state.go('admin.standard-envs-overview', {}, {reload: true});
                   } else {
                       growl.error(response.data.message, {title: 'Error ' + response.data.status});
                   }
                   $state.go('admin.standard-envs-overview', {}, {reload: true});
               });
           };

           this.revert = function(currentId, revId) {
               if (window.confirm($translate.instant('JS_REVERT_ENV_OK'))) {
                   $http.post(localConfig.data.eaasBackendURL + REST_URLS.revertRevisionUrl, {
                       currentId: currentId,
                       revId: revId
                   }).then(function (response) {
                       if (response.data.status === "0") {
                           growl.success($translate.instant('JS_ENV_UPDATE'));
                           $state.go('admin.standard-envs-overview', {}, {reload: true});
                       } else {
                           growl.error(response.data.message, {title: 'Error ' + response.data.status});
                       }
                       $state.go('admin.standard-envs-overview', {}, {reload: true});
                   });
               }
           };

           vm.isOpen = false;

           vm.datetimePicker = {
               date: new Date(),
               datepickerOptions: { },
               timepickerOptions: {
                   showMeridian: false
               },
               buttonBar: {
                   show: true,
                   now: {},
                   today: {},
                   clear: {
                       show: false
                   },
                   date: {},
                   time: {},
                   close: {},
                   cancel: {}
               }
           };

           if(this.env.timeContext)
           {
               vm.datetimePicker.date.setTime(this.env.timeContext);
               vm.showDateContextPicker = true;
           }

           if ($translate.use() === 'de') {
               vm.datetimePicker.buttonBar = {
                   show: true,
                   now: {
                       text: 'Jetzt'
                   },
                   today: {
                       text: 'Heute'
                   },
                   clear: {
                       show: false
                   },
                   date: {
                       text: 'Datum'
                   },
                   time: {
                       text: 'Zeit'
                   },
                   close: {
                       text: 'Schließen'
                   },
                   cancel: {}
               }
           }

           vm.openCalendar = function(e) {
               e.preventDefault();
               e.stopPropagation();

               vm.isOpen = true;
           };

        vm.replicateImage = function (envId, replicationType) {
            replicateImage(envId, replicationType)
        };

          var confirmDeleteFn = function(envId)
          {
              $http.post(localConfig.data.eaasBackendURL + REST_URLS.deleteEnvironmentUrl, {
                  envId: envId,
                  deleteMetaData: true,
                  deleteImage: true,
                  force: true
              }).then(function(_response) {
                  if (_response.data.status === "0") {
                      // remove env locally
                      vm.envs = vm.envs.filter(function(env) {
                          return env.envId !== envId;
                      });
                      $rootScope.chk.transitionEnable = true;
                      growl.success($translate.instant('JS_DELENV_SUCCESS'));
                      $state.go('admin.standard-envs-overview', {}, {reload: true});
                  }
                  else {
                      $rootScope.chk.transitionEnable = true;
                      growl.error(_response.data.message, {title: 'Error ' + _response.data.status});
                      $state.go('admin.standard-envs-overview', {}, {reload: true});
                  }
              });
          };

          vm.deleteEnvironment = function(envId) {
              $rootScope.chk.transitionEnable = false;
              if (window.confirm($translate.instant('JS_DELENV_OK'))) {
                  $http.post(localConfig.data.eaasBackendURL + REST_URLS.deleteEnvironmentUrl, {
                      envId: envId,
                      deleteMetaData: true,
                      deleteImage: true,
                      force: false
                  }).then(function(response) {
                      if (response.data.status === "0") {
                          $rootScope.chk.transitionEnable = true;
                          growl.success($translate.instant('JS_DELENV_SUCCESS'));
                          $state.go('admin.standard-envs-overview', {}, {reload: true});
                      }
                      else if (response.data.status === "2") {
                          $uibModal.open({
                              animation: true,
                              templateUrl: './modals/confirm-delete.html',
                              controller: ["$scope", function($scope) {
                                  this.envId = envId;
                                  this.confirmed = confirmDeleteFn;
                              }],
                              controllerAs: "confirmDeleteDialogCtrl"
                          });
                      }
                      else {
                          $rootScope.chk.transitionEnable = true;
                          growl.error(response.data.message, {title: 'Error ' + response.data.status});
                          $state.go('admin.standard-envs-overview', {}, {reload: true});
                      }
                  }, function (response) {
                      $rootScope.chk.transitionEnable = true;
                      growl.error(response.data.message, {title: 'Error ' + response.data.status});
                      $state.go('admin.standard-envs-overview', {}, {reload: true});
                  });
              }
          };

          vm.deleteDrive = function(index)
          {
              vm.drives.splice(index, 1);
          };

          vm.showDriveDetails = function(driveIdx) {
              $uibModal.open({
                  animation: true,
                  template: require('./modals/drive-details.html'),
                  controller: ["$scope", function($scope) {
                    this.drive = {};
                    if(driveIdx >= 0)
                       this.drive = vm.drives[driveIdx];

                    this.saveEdit = function()
                    {
                        if(driveIdx < 0)
                            vm.drives.push(this.drive);

                        console.log(vm.drives);
                    }
                  }],
                  controllerAs: "editDriveCtrl"
              });
          };
}];

