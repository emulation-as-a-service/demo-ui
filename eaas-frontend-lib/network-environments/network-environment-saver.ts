export function saveNetworkEnv(http, method, endpoint, networkEnvironmentView, envId) {
    return http[method](endpoint, {
        networking: {
            enableInternet: networkEnvironmentView.networkingConfig.enableInternet,
            serverMode: networkEnvironmentView.networkingConfig.allowExternalConnections ? networkEnvironmentView.networkingConfig.serverMode : undefined,
            localServerMode: networkEnvironmentView.networkingConfig.allowExternalConnections ? networkEnvironmentView.networkingConfig.localServerMode : undefined,
            enableSocks: networkEnvironmentView.networkingConfig.allowExternalConnections ? networkEnvironmentView.networkingConfig.enableSocks : undefined,
            isDHCPenabled: networkEnvironmentView.networkingConfig.enableInternet ? networkEnvironmentView.networkingConfig.isDHCPenabled : undefined,
            dhcpNetworkMask: networkEnvironmentView.networkingConfig.dhcpNetworkMask,
            dhcpNetworkAddress: networkEnvironmentView.networkConfigTemplate.isDnsDefined ? networkEnvironmentView.networkingConfig.dhcpNetworkAddress : undefined,
            isArchivedInternetEnabled: networkEnvironmentView.networkingConfig.enableInternet ? networkEnvironmentView.networkingConfig.isArchivedInternetEnabled : undefined,
            allowExternalConnections: networkEnvironmentView.networkingConfig.allowExternalConnections,
            archiveInternetDate: networkEnvironmentView.networkingConfig.enableInternet ? networkEnvironmentView.networkingConfig.archiveInternetDate : undefined
        },
        upstream_dns: networkEnvironmentView.networkConfigTemplate.isDnsDefined ? networkEnvironmentView.networkingConfig.upstream_dns : null,
        gateway: networkEnvironmentView.networkingConfig.enableInternet ?
            networkEnvironmentView.networkingConfig.gateway : null,
        network: networkEnvironmentView.networkingConfig.network,
        startupEnvId: networkEnvironmentView.networkingConfig.isShared && networkEnvironmentView.networkingConfig.startupEnv ?
            networkEnvironmentView.networkingConfig.startupEnv.envId : undefined,
        dnsServiceEnvId: networkEnvironmentView.networkConfigTemplate.isDnsDefined ? "service-dns" : undefined,
        smbServiceEnvId: networkEnvironmentView.networkConfigTemplate.isSmbDefined ? "service-smb" : undefined,
        linuxArchiveProxyEnvId: networkEnvironmentView.networkConfigTemplate.isLinuxArchiveProxyDefined ? "service-archive-proxy" : undefined,
        emilEnvironments: networkEnvironmentView.chosenEnvs,
        title: networkEnvironmentView.networkEnvironmentTitle,
        description: networkEnvironmentView.networkingConfig.description,
        envId: envId
    })
}
