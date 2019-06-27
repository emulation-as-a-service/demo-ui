module.exports = ['$rootScope', '$uibModal', '$scope', '$http', '$sce', '$state', '$stateParams', '$cookies', '$translate', 'localConfig', 'growl', 'Environments', 'REST_URLS', 'chosenEnv',
                                    function ($rootScope, $uibModal, $scope, $http, $sce,   $state, $stateParams, $cookies, $translate, localConfig, growl, Environments, REST_URLS, chosenEnv) {
        var vm = this;

        window.isCollapsed = true;
        window.$rootScope = $rootScope;
        $rootScope.emulator.state = '';
        $rootScope.emulator.detached = false;
        if ($stateParams.containerRuntime != null) {
            $scope.containerRuntime = $stateParams.containerRuntime;
            chosenEnv.networking = $stateParams.containerRuntime.networking;
        }
        console.log(window.isCollapsed, window.isCollapsed);
        vm.runEmulator = function(selectedEnvs, attachId) {

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
                if(eaasClient)
                   eaasClient.release();
                window.onbeforeunload = null;
            };

            vm.getOutput = function () {
                let _header = localStorage.getItem('id_token') ? {"Authorization": "Bearer " + localStorage.getItem('id_token')} : {};

                async function f() {
                    const containerOutput = await fetch(window.eaasClient.getContainerResultUrl(), {
                        headers: _header,
                    });
                    const containerOutputBlob = await containerOutput.blob();
                    // window.open(URL.createObjectURL(containerOutputBlob), '_blank');

                    var downloadLink = document.createElement("a");
                    downloadLink.href = URL.createObjectURL(containerOutputBlob);
                    downloadLink.download = "output-data.zip";
                    document.body.appendChild(downloadLink);
                    downloadLink.click();
                    document.body.removeChild(downloadLink);
                };
                f();
            };

            this.link = localConfig.data.baseEmulatorUrl + "/#/emulationSession?environmentId=" + $stateParams.envId;
            if ($stateParams.objectId)
                this.link += "&objectId=" + $stateParams.objectId;

            window.eaasClient.onEmulatorStopped = function () {
                if ($rootScope.emulator.state == 'STOPPED')
                    return;

                $rootScope.emulator.state = 'STOPPED';
                $rootScope.emulator.detached = false;
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
            if (chosenEnv) {

                if (chosenEnv.networking) {
                    if (chosenEnv.networking.connectEnvs)
                        params.enableNetwork = true;

                    if (chosenEnv.networking.localServerMode) {
                        params.hasTcpGateway = false;
                    } else {
                        params.hasTcpGateway = chosenEnv.networking.serverMode;
                    }
                    params.hasInternet = chosenEnv.networking.enableInternet;
                    if (params.hasTcpGateway || chosenEnv.networking.localServerMode) {
                        params.tcpGatewayConfig = {
                            socks: chosenEnv.networking.enableSocks,
                            gwPrivateIp: chosenEnv.networking.gwPrivateIp,
                            gwPrivateMask: chosenEnv.networking.gwPrivateMask,
                            serverPort: chosenEnv.networking.serverPort,
                            serverIp: chosenEnv.networking.serverIp
                        };
                    }
                }
                params.xpraEncoding = chosenEnv.xpraEncoding;
            }
            console.log(params);

            var envs = [];
            for (let i = 0; i < selectedEnvs.length; i++) {
                //since we can observe only single environment, keyboardLayout and keyboardModel are not relevant
                let data = createData(selectedEnvs[i].envId,
                    "default",
                    type,
                    selectedEnvs[i].objectArchive,
                    selectedEnvs[i].objectId,
                    selectedEnvs[i].userId,
                    selectedEnvs[i].softwareId);
                envs.push({data, visualize: false});
            }

            var archive = (chosenEnv) ? chosenEnv.archive : "default";
            let data = createData($stateParams.envId,
                archive,
                type,
                $stateParams.objectArchive,
                $stateParams.objectId,
                $stateParams.userId,
                $stateParams.softwareId,
                kbLayoutPrefs.language.name,
                kbLayoutPrefs.layout.name,
                $stateParams.containerRuntime);



            if ($stateParams.type == 'saveUserSession') {
                data.lockEnvironment = true;
                console.log("locking user session");
            }

            function createData (envId, archive, type, objectArchive, objectId, userId, softwareId, keyboardLayout, keyboardModel, containerRuntime) {
                let data = {};
                data.type = type;
                data.archive = archive;
                data.environment = envId;
                data.object = objectId;
                data.objectArchive = objectArchive;
                data.userId = userId;
                data.software = softwareId;
                if (containerRuntime != null) {
                    data.linuxRuntimeData = {
                        userContainerEnvironment: containerRuntime.userContainerEnvironment,
                        userContainerArchive: containerRuntime.userContainerArchive,
                        isDHCPenabled: containerRuntime.networking.isDHCPenabled
                    };
                    data.input_data = containerRuntime.input_data;
                }
                if (typeof keyboardLayout != "undefined") {
                    data.keyboardLayout = keyboardLayout;
                }

                if (typeof keyboardModel != "undefined") {
                    data.keyboardModel = keyboardModel;
                }
                return data;
            };

            envs.push({data, visualize: true});
            $scope.$on('$locationChangeStart', function (event, newUrl, oldUrl) {
                if(!newUrl.endsWith("emulator")) {
                    eaasClient.release();
                    window.onbeforeunload = null;
                }
            });

            if($stateParams.isStarted){
                eaasClient.isStarted = true;
                if($stateParams.isDetached)
                    eaasClient.detached = true;
                eaasClient.componentId = $stateParams.envId;

                if ($stateParams.networkInfo) {
                    chosenEnv.serverMode = true;
                    eaasClient.networkTcpInfo = $stateParams.networkInfo.tcp;
                }
                eaasClient.connect().then(function () {
                    $("#emulator-loading-container").hide();
                    $("#emulator-container").show();
                     $rootScope.emulator.mode = eaasClient.mode;
                     $rootScope.emulator.state = 'STARTED';
                     $rootScope.emulator.detached = true;
                     $scope.$apply();
                    if (eaasClient.networkTcpInfo || eaasClient.tcpGatewayConfig) {
                        $rootScope.networkTcpInfo = eaasClient.networkTcpInfo;
                        $rootScope.tcpGatewayConfig = eaasClient.tcpGatewayConfig;
                    }
                    if (eaasClient.params.pointerLock === "true") {
                        growl.info($translate.instant('EMU_POINTER_LOCK_AVAILABLE'));
                        BWFLA.requestPointerLock(eaasClient.guac.getDisplay().getElement(), 'click');
                    }
                });
            } else {
                eaasClient.start(envs, params, attachId).then(function () {
                eaasClient.connect().then(function () {
                    $("#emulator-loading-container").hide();
                    $("#emulator-container").show();
                    $rootScope.emulator.mode = eaasClient.mode;
                    $rootScope.emulator.state = 'STARTED';
                    $rootScope.idsData = eaasClient.envsComponentsData;

                    $rootScope.idsData.forEach(function (idData) {
                        Environments.get({envId: idData.env.data.environment}).$promise.then(function(response) {
                            idData.title = response.title;
                        });
                    });

                    $scope.$apply();
                    if (eaasClient.networkTcpInfo || eaasClient.tcpGatewayConfig) {
                        $rootScope.networkTcpInfo = eaasClient.networkTcpInfo;
                        $rootScope.tcpGatewayConfig = eaasClient.tcpGatewayConfig;
                    }
                    if (eaasClient.params.pointerLock === "true") {
                        growl.info($translate.instant('EMU_POINTER_LOCK_AVAILABLE'));
                        BWFLA.requestPointerLock(eaasClient.guac.getDisplay().getElement(), 'click');
                    }
                });
            });
            }
        };

        //todo optimize this if else
        if (!chosenEnv) {
            vm.runEmulator([]);
        }
        else if (!chosenEnv.networking.connectEnvs) {
            console.log("chosenEnv.connectEnvs " + chosenEnv.connectEnvs);
            vm.runEmulator([]);
        }
        else {
            let modal = $uibModal.open({
                template: require('./modals/connected-envs.html'),
                animation: true,
                resolve: {
                    environments : (Environments) => Environments.query().$promise,
                    sessionIds : ($http, localConfig, helperFunctions, REST_URLS) => $http.get(localConfig.data.eaasBackendURL + REST_URLS.getGroupIds)
                },
                controller: ["$scope", "$uibModalInstance", "$uibModalStack", "sessionIds", "environments",
                    function ($scope, $uibModalInstance, $uibModalStack, sessionIds, environments) {
                        $scope.availableGroupIds = sessionIds.data;
                        $scope.envs = [];

                        environments.forEach(function (env) {
                            console.log(env);
                            if (env.networkEnabled)
                                 $scope.envs.push(env);
                        });

                        $scope.selected = [];
                        $scope.attachComponentId = null;

                        $scope.ok = function () {
                            $scope.isModuleVisible = false;
                            jQuery.when(
                                $uibModalInstance.close(),
                                $(".modal-backdrop").hide(),
                                $(".modal-dialog").hide(),
                                jQuery.Deferred(function (deferred) {
                                    jQuery(deferred.resolve);
                                })).done(function () {
                                runSelectedEmulators()
                            });
                        };

                        function runSelectedEmulators() {
                            vm.runEmulator($scope.selected);
                        }

                        $scope.connectToExistentComponent = function () {
                            console.log("$scope.attachComponentId", $scope.attachComponentId);
                            jQuery.when(
                                $uibModalInstance.close(),
                                jQuery.Deferred(function (deferred) {
                                    jQuery(deferred.resolve);
                                })).done(function () {
                                vm.runEmulator($scope.selected, $scope.attachComponentId.id);
                            });
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
                        };
                        $scope.OnClickSelectAttachID = function (item) {
                            $scope.attachComponentId = item;
                        };

                        $scope.OnRemoveSelectAttachID = function (item) {
                            delete $scope.attachComponentId
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