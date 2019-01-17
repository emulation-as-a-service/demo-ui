module.exports = ["$http", "$rootScope", "$scope", "$state", "$stateParams", "environmentList", "localConfig",
            "growl", "$translate", "objectDependencies", "helperFunctions", "operatingSystemsMetadata", "softwareList", "$uibModal",
             "$timeout", "nameIndexes", "REST_URLS",
            function ($http, $rootScope, $scope, $state, $stateParams, environmentList, localConfig,
            growl, $translate, objectDependencies, helperFunctions, operatingSystemsMetadata, softwareList, $uibModal,
            $timeout, nameIndexes, REST_URLS) {

           let handlePrefix = "11270/";
           var vm = this;

           let emulatorContainerVersionSpillter = "|";

           vm.showAdvanced = false;
           vm.landingPage = localConfig.data.landingPage;

           var envList = null;
           vm.isObjectEnv = $stateParams.objEnv;

           vm.operatingSystemsMetadata = {};
           if(operatingSystemsMetadata)
             vm.operatingSystemsMetadata = operatingSystemsMetadata.data.operatingSystemInformations;

           this.dependencies = objectDependencies.data;
           vm.isObjectEnv = $stateParams.objEnv;

           envList = environmentList.data.environments;
           this.env = null;

           for(var i = 0; i < envList.length; i++) {
               if (envList[i].envId === $stateParams.envId) {
                   this.env = envList[i];
                   break;
               }
           }

           if(!this.env)
           {
               growl.error("Environment not found");
               $state.go('admin.standard-envs-overview', {}, {reload: true});
           }

        vm.emulator = this.env.emulator;

        console.log("vm.emulator ", vm.emulator);

        vm.showDateContextPicker = false;

        nameIndexes.data.entries.entry.forEach(function (element, i) {
            console.log("element.key ", element.key);
            console.log("element ", element);
            if (!element.key.toLowerCase().includes(vm.emulator.toLowerCase()))
                delete nameIndexes.data.entries.entry[i];
        });

        vm.nameIndexes = nameIndexes.data.entries.entry ?  nameIndexes.data.entries.entry : [];
        vm.getNameIndexObj = function(key, name, version){
            return             {
                key: key,
                value: {
                    name: name,
                    value: version
                }
            }
        };
        // Since the values are null, EmuBean would decide to use latest version from aliases
        vm.nameIndexes.unshift(vm.getNameIndexObj("latest", null, null));

        if (typeof this.env.containerName !== "undefined" && typeof this.env.containerVersion !== "undefined")
            vm.emulatorContainer = vm.getNameIndexObj(this.env.containerName + "|" + this.env.containerVersion,
                this.env.containerName,
                this.env.containerVersion);
        else  vm.emulatorContainer = vm.getNameIndexObj("latest", null, null);

        console.log(" vm.nameIndexes ",  vm.nameIndexes);
        console.log(" nameIndexes ",  nameIndexes);
        console.log(" vm.vm.emulatorContainer ",  vm.emulatorContainer);

           this.envTitle = this.env.title;
           this.author = this.env.author;
           this.envDescription = this.env.description;
           this.envHelpText = this.env.helpText;
           this.enableRelativeMouse = this.env.enableRelativeMouse;
           this.enablePrinting = this.env.enablePrinting;
           this.nativeConfig = this.env.nativeConfig;
           this.enableInternet = this.env.enableInternet;
           this.serverMode = this.env.serverMode;
           this.localServerMode = this.env.localServerMode;
           this.enableSocks = this.env.enableSocks;
           this.serverIp = this.env.serverIp;
           this.serverPort = this.env.serverPort;
           this.gwPrivateIp = this.env.gwPrivateIp;
           this.gwPrivateMask = this.env.gwPrivateMask;
           this.useXpra = this.env.useXpra;
           this.connectEnvs = this.env.connectEnvs;
           this.canProcessAdditionalFiles = this.env.canProcessAdditionalFiles;
           this.shutdownByOs = this.env.shutdownByOs;

           for (var i = 0; i < vm.operatingSystemsMetadata.length; i++) {
                console.log(vm.operatingSystemsMetadata[i].id + " " + this.env.os);
                if (vm.operatingSystemsMetadata[i].id === this.env.os)
                {
                    this.os = vm.operatingSystemsMetadata[i];
                }
           }

           this.userTag = this.env.userTag;

           if(localConfig.data.features.handle) {
               $http.get(localConfig.data.eaasBackendURL + REST_URLS.getHandleList).then(function (response) {
                   if (response.data.handles.includes(handlePrefix + vm.env.envId.toUpperCase())) {
                       vm.handle = handlePrefix + vm.env.envId;
                   }
               });
           }

           vm.createHandle = function () {
                    jQuery.when(
                        $http.post(localConfig.data.eaasBackendURL + REST_URLS.postHandleValue, {
                            handle: handlePrefix + vm.env.envId,
                            value: vm.landingPage + "?id=" + vm.env.envId
                        })
                    ).then(function (response) {
                        console.log("response  ", response);
                        console.log("response.status   ", response.status);
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
               this.env.helpText = this.envHelpText;
               $http.post(localConfig.data.eaasBackendURL + REST_URLS.updateDescriptionUrl, {
                   envId: $stateParams.envId,
                   title: this.envTitle,
                   author: this.author,
                   description: this.envDescription,
                   helpText: this.envHelpText,
                   time: timecontext,
                   enablePrinting: vm.enablePrinting,
                   enableRelativeMouse: this.enableRelativeMouse,
                   shutdownByOs: this.shutdownByOs,
                   os: this.os ? this.os.id : null,
                   userTag: this.userTag,
                   useXpra : this.useXpra,
                   enableInternet: this.enableInternet,
                   serverMode: this.serverMode,
                   localServerMode: this.localServerMode,
                   enableSocks: this.enableSocks,
                   serverIp : this.serverIp,
                   serverPort : this.serverPort,
                   gwPrivateIp: this.gwPrivateIp,
                   gwPrivateMask: this.gwPrivateMask,
                   nativeConfig: this.nativeConfig,
                   connectEnvs : this.connectEnvs,
                   processAdditionalFiles : vm.canProcessAdditionalFiles,
                   containerEmulatorName : vm.emulatorContainer.value.name,
                   containerEmulatorVersion : vm.emulatorContainer.value.version
           }).then(function(response) {
                   if (response.data.status === "0") {
                       growl.success($translate.instant('JS_ENV_UPDATE'));
                   } else {
                       growl.error(response.data.message, {title: 'Error ' + response.data.status});
                   }

                   if (vm.isObjectEnv)
                       $state.go('admin.standard-envs-overview', {showObjects: true}, {reload: true});
                   else
                       $state.go('admin.standard-envs-overview', {}, {reload: true});
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

          vm.checkState = function(_taskId, _modal)
          {
              var taskInfo = $http.get(localConfig.data.eaasBackendURL + helperFunctions.formatStr(REST_URLS.getTaskState, _taskId)).then(function(response)
              {
                  if(response.data.status == "0")
                  {
                       if(response.data.isDone)
                       {
                          console.log("task finished " + _taskId);
                          growl.success("replication finished.");
                          $state.go('admin.standard-envs-overview', { }, {reload: true});
                          _modal.close();
                       }
                       else
                           $timeout(function() {vm.checkState(_taskId, _modal);}, 2500);
                   }
                   else
                   {
                      growl.error("error replicating image " + response.data.message);
                      _modal.close();
                   }
              });
          };

          vm.replicateImage = function(envId) {
              if (!window.confirm(`Resources published to the EaaSI network cannot be easily removed.
Do not share software or environments with existing access or license restrictions.

Do you want to publish this environment to the network?`))
                   return false;

              console.log("replicating " + envId);
              var modal = $uibModal.open({
                   animation: true,
                   template: require('./modals/wait.html')
               });
              $http.post(localConfig.data.eaasBackendURL + REST_URLS.replicateImage,
              {
                  replicateList : [envId],
                  destArchive : "public"
              }).then(function(response) {
                  if(response.data.status === "0")
                  {
                       var taskId = response.data.taskList[0];
                       vm.checkState(taskId, modal);
                  }
                  else
                  {
                      modal.close();
                      growl.error("error replicating image");
                      $state.go('admin.standard-envs-overview');
                  }
              }, function(response) {
                   modal.close();
                   growl.error("error replicating image: " + response.data.message);
                   $state.go('admin.standard-envs-overview');
              });
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
}];

