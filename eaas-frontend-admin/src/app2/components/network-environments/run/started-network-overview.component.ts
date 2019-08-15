import {Component, Inject, Input, ViewChild} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {HttpClient} from "@angular/common/http";
import {MatTable} from '@angular/material';


@Component({
    selector: 'started-network-environment-overview',
    template: require('./started-network-overview.html'),
})
export class StartedNetworkOverview {
    @Input() eaasClient: any;
    @Input() networkSessionEnvironments: any;
    @ViewChild(MatTable, <any>{}) table: MatTable<any>;
    displayedColumns: string[] = ['environment', 'label', "actions"];


    constructor(public dialog: MatDialog,
                private http: HttpClient,
                @Inject('$state') private $state: any,
                @Inject('REST_URLS') private REST_URLS: any,
                @Inject('localConfig') private localConfig: any,
                @Inject('growl') private growl: any) {
    };


    showComponents() {
        console.log("this.eaasClient", this.eaasClient.network.sessionComponents);
        console.log("this.eaasClient", this.eaasClient);
        console.log("networkSessionEnvironments", this.networkSessionEnvironments);
    }

   async connect(element: any) {
        let container = this.eaasClient.container;
        this.eaasClient.disconnect(this.eaasClient.activeView.componentId);
        let componentSession = this.eaasClient.getSession(element.componentId);
        await this.eaasClient.connect(container, componentSession);

        console.log("element", element);
    }

   async delete(element: any) {
        console.log("session",element.componentId);

        const session = this.eaasClient.sessions.find( session =>
           session.componentId === element.componentId
        );
        console.log("session",session);
       await session.stop();
       this.eaasClient.sessions = await this.eaasClient.sessions.filter(item => item !== session);
       this.networkSessionEnvironments = await this.networkSessionEnvironments.filter(item => item.componentId !== session.componentId);
       console.log("this.eaasClient.sessions ", this.eaasClient.sessions );
       await this.table.renderRows();
       this.growl.success("Environment stopped successfully!");
    }
}
