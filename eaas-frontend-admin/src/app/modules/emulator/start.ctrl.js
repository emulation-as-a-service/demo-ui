module.exports = ['$rootScope', '$uibModal', '$scope', '$sce', 'environmentList','objectEnvironmentList','$state', '$stateParams', '$cookies', '$translate', 'localConfig', 'growl', 'chosenEnv',
                                    function ($rootScope, $uibModal, $scope, $sce, environmentList, objectEnvironmentList, $state, $stateParams, $cookies, $translate, localConfig, growl, chosenEnv) {
        var vm = this;
        vm.envs = environmentList.data.environments.concat(objectEnvironmentList.data.environments);

        vm.runEmulator = function(selectedEnvs) {

            let type = "machine";

            window.eaasClient = new EaasClient.Client(localConfig.data.eaasBackendURL, $("#emulator-container")[0]);

            eaasClient.onError = function (message) {
                $state.go('error', {errorMsg: {title: "Emulation Error", message: message.error}});
            };

            window.onbeforeunload = function (e) {
                var dialogText = $translate.instant('MESSAGE_QUIT');
                e.returnValue = dialogText;
                return dialogText;
            };

            window.onunload = function () {
                window.onbeforeunload = null;
            };

            this.link = localConfig.data.baseEmulatorUrl + "/#/emulationSession?environmentId=" + $stateParams.envId;
            if ($stateParams.objectId)
                this.link += "&objectId=" + $stateParams.objectId;

            window.eaasClient.onEmulatorStopped = function () {
                if ($rootScope.emulator.state == 'STOPPED')
                    return;

                $rootScope.emulator.state = 'STOPPED';
                $("#emulator-container").hide();
                $("#emulator-loading-container").show();
                $("#emulator-loading-container").text($translate.instant('JS_EMU_STOPPED'));
                $scope.$apply();
            };

            // fallback to defaults when no cookie is found
            var kbLayoutPrefs = $cookies.getObject('kbLayoutPrefs') || {
                language: {name: 'us'},
                layout: {name: 'pc105'}
            };

            let params = {};
            if (chosenEnv.data) {
                params.hasTcpGateway = chosenEnv.data.serverMode;
                params.hasInternet = chosenEnv.data.enableInternet;
                if (params.hasTcpGateway) {
                    params.tcpGatewayConfig = {
                        socks: chosenEnv.data.enableSocks,
                        gwPrivateIp: chosenEnv.data.gwPrivateIp,
                        gwPrivateMask: chosenEnv.data.gwPrivateMask,
                        serverPort: chosenEnv.data.serverPort,
                        serverIp: chosenEnv.data.serverIp
                    };
                }
            }
            console.log(params);

            var envs = [];
            for (let i = 0; i < selectedEnvs.length; i++) {
                //since we can observe only single environment, keyboardLayout and keyboardModel are not relevant
                let data = createData(selectedEnvs[i].envId, "default", type, selectedEnvs[i].objectId, selectedEnvs[i].userId, selectedEnvs[i].softwareId);
                envs.push({data, visualize: false});
            }

            var archive = (chosenEnv.data) ? chosenEnv.data.archive : "default";
            let data = createData($stateParams.envId, archive, type, $stateParams.objectId, $stateParams.userId, $stateParams.softwareId, kbLayoutPrefs.language.name, kbLayoutPrefs.layout.name);

            if ($stateParams.type == 'saveUserSession') {
                data.lockEnvironment = true;
                console.log("locking user session");
            }

            function createData (envId, archive, type, objectId, userId, softwareId, keyboardLayout, keyboardModel) {
                let data = {};
                data.type = type;
                data.archive = archive;
                data.environment = envId;
                data.object = objectId;
                data.userId = userId;
                data.software = softwareId;

                if (typeof keyboardLayout != "undefined") {
                    data.keyboardLayout = keyboardLayout;
                }

                if (typeof keyboardModel != "undefined") {
                    data.keyboardModel = keyboardModel;
                }
                return data;
            };

            envs.push({data, visualize: true});

            eaasClient.start(envs, params).then(function () {
                eaasClient.connect().then(function () {
                    $("#emulator-loading-container").hide();
                    $("#emulator-container").show();

                    console.log(eaasClient.networkTcpInfo);
                    if (eaasClient.networkTcpInfo) {
                        var url = new URL(eaasClient.networkTcpInfo.replace(/^info/, 'http'));

                        console.log(url.hostname);
                        console.log(url.pathname);
                        var pathArray = url.pathname.split('/');
                        console.log(pathArray);

                        $("#emulator-info-container").text("connect to: " + url.hostname + " protocol " + pathArray[1] + " port " + pathArray[2]);
                    }

                    if (eaasClient.params.pointerLock === "true") {
                        growl.info($translate.instant('EMU_POINTER_LOCK_AVAILABLE'));
                        BWFLA.requestPointerLock(eaasClient.guac.getDisplay().getElement(), 'click');
                    }

                    // Fix to close emulator on page leave
                    $scope.$on('$locationChangeStart', function (event) {
                        eaasClient.release();
                    });
                });
            });
        };

        //todo optimize this if else
        if (typeof chosenEnv.data == "undefined") {
            vm.runEmulator([]);
        }
        else if (typeof chosenEnv.data.connectEnvs == "undefined" || !chosenEnv.data.connectEnvs) {
            console.log("chosenEnv.connectEnvs " + chosenEnv.connectEnvs);
            vm.runEmulator([]);
        }
        else {
            let modal = $uibModal.open({
                template: require('./modals/connected-envs.html'),
                controller: ["$scope", "$uibModalInstance", function ($scope, $uibModalInstance) {
                    $scope.envs = environmentList.data.environments.concat(objectEnvironmentList.data.environments);
                    $scope.selected = [];
                    $scope.ok = function () {
                        $uibModalInstance.close();
                        vm.runEmulator($scope.selected);
                    };

                    $scope.cancel = function () {
                        $uibModalInstance.dismiss('cancel');
                    };

                    $scope.OnClickSelect = function (item) {
                        console.log("got item! " + item.envId);
                        $scope.selected.push(item)
                    };

                    $scope.OnRemoveSelect = function (item) {
                        var index = $scope.selected.indexOf(item);
                        $scope.selected.splice(index, 1);
                    }
                }],
                controllerAs: "connectedEnvs"
            });

            modal.result.then({}, function () {
                //Get triggers when modal is dismissed (user chooses close button or clicks out of modal borders)
                let isObjectEnv = false;
                if ($stateParams.objectId != null)
                    isObjectEnv = true;
                $state.go('admin.standard-envs-overview', {showObjects: isObjectEnv}, {reload: false});
            });
        }
    }];