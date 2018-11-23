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

        vm.envs = environmentList.data.environments;
        vm.objEnvs = objectEnvironmentList.data.environments;
        vm.containerEnvs = containerEnvironmentList.data.environments;
        vm.showObjects = $stateParams.showObjects;
        vm.showContainers = $stateParams.showContainers;
    }];