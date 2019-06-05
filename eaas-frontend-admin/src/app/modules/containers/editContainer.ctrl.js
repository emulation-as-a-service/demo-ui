module.exports = ['$http', '$scope', '$state', '$stateParams', 'emilEnvironments', 'Environments', 'localConfig', 'growl', '$translate', 'REST_URLS',
    function ($http, $scope, $state, $stateParams, emilEnvironments, Environments, localConfig, growl, $translate, REST_URLS) {
        var vm = this;
        let handlePrefix = "11270/";
        vm.isOpen = false;
        vm.emilEnvironments = emilEnvironments;

        vm.showDateContextPicker = false;

        Environments.get({envId: $stateParams.envId}).$promise.then(function(response) {
            vm.env = response;

            if(localConfig.data.features.handle) {
                $http.get(localConfig.data.eaasBackendURL + REST_URLS.getHandleList).then(function (response) {
                    if (response.data.handles.includes(handlePrefix + vm.env.envId.toUpperCase())) {
                        vm.handle = handlePrefix + vm.env.envId;
                    }
                });
            }

            vm.envTitle = vm.env.title;
            vm.author = vm.env.author;
            vm.description = vm.env.description;
            vm.envInput = vm.env.input;
            vm.envOutput = vm.env.output;
            vm.processArgs = vm.env.processArgs; // todo deep copy
            vm.processEnvs = vm.env.processEnvs;

            if(typeof vm.env.runtimeId != "undefined" && vm.env.runtimeId !== "")
                vm.emilEnvironments.forEach(function(element) {
                    // we only support images and environments
                    if(element.envId === vm.env.runtimeId){
                        vm.containerRuntimeEnv = element;
                        return true;
                    }
                });
        });

        vm.saveEdit = function () {

            if(vm.processArgs.length === 0){
                growl.error('Process is required');
                return;
            }

            vm.env.title = vm.envTitle;
            vm.env.input = vm.envInput;
            vm.env.output = vm.envOutput;
            vm.env.author = vm.author;
            vm.env.description = vm.description;
            vm.env.processArgs = vm.processArgs;
            vm.env.processEnvs = vm.processEnvs;
            vm.env.containerRuntimeEnv = vm.containerRuntimeEnv;

            console.log("vm.containerRuntimeEnv", vm.containerRuntimeEnv);

            $http.post(localConfig.data.eaasBackendURL + REST_URLS.updateContainerUrl, {
                id: $stateParams.envId,
                title: vm.envTitle,
                author: vm.author,
                description: vm.description,
                outputFolder: vm.envOutput,
                inputFolder: vm.envInput,
                processEnvs: vm.processEnvs,
                processArgs: vm.processArgs,
                containerRuntimeId: vm.containerRuntimeEnv.envId
            }).then(function (response) {
                if (response.data.status === "0") {
                    growl.success($translate.instant('JS_ENV_UPDATE'));
                } else {
                    growl.error(response.data.message, {title: 'Error ' + response.data.status});
                }
                $state.go('admin.standard-envs-overview', {showObjects: false, showContainers: true}, {reload: true});
            });
        };

        vm.createHandle = function () {
            jQuery.when(
                $http.post(localConfig.data.eaasBackendURL + REST_URLS.postHandleValue, {
                    handle: handlePrefix + vm.env.envId,
                    value: localConfig.data.landingPage + "?id=" + vm.env.envId
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
    }];