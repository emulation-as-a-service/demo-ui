import {Component, Inject, Input} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {HttpClient} from "@angular/common/http";
import {ViewChild} from '@angular/core';
import {MatTable} from '@angular/material';
import {NetworkDialogComponent} from "./modal/edit-network-elements-modal.ts";
import * as uuid from "uuid";
import {FormArray, FormGroup, NgForm} from '@angular/forms';


@Component({
    selector: 'network-environment-view',
    template: require('./network-environment-view.html'),
})
export class NetworkEnvironmentView {
    @Input() environments: any;
    @Input() networking: any;
    @Input() enableInternet: boolean;
    @Input() serverMode: boolean;
    @Input() gwPrivateMask: string;
    @Input() enableSocks: boolean;
    @Input() isDHCPenabled: boolean;
    @Input() allowExternalConnections: boolean;
    @Input() isArchivedInternetEnabled: boolean;
    @Input() networkEnvironmentTitle: string;
    @Input() chosenEnvs: any[] = [];
    @Input() dhcpNetworkAddress: string;
    @Input() dhcpNetworkMask: string;


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

    private addEnv() {
        this.selectedEnv.label = this.envLabel;
        this.selectedEnv.uiID = uuid.v4();
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
serverIp

    openEditDialog(env) {
        const dialogRef = this.dialog.open(NetworkDialogComponent, {
            width: '40%',
            data: {env: env, allowExternalConnections: this.allowExternalConnections},
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
            }
        });
    }

    // Abstract method to be overwritten by the parent component
    submitForm(f: NgForm) {}
}

