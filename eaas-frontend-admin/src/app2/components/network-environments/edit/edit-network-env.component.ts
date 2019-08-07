import {Component, Inject, Input} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {HttpClient} from "@angular/common/http";

@Component({
    selector: 'edit-network-environment',
    template: require('./edit-network-env.html'),
})
export class EditNetworkComponent {
    @Input() environment: any;
    networking: any;
    enableInternet: boolean;
    serverMode: boolean;
    serverIp: string;
    serverPort: string;
    gwPrivateMask: string;
    enableSocks: boolean;
    isDHCPenabled: boolean;
    allowExternalConnections: boolean;
    isArchivedInternetEnabled: boolean;
    selectedEnv: any;
    envLabel: any;
    chosenEnvs: any[] = [];
    displayedColumns: string[] = ['environment', 'label', "actions"];
    private localServerMode: boolean;
    networkEnvironmentTitle: string;


    constructor(public dialog: MatDialog,
                private http: HttpClient,
                @Inject('$state') private $state: any,
                @Inject('REST_URLS') private REST_URLS: any,
                @Inject('localConfig') private localConfig: any,
                @Inject('growl') private growl: any) {
    };
}
