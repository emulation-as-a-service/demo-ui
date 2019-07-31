import {Component, Inject, Input} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {HttpClient} from "@angular/common/http";
import {ViewChild} from '@angular/core';
import {MatTable} from '@angular/material';
import {NetworkDialogComponent} from "./modal/NetworkDialog.ts";


@Component({
    selector: 'add-network-environment',
    template: require('./addNetworkEnv.html'),
})
export class AddNetworkComponent {
    @Input() environments: any;
    networking: any;
    enableInternet: boolean;
    serverMode: boolean;
    serverIp: string;
    serverPort: string;
    gwPrivateMask: string;
    enableSocks: boolean;
    isDHCPenabled: boolean;
    allowExternalConnections: boolean;
    archivedInternet: boolean;
    selectedEnv: any;
    envLabel: any;
    chosenEnvs: any[] = [];
    displayedColumns: string[] = ['environment', 'label', "actions"];
    @ViewChild(MatTable, <any>{}) table: MatTable<any>;


    constructor(public dialog: MatDialog,

                private http: HttpClient,
                @Inject('$state') private $state: any,
                @Inject('REST_URLS') private REST_URLS: any,
                @Inject('localConfig') private localConfig: any) {
    }

    private addEnv() {

        this.chosenEnvs.push({selectedEnv: this.selectedEnv, label: this.envLabel});
        this.selectedEnv = null;
        this.envLabel = null;
        if (typeof this.table != "undefined")
            this.table.renderRows();
    }


    save() {

    }

    deleteEnv(element: any) {
        this.chosenEnvs = this.chosenEnvs.filter(item => item !== element)
        this.table.renderRows();
    }



openEditDialog() {
    const environmentsWithNetworking = this.environments.filter(env => env.networkEnabled === true);
    const dialogRef = this.dialog.open(NetworkDialogComponent, {
        width: '30%',
        data: { environments: environmentsWithNetworking },
    });
    dialogRef.updatePosition({top: '20%'});

    dialogRef.afterClosed().subscribe(result => {
        console.log(`Dialog result: ${result}`);
    });
}
}
