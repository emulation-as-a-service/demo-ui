import {Component, Inject, Input} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {HttpClient} from "@angular/common/http";
import {ViewChild} from '@angular/core';
import {MatTable} from '@angular/material';
import {NetworkDialogComponent} from "../modal/edit-network-elements-modal.ts";
import * as uuid from "uuid";
import {NgForm} from '@angular/forms';


@Component({
    selector: 'network-environment-view',
    template: require('./network-environment-view.html'),
})
export class NetworkEnvironmentView {
    @Input() environments: any;
    @Input() networking: any;
    @Input() enableInternet: boolean;
    @Input() serverMode: boolean;
    @Input() serverIp: string;
    @Input() serverPort: string;
    @Input() gwPrivateMask: string;
    @Input() enableSocks: boolean;
    @Input() isDHCPenabled: boolean;
    @Input() allowExternalConnections: boolean;
    @Input() isArchivedInternetEnabled: boolean;
    @Input() networkEnvironmentTitle: string;
    @Input() chosenEnvs: any[] = [];


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
        this.selectedEnv.envId = uuid.v4();
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
            data: {env: env},
        });
        dialogRef.updatePosition({top: '10%'});
        dialogRef.afterClosed().subscribe(result => {
            // add macAddress to env
            if (typeof result != "undefined") {
                this.chosenEnvs.find(item => item.uiID == result.env.uiID).macAddress = result.macAddress;
                this.chosenEnvs.find(item => item.uiID == result.env.uiID).label = result.label;
            }
        });
    }

    // Abstract method to be overwritten by the parent compo
    submitForm(f: NgForm) {}
}

