import {Client, hideCursor, showCursor, requestPointerLock} from '../../../../../eaas-client/eaas-client.js';

module.exports = ['$rootScope', '$uibModal', '$scope', '$http', '$sce', '$state', '$stateParams', '$cookies', '$translate', 'localConfig', 'growl', 'Environments', 'REST_URLS', 'chosenEnv',
                                  function ($rootScope, $uibModal, $scope, $http, $sce,   $state, $stateParams, $cookies, $translate, localConfig, growl, Environments, REST_URLS, chosenEnv) {
        var vm = this;

        window.$rootScope = $rootScope;
        $rootScope.emulator.state = '';
        $rootScope.emulator.detached = false;

        if ($stateParams.containerRuntime != null) {
            $scope.containerRuntime = $stateParams.containerRuntime;
            if(chosenEnv == null) chosenEnv = {};
            chosenEnv.networking = $stateParams.containerRuntime.networking;
        }
        vm.runEmulator = async (selectedEnvs, attachId) => {

            let type = "machine";
            window.eaasClient = new Client(localConfig.data.eaasBackendURL, $("#emulator-container")[0]);

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
                $("#emulator-loading-container").hide();

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
                            serverPort: chosenEnv.networking.serverPort,
                            serverIp: chosenEnv.networking.serverIp
                        };
                    }
                }
                params.xpraEncoding = chosenEnv.xpraEncoding;
            }
            // console.log(params);

            var envs = [];
            for (let i = 0; i < selectedEnvs.length; i++) {
                if (selectedEnvs[i].envType === "container" && selectedEnvs[i].runtimeId) {
                    var runtimeEnv =  vm.environments.find(function(element) {
                        return element.envId = selectedEnvs[i].runtimeId;
                    });
                    data = createData(
                        selectedEnvs[i].runtimeId,
                        runtimeEnv.archive,
                        type,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        {
                            userContainerEnvironment: selectedEnvs[i].envId,
                            userContainerArchive: selectedEnvs[i].archive,
                            networking: selectedEnvs[i].networking,
                            input_data: selectedEnvs[i].input_data
                        });


                } else {
                    //since we can observe only single environment, keyboardLayout and keyboardModel are not relevant
                    data = createData(selectedEnvs[i].envId,
                        selectedEnvs[i].archive,
                        type,
                        selectedEnvs[i].objectArchive,
                        selectedEnvs[i].objectId,
                        selectedEnvs[i].userId,
                        selectedEnvs[i].softwareId);
                }
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
                // console.log("locking user session");
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
                console.log("onStateChange");
                if(!newUrl.endsWith("emulator")) {
                    eaasClient.release();
                    window.onbeforeunload = null;
                }
            });

            if($stateParams.isStarted){
                eaasClient.isStarted = true;
                let session = eaasClient.getSession($stateParams.envId);

                if ($stateParams.networkInfo) {
                    chosenEnv.serverMode = true;
                    eaasClient.networkTcpInfo = $stateParams.networkInfo.tcp;
                }
                await eaasClient.connect(session);
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
                   //  $rootScope.$broadcast("emulatorStart", "success");
                
            } else {
                try {
                    await eaasClient.start(envs, params, attachId);
                    await eaasClient.connect();
                    $("#emulator-loading-container").hide();
                    $("#emulator-container").show();
                    $rootScope.emulator.mode = eaasClient.mode;
                    $rootScope.emulator.state = 'STARTED';
                    $rootScope.idsData = eaasClient.envsComponentsData;

                    $rootScope.idsData.forEach(function (idData) {
                        // console.log("!!! idData", idData);
                        if(idData.env) {
                            Environments.get({envId: idData.env.data.environment}).$promise.then(function(response) {
                                idData.title = response.title;
                            });
                        }
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
                    $rootScope.$broadcast("emulatorStart", "success");
                }
                catch(e) {
                    console.log(e);
                }  
            }
        };


        async function dealWithIt(resultPromise)
        {
            try {
                let data = await resultPromise;
                if(data.attachComponentId)
                    vm.runEmulator(data.selected, data.attachComponentId.id);
                else
                    vm.runEmulator(data.selected);
            }
            catch(error)
            {
                let isObjectEnv = false;
                if ($stateParams.objectId != null)
                    isObjectEnv = true;
                $state.go('admin.standard-envs-overview', {showObjects: isObjectEnv}, {reload: false});
            }
        }

        console.log(chosenEnv);
        //todo optimize this if else
        if (!chosenEnv) {
            vm.runEmulator([]);
        }
        else if (!chosenEnv.networking.connectEnvs) {
            vm.runEmulator([]);
        }
        else {
            let modal = $uibModal.open({
                template: require('./modals/connected-envs.html'),
                animation: false,
                resolve: {
                    environments : (Environments) => Environments.query().$promise,
                    sessionIds : ($http, localConfig, helperFunctions, REST_URLS) => $http.get(localConfig.data.eaasBackendURL + REST_URLS.getGroupIds)
                },
                controller: "EmulatorConnectedEnvsController as connectedEnvs"
            });

            modal.closed.then(() => dealWithIt(modal.result));
        }
    }];