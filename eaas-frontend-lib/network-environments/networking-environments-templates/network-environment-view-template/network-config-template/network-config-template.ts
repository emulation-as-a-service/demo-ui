import {Component, Input} from '@angular/core';
import { ControlContainer, NgForm } from '@angular/forms';

@Component({
    selector: 'network-config-template',
    template: require('./network-config-template.html'),
    viewProviders: [ { provide: ControlContainer, useExisting: NgForm } ]
})
export class NetworkConfigTemplate {
    @Input() networkingConfig: any;
    @Input() isDisabled: boolean;
    @Input() environments: any;
    @Input() containerList: any;

    isDnsDefined: boolean;
    isSmbDefined: boolean;
    isLinuxArchiveProxyDefined: boolean;
    isDnsAvailable: boolean;
    isSmbAvailable: boolean;
    isLinuxArchiveProxyAvailable: boolean;

    startDate = new Date(2000, 0, 1);

    ngAfterViewInit() {
        this.isDnsDefined = !!this.networkingConfig.dnsServiceEnvId;
        this.isSmbDefined = !!this.networkingConfig.smbServiceEnvId;
        this.isLinuxArchiveProxyDefined = !!this.networkingConfig.linuxArchiveProxyEnvId;
        this.isDnsAvailable = false;
        this.isSmbAvailable = false;
        this.isLinuxArchiveProxyAvailable = false;
        
        if(this.containerList.container.find((container => container.id === 'service-dns')))
        {
            this.isDnsAvailable = true;
            if(!this.networkingConfig.upstream_dns)
                this.networkingConfig.upstream_dns = "1.0.0.1";
        }
        if(this.containerList.container.find((container => container.id === 'service-smb')))
            this.isSmbAvailable = true;

        if(this.containerList.container.find((container => container.id === 'service-archive-proxy')))
            this.isLinuxArchiveProxyAvailable = true;

        // if the view is not interactive, environments are not passed, but dnsServiceEnv is defined: render dnsServiceEnv
        if (this.isDisabled && this.environments == undefined) {
            this.environments = [];
            if (this.isDnsDefined)
                this.environments.push(this.networkingConfig.dnsServiceEnvId);
            if (this.networkingConfig.isShared)
                this.environments.push(this.networkingConfig.startupEnv)
        }
    }

    updateNetworkDescription(newDesc) {
        this.networkingConfig.description = newDesc;
    }

    ensureDNSexclusivity($event: any, caseNum: number) {
        switch(caseNum) {
            case 1:
                this.networkingConfig.isDHCPenabled = false;
                break;
            case 2:
                this.isDnsDefined = false;
                break;
        }
    }
}
