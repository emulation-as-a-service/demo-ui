import {stopClient} from "./utils/stop-client";
import {createData} from "EaasLibs/eaas-data-creator";
import {startNetworkEnvironment} from "EaasLibs/start-network-environment.js";
import {NetworkSession,requestPointerLock} from "../../../../../eaas-client/eaas-client";

module.exports = ['$rootScope', '$uibModal', '$scope', '$state', '$stateParams', '$cookies', '$translate', '$http', 'localConfig', 'growl', 'Environments', 'chosenEnv', 'eaasClient',
    function ($rootScope, $uibModal, $scope, $state, $stateParams, $cookies, $translate, $http, localConfig, growl, Environments, chosenEnv, eaasClient) {

        var vm = this;
        vm.eaasClient = eaasClient;

        window.$rootScope = $rootScope;
        $rootScope.emulator.state = '';
        $rootScope.emulator.detached = false;

        if ($stateParams.containerRuntime != null) {
            $scope.containerRuntime = $stateParams.containerRuntime;
            if (chosenEnv == null) chosenEnv = {};
            chosenEnv.networking = $stateParams.containerRuntime.networking;
        }
        vm.runEmulator = async (selectedEnvs, attachId) => {
            let type = "machine";
            await chosenEnv;

            window.onbeforeunload = function (e) {
                var dialogText = $translate.instant('MESSAGE_QUIT');
                e.returnValue = dialogText;
                return dialogText;
            };

            window.onunload = function () {
                if (eaasClient)
                    eaasClient.release();
                window.onbeforeunload = null;
            };

            vm.getOutput = function () {
                $("#emulator-loading-container").hide();

                let _header = localStorage.getItem('id_token') ? { "Authorization": "Bearer " + localStorage.getItem('id_token') } : {};

                async function f() {
                    const containerOutput = await fetch(eaasClient.getContainerResultUrl(), {
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

            eaasClient.onEmulatorStopped = function () {
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
                language: { name: 'us' },
                layout: { name: 'pc105' }
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
                    params.enableInternet = chosenEnv.networking.enableInternet;
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
                    var runtimeEnv = vm.environments.find(function (element) {
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
                envs.push({ data, visualize: false });
            }

            var archive = (chosenEnv) ? chosenEnv.archive : "default";
            console.log("chosenEnv.envId",chosenEnv.envId);
            let data = createData(chosenEnv.envId,
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

            envs.push({ data, visualize: true });
            $scope.$on('$locationChangeStart', function (event, newUrl, oldUrl) {
                console.log("onStateChange");
                if (!newUrl.endsWith("emulator")) {
                    eaasClient.release();
                    window.onbeforeunload = null;
                }
            });

            $scope.$on('$destroy', function (event) {
                stopClient($uibModal, $rootScope.emulator.detached, eaasClient);
            });

            try {
                if ($stateParams.componentId && $stateParams.session) {
                    if (!$stateParams.session.network)
                        throw new Error("reattch requires a network session");
                    vm.networkSessionEnvironments = [];
                    for (const component of $stateParams.session.components) {
                        if (component.type === type){
                            // vm.dnsServiceEnv = await Environments.get({envId: chosenEnv.dnsServiceEnvId}).$promise;
                            component.networkElement = $stateParams.session.network.components.find(el => el.componentId === component.componentId);
                            await Environments.get({envId: component.environmentId}).$promise.then((envMetaData) => {
                                vm.networkSessionEnvironments.push({
                                    "envId": component.environmentId,
                                    "title": envMetaData.title,
                                    "label": component.networkElement.networkLabel,
                                    "componentId": component.componentId,
                                    "networkData": {serverIp: component.networkElement.serverIp, serverPorts: component.networkElement.serverPorts}
                                });
                            });
                        }
                    }
                    eaasClient.load($stateParams.session.sessionId, $stateParams.session.components, $stateParams.session.network);
                    let componentSession = eaasClient.getSession($stateParams.componentId);
                    await eaasClient.connect($("#emulator-container")[0], componentSession);
                    eaasClient.network.sessionId = $stateParams.session.sessionId;
                    $rootScope.emulator.detached = true;
                } else
                    {
                    if ($stateParams.isNetworkEnvironment) {
                        await startNetworkEnvironment(vm, eaasClient, chosenEnv, Environments, $http, $uibModal, localConfig);
                    } else {
                        await eaasClient.start(envs, params, attachId);
                    }
                    await eaasClient.connect($("#emulator-container")[0]);

                    $rootScope.idsData = eaasClient.envsComponentsData;
                    $rootScope.idsData.forEach(function (idData) {
                        if (idData.env) {
                            Environments.get({ envId: idData.env.data.environment }).$promise.then(function (response) {
                                idData.title = response.title;
                            });
                        }
                    });
                }

                $("#emulator-loading-container").hide();
                $("#emulator-container").show();
                $rootScope.emulator.mode = eaasClient.mode;
                $rootScope.emulator.state = 'STARTED';
                if (eaasClient.params.pointerLock === "true") {
                    growl.info($translate.instant('EMU_POINTER_LOCK_AVAILABLE'));
                    requestPointerLock(eaasClient.guac.getDisplay().getElement(), 'click');
                }
                $scope.$apply();
                $rootScope.$broadcast("emulatorStart", "success");

                if (eaasClient.networkTcpInfo || eaasClient.tcpGatewayConfig) {
                    $rootScope.networkTcpInfo = eaasClient.networkTcpInfo;
                    $rootScope.tcpGatewayConfig = eaasClient.tcpGatewayConfig;
                }

            }
            catch (e) {
                console.log(e);
                $state.go('error', { errorMsg: { title: "Emulation Error", message: e } });
            }
        }

        async function dealWithIt(resultPromise) {
            try {
                let data = await resultPromise;
                if (data.attachComponentId)
                    vm.runEmulator(data.selected, data.attachComponentId.id);
                else
                    vm.runEmulator(data.selected);
            }
            catch (error) {
                let isObjectEnv = false;
                if ($stateParams.objectId != null)
                    isObjectEnv = true;
                $state.go('admin.standard-envs-overview', { showObjects: isObjectEnv }, { reload: false });
            }
        }

        if ($stateParams.session || $stateParams.isNetworkEnvironment) {
            vm.runEmulator([]);
        } else if (!chosenEnv.networking || !chosenEnv.networking.connectEnvs) {
            vm.runEmulator([]);
        }
        else {
            let modal = $uibModal.open({
                template: require('./modals/connected-envs.html'),
                animation: false,
                resolve: {
                    environments: (Environments) => Environments.query().$promise,
                    sessionIds: ($http, localConfig, helperFunctions, REST_URLS) => $http.get(localConfig.data.eaasBackendURL + REST_URLS.getGroupIds)
                },
                controller: "EmulatorConnectedEnvsController as connectedEnvs"
            });

            modal.closed.then(() => dealWithIt(modal.result));
        }
    }];
