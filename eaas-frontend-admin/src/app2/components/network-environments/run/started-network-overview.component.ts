import {Component, Inject, Input, ViewChild} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {HttpClient} from "@angular/common/http";
import {MatTable} from '@angular/material';
import {animate, state, style, transition, trigger} from '@angular/animations';
import {NgForm} from '@angular/forms'


@Component({
    selector: 'started-network-environment-overview',
    styles: [require("./started-network-style.css").toString()],
    template: require('./started-network-overview.html'),
    animations: [
        trigger('detailExpand', [
            state('collapsed', style({height: '0px', minHeight: '0'})),
            state('expanded', style({height: '*'})),
            transition('expanded <=> collapsed', animate('125ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
        ]),
    ],
})
export class StartedNetworkOverview {
    @Input() eaasClient: any;
    @Input() networkSessionEnvironments: any;
    @Input() selectedNetworkEnvironment: any;
    @Input() dnsServiceEnv: any;
    @ViewChild(MatTable, <any>{}) table: MatTable<any>;
    displayedColumns: string[] = ['environment', 'label', "actions"];
    expandedElement: {componentId: null};
    networkingConfig: any;

    constructor(public dialog: MatDialog,
                private http: HttpClient,
                @Inject('$state') private $state: any,
                @Inject('REST_URLS') private REST_URLS: any,
                @Inject('localConfig') private localConfig: any,
                @Inject('growl') private growl: any) {
    };

    ngOnInit() {
        this.networkingConfig = {
            serverMode: this.selectedNetworkEnvironment.networking.serverMode,
            isDHCPenabled: this.selectedNetworkEnvironment.networking.isDHCPenabled,
            enableInternet: this.selectedNetworkEnvironment.networking.enableInternet,
            enableSocks: this.selectedNetworkEnvironment.networking.enableSocks,
            dhcpNetworkMask: this.selectedNetworkEnvironment.networking.dhcpNetworkMask,
            dhcpNetworkAddress: this.selectedNetworkEnvironment.networking.dhcpNetworkAddress,
            isArchivedInternetEnabled: this.selectedNetworkEnvironment.networking.isArchivedInternetEnabled,
            allowExternalConnections: this.selectedNetworkEnvironment.networking.allowExternalConnections,
            network: this.selectedNetworkEnvironment.network,
            gateway: this.selectedNetworkEnvironment.gateway,
            upstream_dns: this.selectedNetworkEnvironment.upstream_dns,
            dnsServiceEnv: this.dnsServiceEnv,
        };
    }

   async connect(element: any) {
        let container = this.eaasClient.container;
        this.eaasClient.disconnect(this.eaasClient.activeView.componentId);
        let componentSession = this.eaasClient.getSession(element.componentId);
        await this.eaasClient.connect(container, componentSession);

    }

    showComponents() {
        console.log("this.eaasClient", this.eaasClient.network.sessionComponents);
        console.log("this.eaasClient", this.eaasClient);
        console.log("networkSessionEnvironments", this.networkSessionEnvironments);
        console.log("expandedElement", this.expandedElement);
        console.log("this.eaasClient.network.wsConnection() ", this.eaasClient.network.wsConnection())
    }

   async delete(element: any) {
        const session = this.eaasClient.sessions.find( session =>
           session.componentId === element.componentId
        );
       await session.stop();
       this.eaasClient.sessions = await this.eaasClient.sessions.filter(item => item !== session);
       this.networkSessionEnvironments = await this.networkSessionEnvironments.filter(item => item.componentId !== session.componentId);
       await this.table.renderRows();
       this.growl.success("Environment stopped successfully!");
    }

    bindLocalPort(f: NgForm, serverIp, serverPort) {
        if(f.valid){
            this.eaasClient.getProxyURL({localPort: f.value.localPortBinding, serverIP: serverIp, serverPort: serverPort}).then((result) => {
                const element: HTMLIFrameElement = document.getElementById('eaas-proxy-iframe') as HTMLIFrameElement;
                const iframe = element.contentWindow;
                iframe.location = result;
            })
        }
    }
}
