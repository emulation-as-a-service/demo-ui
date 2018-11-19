module.exports = ['$rootScope', '$timeout', '$http', '$state', '$stateParams', 'environmentList', 'objectEnvironmentList', 'localConfig', 'growl', '$translate',
    '$uibModal', 'softwareList', 'helperFunctions', 'containerEnvironmentList', 'REST_URLS',
    function ($rootScope, $timeout, $http, $state, $stateParams, environmentList, objectEnvironmentList,
        localConfig, growl, $translate, $uibModal, softwareList, helperFunctions, containerEnvironmentList, REST_URLS) {
        var vm = this;
        vm.config = localConfig.data;
        vm.landingPage = localConfig.data.landingPage;
        vm.view = 0;
        if($stateParams.showContainers)
            vm.view = 2;
        else if($stateParams.showObjects)
            vm.view = 1;

        if (environmentList.data.status !== "0") {
            $state.go('error', {errorMsg: {title: "Load Environments Error " + environmentList.data.status, message: environmentList.data.message}});
            return;
        }

        vm.exportEnvironment = function(envId) {

            $http.get(localConfig.data.eaasBackendURL + helperFunctions.formatStr(REST_URLS.exportEnvironmentUrl, envId))
                .then(function(response) {
                    if (response.data.status === "0") {
                        growl.success("export successful");
                    } else {
                        growl.error(response.data.message, {title: 'Error ' + response.data.status});
                    }
                });

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
                     console.log(response.data.taskList)
                     var taskId = response.data.taskList[0];
                     vm.checkState(taskId, modal);
                }
                else
                {
                    modal.close();
                    growl.error("error replicating image");
                    $state.go('admin.standard-envs-overview');
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

        var confirmDeleteFn = function(envId)
        {
            console.log("confirmed");
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


        vm.deleteContainer = function (envId) {
            $rootScope.chk.transitionEnable = false;
            if (window.confirm($translate.instant('JS_DELENV_OK'))) {
                $http.post(localConfig.data.eaasBackendURL + REST_URLS.deleteContainerUrl, {
                    envId: envId,
                    deleteMetaData: true,
                    deleteImage: true,
                    force: false
                }).then(function (response) {
                    if (response.data.status === "0") {
                        // remove env locally
                        vm.envs = vm.envs.filter(function (env) {
                            return env.envId !== envId;
                        });
                        $rootScope.chk.transitionEnable = true;
                        growl.success($translate.instant('JS_DELENV_SUCCESS'));
                        $state.go('admin.standard-envs-overview', {
                            showContainers: true,
                            showObjects: false
                        }, {reload: true});
                    }
                    else {
                        $rootScope.chk.transitionEnable = true;
                        growl.error(response.data.message, {title: 'Error ' + response.data.status});
                        $state.go('admin.standard-envs-overview', {
                            showContainers: true,
                            showObjects: false
                        }, {reload: true});
                    }
                });
            }
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
                        // remove env locally
                        vm.envs = vm.envs.filter(function(env) {
                            return env.envId !== envId;
                        });
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
                });
            }
        };
        vm.envs = environmentList.data.environments;
        vm.objEnvs = objectEnvironmentList.data.environments;
        vm.containerEnvs = containerEnvironmentList.data.environments;
        vm.showObjects = $stateParams.showObjects;
        vm.showContainers = $stateParams.showContainers;
    }];