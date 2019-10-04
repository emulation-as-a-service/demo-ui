import {Component, Input} from '@angular/core';

@Component({
    selector: 'network-config-template',
    template: require('./network-config-template.html'),
})
export class NetworkConfigTemplate {
    @Input() networkingConfig: any;
    @Input() isDisabled: boolean;
    @Input() environments: any;
    isDnsDefined: boolean;
    startDate = new Date(2000, 0, 1);

    ngAfterViewInit() {
        this.isDnsDefined = !!this.networkingConfig.dnsServiceEnv;
        // if the view is not interactive, environments are not passed, but dnsServiceEnv is defined: render dnsServiceEnv
        if (this.isDisabled && this.isDnsDefined && this.environments == undefined) {
            this.environments = [this.networkingConfig.dnsServiceEnv];
        }
    }

    updateNetworkDescription(newDesc) {
        this.networkingConfig.description = newDesc;
    }
}
