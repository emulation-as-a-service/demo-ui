import {requestPointerLock, ClientError} from "EaasClient/eaas-client.js";
import { _fetch } from "../../lib/utils";
import { UviMachineComponentBuilder } from "../../../../../eaas-client/lib/componentBuilder";

module.exports = ['$rootScope', '$scope', '$state', '$stateParams', '$translate', 'growl', 'chosenEnv', 'eaasClient',
    function ($rootScope, $scope, $state, $stateParams, $translate, growl, chosenEnv, eaasClient) {
        var vm = this;
        vm.eaasClient = eaasClient;

        window.$rootScope = $rootScope;
        $rootScope.emulator.state = '';
        vm.emulator = $rootScope.emulator;

        if ($stateParams.containerRuntime != null) {
            $scope.containerRuntime = $stateParams.containerRuntime;
            if(chosenEnv == null) chosenEnv = {};
                chosenEnv.networking = $stateParams.containerRuntime.networking;
        }

        vm.runEmulator = async (networkSessionId) => {
           
            console.log(networkSessionId);

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
                    const containerOutput = await fetch(eaasClient.sessions.find((session) => eaasClient.activeView.componentId === session.componentId).getContainerResultUrl(), {
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

            /*
            this.link = localConfig.data.baseEmulatorUrl + "/#/emulationSession?environmentId=" + $stateParams.envId;
            if ($stateParams.objectId)
                this.link += "&objectId=" + $stateParams.objectId;
            */
           
            eaasClient.onEmulatorStopped = function () {
                if ($rootScope.emulator.state == 'STOPPED')
                    return;

                $rootScope.emulator.state = 'STOPPED';
                $("#emulator-container").hide();
                $("#emulator-loading-container").show();
                $("#emulator-loading-container").text($translate.instant('JS_EMU_STOPPED'));

                $scope.$apply();
            };

         //   if($stateParams.uvi)
         //       component = new UviMachineComponentBuilder($stateParams.uvi, environmentId, archive); 

           // if ($stateParams.type == 'saveUserSession') {
           //     component.lockEnvironment(true);
                // console.log("locking user session");
           // }
         
            $scope.$on('$locationChangeStart', function (event, newUrl, oldUrl) {
                console.log("onStateChange");
                if (!newUrl.endsWith("emulator")) {
                    eaasClient.release();
                    window.onbeforeunload = null;
                }
            });

            $scope.$on('$destroy', function (event) {
                window.onbeforeunload = null;
                eaasClient.release();
            });

            try {
                if ($stateParams.componentId && $stateParams.session) {
                    if (!$stateParams.session.network)
                        throw new Error("reattach requires a network session");
                    await eaasClient.attach($stateParams.session.sessionId, $("#emulator-container")[0], $stateParams.componentId);
                } else if(networkSessionId) {
                    await eaasClient.attachNewEnv(networkSessionId, $("#emulator-container")[0], component);
                    vm.started = true;
                } else {
                    console.log("Components:", $stateParams.components);
                    console.log("ClientOptions:", $stateParams.clientOptions);
                    await eaasClient.start($stateParams.components, $stateParams.clientOptions);
                    await eaasClient.connect($("#emulator-container")[0]);
                }

                $("#emulator-loading-container").hide();
                $("#emulator-container").show();
                $rootScope.emulator.mode = eaasClient.mode;
                $rootScope.emulator.state = 'STARTED';
                if (eaasClient.getActiveSession() && eaasClient.getActiveSession().hasPointerLock()) {
                    eaasClient.getActiveSession().setPointerLock();
                }
                $scope.$apply();
                $rootScope.$broadcast("emulatorStart", "success");

            }
            catch (e) {
                console.error(e);

                const details = (e instanceof ClientError) ? e.toJson() : e.toString();
                $state.go('error', { errorMsg: { title: "Emulation Error", message: details }, returnState: $stateParams.envId && `admin.edit-env({envId: "${$stateParams.envId}"})` });
            }
        }
        
        if (!$stateParams.components) 
            $state.go('error', {errorMsg: {title: "Invalid argument"}});

        vm.runEmulator();
        
        /*
            // check if there are running sessions. 
            // if we find sessions, allow ad-hoc connections 
            // if no session is found, proceed 
            const f = async () => {
                try {
                    vm.sessionIds = await _fetch(`${localConfig.data.eaasBackendURL}/sessions`, "GET", null, localStorage.getItem('id_token'));
                    if(!vm.sessionIds || vm.sessionIds.length == 0)
                        throw new Error("no running environments found");

                    let modal = $uibModal.open({
                        template: require('./modals/connected-envs.html'),
                        animation: false,
                        backdrop: 'static',
                        resolve: {
                            sessionIds : () => { return vm.sessionIds }
                        },
                        controller: "EmulatorConnectedEnvsController as connectedEnvs"
                    });
                    await modal.closed;
                    
                    try {
                        let data = await modal.result;
                        if(data.session)
                            vm.runEmulator(data.session.id);
                        else 
                            vm.runEmulator();
                    }
                    catch(error)
                    {
                        let isObjectEnv = false;
                        if ($stateParams.objectId != null)
                            isObjectEnv = true;
                        growl.error(error);
                        $state.go('admin.standard-envs-overview', {showObjects: isObjectEnv}, {reload: false});
                    }

                }
                catch(e) {
                    console.log(e);
                    vm.runEmulator();
                }
            }
            f();
        }
        */
    }];
