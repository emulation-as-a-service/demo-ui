import {Component, EventEmitter, Inject, Input, Output} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {HttpClient} from "@angular/common/http";
import {ViewChild} from '@angular/core';
import {MatTable} from '@angular/material';
import {NetworkDialogComponent} from "./modal/edit-network-elements-modal.ts";
import * as uuid from "uuid";
import {FormArray, FormGroup, NgForm} from '@angular/forms';
import {NetworkConfigTemplate} from "./network-config-template/network-config-template.ts";
import {assignRandomMac} from "EaasLibs/utils/randomMacGenerator.ts";


@Component({
    selector: 'network-environment-view',
    template: require('./network-environment-view.html'),
})
export class NetworkEnvironmentView {
    @Input() environments: any;
    @Input() chosenEnvs: any[] = [];
    @Input() networkingConfig: any;
    @Input() networkEnvironmentTitle: string;
    @Input() containerList: any;

    @ViewChild(NetworkConfigTemplate, {static: false})
    networkConfigTemplate: NetworkConfigTemplate;

    selectedEnv: any;
    envLabel: any;
    displayedColumns: string[] = ['environment', 'label', "actions"];
    @ViewChild(MatTable, <any>{}) table: MatTable<any>;
    localServerMode: boolean;

    constructor(public dialog: MatDialog,
                private http: HttpClient,
                @Inject('$state') private $state: any,
                @Inject('REST_URLS') private REST_URLS: any,
                @Inject('localConfig') private localConfig: any,
                @Inject('growl') private growl: any) {

    }

    ngOnInit () {
        if (this.networkingConfig){
            this.networkingConfig.dnsServiceEnvId = this.environments.find((env => env.envId == this.networkingConfig.dnsServiceEnvId));
            this.networkingConfig.smbServiceEnvId = this.environments.find((env => env.envId == this.networkingConfig.smbServiceEnvId));
            this.networkingConfig.linuxArchiveProxyEnvId = this.environments.find((env => env.envId == this.networkingConfig.linuxArchiveProxyEnvId));
            this.networkingConfig.startupEnv = this.environments.find((env => env.envId == this.networkingConfig.startupEnvId));
        }
        else
            this.networkingConfig = {};
    }

    private addEnv() {
        this.selectedEnv.label = this.envLabel;
        this.selectedEnv.uiID = uuid.v4();
        this.selectedEnv.macAddress = assignRandomMac();
        let obh = Object.assign({}, this.selectedEnv);
        this.chosenEnvs.push(obh);
        this.selectedEnv = {};
        this.envLabel = "";
        if (typeof this.table != "undefined")
            this.table.renderRows();
    }

    deleteEnv(element: any) {
        this.chosenEnvs = this.chosenEnvs.filter(item => item !== element);
        this.table.renderRows();
    }

    openEditDialog(env) {
        const dialogRef = this.dialog.open(NetworkDialogComponent, {
            width: '40%',
            data: {env: env, allowExternalConnections: this.networkingConfig.allowExternalConnections},
        });
        dialogRef.updatePosition({top: '10%'});
        dialogRef.afterClosed().subscribe(result => {
            // add macAddress to env
            if (typeof result != "undefined") {
                this.chosenEnvs.find(item => item.uiID == result.env.uiID).macAddress = result.macAddress;
                this.chosenEnvs.find(item => item.uiID == result.env.uiID).label = result.label;
                this.chosenEnvs.find(item => item.uiID == result.env.uiID).serverIp = result.serverIp;
                this.chosenEnvs.find(item => item.uiID == result.env.uiID).serverPorts = result.serverPorts;
                this.chosenEnvs.find(item => item.uiID == result.env.uiID).fqdn = result.fqdn;
                this.chosenEnvs.find(item => item.uiID == result.env.uiID).wildcard = result.wildcard;
            }
        });
    }

    // Abstract method to be overwritten by the parent component
    submitForm(f: NgForm, run: boolean=false) {}
}
