import {createData} from "./eaas-data-creator.js";
import {NetworkSession} from "../eaas-client/eaas-client";

export async function startNetworkEnvironment(controller, eaasClient, chosenEnv, Environments, $http, $uibModal, localConfig) {
    controller.networkSessionEnvironments = [];
    let sessions = [];
    let data = {};
    let type = "machine";
// !FIXME
// make Network Environment a proper component and run it from backend!
// currently, last element always will be visualized
    const promises = [];
    for (const networkElement of chosenEnv.emilEnvironments) {
        let env = await Environments.get({envId: networkElement.envId}).$promise;
        if (env.runtimeId) {
            const runtimeEnv = await Environments.get({envId: env.runtimeId}).$promise;
            let modal = $uibModal.open({
                animation: true,
                template: require('../eaas-frontend-admin/src/app/modules/containers/modals/container-run-dialog-modified.html'),
                resolve: {
                    currentEnv: function () {
                        return env;
                    },
                    localConfig: function () {
                        return localConfig;
                    }
                },
                controller: "ContainerInputDialog as runContainerDlgCtrl"
            });

            let input_data = [];
            var input = {};
            input.size_mb = 512;
            input.destination = env.input;
            input.content = await modal.result;
            input_data.push(input);
            data = createData(
                env.runtimeId,
                runtimeEnv.archive,
                type,
                null,
                null,
                null,
                null,
                null,
                null,
                {
                    userContainerEnvironment: env.envId,
                    userContainerArchive: env.archive,
                    networking: env.networking,
                    input_data: input_data
                });
        } else {
            data = createData(env.envId,
                env.archive,
                type,
                env.objectArchive,
                env.objectId,
                env.userId,
                env.softwareId,
                null,
                null,
                null,
                networkElement.macAddress,
            );
        }
        // start multiple environments simultaneously
        promises.push((async () => {
            let componentSession = await eaasClient.start([{data, visualize: true}], {});
            controller.networkSessionEnvironments.push({
                "envId": env.envId,
                "title": env.title,
                "label": networkElement.label,
                "componentId": componentSession.componentId,
                "networkData": {
                    serverIp: networkElement.serverIp,
                    serverPorts: networkElement.serverPorts
                }
            });
            componentSession.networkLabel = networkElement.label;
            componentSession.serverIp = networkElement.serverIp;
            componentSession.serverPorts = networkElement.serverPorts;
            componentSession.hwAddress = networkElement.macAddress;
            sessions.push(componentSession);
        })());
    }
    if (chosenEnv.dnsServiceEnvId) {
        promises.push((async () => {

            let env = await Environments.get({envId: chosenEnv.dnsServiceEnvId}).$promise;

            if (env.runtimeId) {
                const runtimeEnv = await Environments.get({envId: env.runtimeId}).$promise;
                controller.dnsServiceEnv = env;

                let input_data = [];
                var input = {};
                input.size_mb = 512;
                input.destination = env.input;

                const url = await $http.get(localConfig.data.eaasBackendURL + "network-environments/" + chosenEnv.envId + "?jsonUrl=true");
                input.content = [{
                    "action": "copy",
                    "url": sessionStorage.DEBUG_network_json_url ? sessionStorage.DEBUG_network_json_url : url.data.url,
                    "compression_format": "tar",
                    "name": "network.json",
                }];
                input_data.push(input);
                data = createData(
                    env.runtimeId,
                    runtimeEnv.archive,
                    type,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    {
                        userContainerEnvironment: env.envId,
                        userContainerArchive: env.archive,
                        networking: env.networking,
                        input_data: input_data
                    });
                let componentSession = await eaasClient.start([{data, visualize: true}], {});
                controller.networkSessionEnvironments.push({
                    "envId": env.envId,
                    "title": env.title,
                    "label": "dns",
                    "componentId": componentSession.componentId,
                    "networkData": {
                        serverIp: "",
                        serverPorts: []
                    }
                });
                sessions.push(componentSession);
            }
        })());
    }
    await Promise.all(promises);
    eaasClient.network = new NetworkSession(eaasClient.API_URL, eaasClient.idToken);
    eaasClient.sessions = sessions;
    chosenEnv.networking.gateway = chosenEnv.gateway;
    await eaasClient.network.startNetwork(sessions, chosenEnv.networking);
}
