import {AfterViewInit, Component, Inject, Input} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {HttpClient} from "@angular/common/http";
import {ViewChild} from '@angular/core';
import {MatTable} from '@angular/material';
import {NetworkDialogComponent} from "../modal/edit-network-elements-modal.ts";
import * as uuid from "uuid";
import {NgForm} from '@angular/forms';
import {NetworkEnvironmentView}  from "../views/network-environment-view.component.ts";



@Component({
    selector: 'add-network-environment',
    template: require('./add-network-env.html'),
})
export class AddNetworkComponent implements AfterViewInit {
    @Input() environments: any;
    @ViewChild(NetworkEnvironmentView, {static: false})
    private networkEnvironmentView: NetworkEnvironmentView;
    chosenEnvs: any[] = [];
    form: NgForm = new NgForm([],[]);


    constructor(public dialog: MatDialog,
                private http: HttpClient,
                @Inject('$state') private $state: any,
                @Inject('REST_URLS') private REST_URLS: any,
                @Inject('localConfig') private localConfig: any,
                @Inject('growl') private growl: any) {
    }

    ngAfterViewInit() {
        this.chosenEnvs = this.networkEnvironmentView.chosenEnvs;
        // Override submitForm
        this.networkEnvironmentView.submitForm = (f: NgForm) => {
            if (f.valid) {

                // You will get form value if your form is valid
                this.http.put(`${this.localConfig.data.eaasBackendURL}${this.REST_URLS.createNetworkEnvironmentUrl}`, {
                    networking: {
                        enableInternet: this.networkEnvironmentView.enableInternet,
                        serverMode: this.networkEnvironmentView.serverMode,
                        localServerMode: this.networkEnvironmentView.localServerMode,
                        enableSocks: this.networkEnvironmentView.enableSocks,
                        serverPort: this.networkEnvironmentView.serverPort,
                        serverIp: this.networkEnvironmentView.serverIp,
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



    showStuff() {
        console.log( this.networkEnvironmentView.chosenEnvs);

        console.log(this.networkEnvironmentView.enableInternet)
    }
}
