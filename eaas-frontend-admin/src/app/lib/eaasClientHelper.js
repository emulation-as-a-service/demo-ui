
import { ClientOptions } from 'EaasClient/lib/clientOptions.js';
import {_fetch} from './utils.js';
import { MachineComponentBuilder } from "EaasClient/lib/componentBuilder.js";

export class EaasClientHelper 
{
    constructor(api, idToken = null) {
        this.API_URL = api;
        this.idToken = idToken;
    }

    async createNetworkFromId(envId)
    {
        let networkEnvironment = await _fetch(`${this.API_URL}network-environments/${envId}`);

        const components = [];
        const clientOptions = new ClientOptions();

        clientOptions.enableNetworking();
        clientOptions.getNetworkConfig().setNetwork(networkEnvironment.network);
        clientOptions.getNetworkConfig().setGateway(networkEnvironment.gateway);
        clientOptions.getNetworkConfig().enableInternet(networkEnvironment.enableInternet);
        if(!networkEnvironment.dnsServiceEnvId)
            clientOptions.getNetworkConfig().enableSlirpDhcp(networkEnvironment.isDHCPenabled);

        try {
            let tcpGatewayConfig = new TcpGatewayConfig(networkEnvironment.networking.serverIp, networkEnvironment.networking.serverPort);
            tcpGatewayConfig.enableSocks(networkEnvironment.networking.enableSocks);
            tcpGatewayConfig.enableLocalMode(networkEnvironment.networking.localServerMode);
            clientOptions.getNetworkConfig().setTcpGatewayConfig(tcpGatewayConfig);
        }
        catch(e) {
            // do nothing
        }

        if(!networkEnvironment.emilEnvironments )
            networkEnvironment.emilEnvironments = [];
        for (const networkElement of networkEnvironment.emilEnvironments) {
            let env = await Environments.get({envId: networkElement.envId}).$promise;
            let component;
    
            if (env.runtimeId) {
                const runtimeEnv = await Environments.get({envId: env.runtimeId}).$promise;
                let modal = $uibModal.open({
                    animation: true,
                    template: require('EaasAdmin/app/modules/containers/modals/container-run-dialog-modified.html'),
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
                let input = {};
                input.size_mb = 512;
                input.destination = env.input;
                input.content = await modal.result;
                input_data.push(input);
                component = new MachineComponentBuilder(env.runtimeId, runtimeEnv.archive);
                component.setLinuxRuntime(
                    {
                        userContainerEnvironment: env.envId,
                        userContainerArchive: env.archive,
                        networking: env.networking,
                        input_data: input_data
                    });
            } else {
                component = new MachineComponentBuilder(env.envId, env.archive);
                component.setObject(env.objectId, env.objectArchive);
            }
            
            if(networkElement.toVisualize) {
                component.setInteractive();
                controller.componentIdToInitialize = component.getId();
            }
    
            let networkComponentConfig = new NetworkComponentConfig(networkElement.label, networkElement.macAddress);
            networkComponentConfig.setServerConfiguration(networkElement.serverIp, networkElement.serverPorts);
            networkComponentConfig.setFqdn(networkElement.fqdn);
            component.setNetworkConfig(networkComponentConfig);
    
            component.setEthernetAddress(networkElement.macAddress);
            
            components.push(component);
            
            /*
            controller.networkSessionEnvironments.push({
                "envId": env.envId,
                "title": env.title,
                "label": networkElement.label,
                // we miss the componentId here, but that should not matter. ideally we store this data within the eaas client
                "networkData": {
                    serverIp: networkElement.serverIp,
                    serverPorts: networkElement.serverPorts,
                    fqdn: networkElement.fqdn
                }
            });
            */
        }
    
        if(networkEnvironment.startupEnvId){
            controller.startupEnv = await Environments.get({envId: networkEnvironment.startupEnvId}).$promise;
        }
    
        if (networkEnvironment.dnsServiceEnvId) {
            let env = await Environments.get({envId: networkEnvironment.dnsServiceEnvId}).$promise;
            if (env.runtimeId) {
                const runtimeEnv = await Environments.get({envId: env.runtimeId}).$promise;
                controller.dnsServiceEnv = env;
                let component;
                let input_data = [];
                let input = {};
                input.size_mb = 512;
                input.destination = env.input;
    
                const url = await $http.get(localConfig.data.eaasBackendURL + "network-environments/" + networkEnvironment.envId + "?jsonUrl=true");
                input.content = [{
                    "action": "copy",
                    "url": sessionStorage.DEBUG_network_json_url ? sessionStorage.DEBUG_network_json_url : url.data.url,
                    "compression_format": "tar",
                    "name": "network.json",
                }];
                input_data.push(input);
                component = new MachineComponentBuilder(env.runtimeId, runtimeEnv.archive);
    
                component.setLinuxRuntime(
                {
                    userContainerEnvironment: env.envId,
                    userContainerArchive: env.archive,
                    networking: env.networking,
                    input_data: input_data
                });
    
                let networkComponentConfig = new NetworkComponentConfig("DNS/DHCP Service");
                component.setNetworkConfig(networkComponentConfig);
                components.push(component);
    
                /*
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
                */
            }
        }
    
        if (networkEnvironment.smbServiceEnvId) {
            let env = await Environments.get({envId: networkEnvironment.smbServiceEnvId}).$promise;
            if (env.runtimeId) {
                const runtimeEnv = await Environments.get({envId: env.runtimeId}).$promise;
                controller.ServiceEnv = env;
               
                const component = new MachineComponentBuilder(env.runtimeId, runtimeEnv.archive);
                const sts = await $http.get(localConfig.data.eaasBackendURL + "user-data-storage/sts");
    
                env.networking.isDHCPenabled = true;
                component.setLinuxRuntime(
                {
                    userContainerEnvironment: env.envId,
                    userContainerArchive: env.archive,
                    networking: env.networking,
                    userEnvironment : [ "EAAS_STORAGE_CONFIG=" + JSON.stringify(sts.data)]
                });
    
                let networkComponentConfig = new NetworkComponentConfig("Windows Network Storage Service");
                networkComponentConfig.setFqdn("storage");
                component.setNetworkConfig(networkComponentConfig);
                components.push(component);
    
                /*
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
                */
            }
        }
    }


    async clientOptions(envId, token)
    {
        try { 
            let clientOptions = new ClientOptions();

            console.log("Setting up clientOptions for env with id:", envId);
            if(token == null){
                console.log("No auth token was provided to clientOptions! This might lead to failure when retrieving environment information!");
            }

            let emilEnvironment = {};
            try{
                let url = `${this.API_URL}environment-repository/environments/${envId}`;
                console.log("Getting environment information for url ", url);
                emilEnvironment = await _fetch(url, "GET", null, token);
                console.log("Got environment information:", emilEnvironment);
            }
            catch (e){
                console.log("Could not retrieve environment information! ClientOption won't be set up properly!", e);
            }

            if (emilEnvironment.networking.connectEnvs) {
                console.log("Enabling Networking...");
                clientOptions.enableNetworking();

                console.log(emilEnvironment.networking.enableInternet ? "Enabling Internet..." : "Internet is not Enabled for this Environment...");
                clientOptions.getNetworkConfig().enableInternet(emilEnvironment.networking.enableInternet);
                try {
                    console.log("Setting up TcpGatewayConfig...");
                    let tcpGatewayConfig = new TcpGatewayConfig(emilEnvironment.networking.serverIp, emilEnvironment.networking.serverPort);
                    tcpGatewayConfig.enableSocks(emilEnvironment.networking.enableSocks);
                    tcpGatewayConfig.enableLocalMode(emilEnvironment.networking.localServerMode);
                    clientOptions.getNetworkConfig().setTcpGatewayConfig(tcpGatewayConfig);
                    console.log("Successfully set up TcpGatewayConfig");
                }
                catch(e)
                {
                    // TcpGatewayConfig throws if serverIp / port is not set. 
                }
            }
            clientOptions.setXpraEncoding(emilEnvironment.xpraEncoding);
            if (emilEnvironment.disableGhostCursor){
                console.log("Disabling ghost cursor!")
                clientOptions.ghostCursor = "none";
            }
            console.log("Successfully configured clientOptions!");
            return clientOptions;
        }
        catch(e) {
            return new ClientOptions();
        }
    }
    
    createMachine(envId, archive) {

        let _archive = (archive) ? archive : "default";
    
        this.envId = envId;
        this.archive = archive;

        let component = new MachineComponentBuilder(envId, _archive);
        return component;
    }

    /*
            let components = [];
            for (let i = 0; i < selectedEnvs.length; i++) {
                let component;

                if (selectedEnvs[i].envType === "container" && selectedEnvs[i].runtimeId) {
                    let runtimeEnv =  vm.environments.find(function(element) {
                        return element.envId = selectedEnvs[i].runtimeId;
                    });
                    component = new MachineComponentBuilder(selectedEnvs[i].runtimeId, runtimeEnv.archive);
                    component.setLinuxRuntime(
                        {
                            userContainerEnvironment: selectedEnvs[i].envId,
                            userContainerArchive: selectedEnvs[i].archive,
                            networking: selectedEnvs[i].networking,
                            input_data: selectedEnvs[i].input_data
                        }
                    );
                } else {
                    //since we can observe only single environment, keyboardLayout and keyboardModel are not relevant
                    component = new MachineComponentBuilder(selectedEnvs[i].envId, selectedEnvs[i].archive);
                    component.setObject(selectedEnvs[i].objectId, selectedEnvs[i].objectArchive);
                    component.setSoftware(selectedEnvs[i].softwareId);
                }
                components.push(component);
            }
    */


}

