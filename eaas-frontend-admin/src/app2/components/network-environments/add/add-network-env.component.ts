import {AfterViewInit, Component, Inject, Input} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {HttpClient} from "@angular/common/http";
import {ViewChild} from '@angular/core';
import * as uuid from "uuid";
import {NgForm} from '@angular/forms';
import {NetworkEnvironmentView}  from "../templates/network-environment-view-template/network-environment-view.component.ts";

@Component({
    selector: 'add-network-environment',
    template: require('./add-network-env.html'),
})
export class AddNetworkComponent implements AfterViewInit {
    @Input() environments: any;
    @ViewChild(NetworkEnvironmentView, {static: false})
    private networkEnvironmentView: NetworkEnvironmentView;

    constructor(public dialog: MatDialog,
                private http: HttpClient,
                @Inject('$state') private $state: any,
                @Inject('REST_URLS') private REST_URLS: any,
                @Inject('localConfig') private localConfig: any,
                @Inject('growl') private growl: any) {
    }

    ngAfterViewInit() {
        // Override submitForm
        this.networkEnvironmentView.submitForm = (f: NgForm) => {
            if (f.valid) {
                // You will get form value if your form is valid
                this.http.put(`${this.localConfig.data.eaasBackendURL}${this.REST_URLS.networkEnvironmentUrl}`, {
                    networking: {
                        enableInternet: this.networkEnvironmentView.enableInternet,
                        serverMode: this.networkEnvironmentView.serverMode,
                        localServerMode: this.networkEnvironmentView.localServerMode,
                        enableSocks: this.networkEnvironmentView.enableSocks,
                        allowExternalConnections: this.networkEnvironmentView.allowExternalConnections,
                        isDHCPenabled: this.networkEnvironmentView.isDHCPenabled,
                        isArchivedInternetEnabled: this.networkEnvironmentView.isArchivedInternetEnabled
                    },
                    emilEnvironments: this.networkEnvironmentView.chosenEnvs,
                    title: this.networkEnvironmentView.networkEnvironmentTitle,
                    envId: uuid.v4()
                }).subscribe((reply : any) =>{
                    if(reply.status == "0"){
                        this.growl.success("Done");
                        this.$state.go('admin.standard-envs-overview', {}, {reload: true});
                    } else {
                        this.growl.error("Saved failed! ", reply);
                        console.log(reply);
                    }
                });
            } else {
                f.form.controls['evnLabel'].markAsTouched();
            }
        };
    }
}
