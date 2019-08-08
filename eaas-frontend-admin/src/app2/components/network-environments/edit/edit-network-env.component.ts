import {AfterViewInit, Component, Inject, Input, ViewChild} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {HttpClient} from "@angular/common/http";
import {NetworkEnvironmentView} from "../views/network-environment-view.component.ts";
import {NgForm} from "@angular/forms";

@Component({
    selector: 'edit-network-environment',
    template: require('./edit-network-env.html'),
})
export class EditNetworkComponent implements AfterViewInit {
    @Input() selectedNetworkEnvironment: any;
    @Input() environments: any;

    @ViewChild(NetworkEnvironmentView, {static: false})
    private networkEnvironmentView: NetworkEnvironmentView;

    constructor(public dialog: MatDialog,
                private http: HttpClient,
                @Inject('$state') private $state: any,
                @Inject('REST_URLS') private REST_URLS: any,
                @Inject('localConfig') private localConfig: any,
                @Inject('growl') private growl: any) {
    };

    ngAfterViewInit() {
        this.networkEnvironmentView.submitForm = (f: NgForm) => {
            if (f.valid) {
                // You will get form value if your form is valid
                this.http.post(`${this.localConfig.data.eaasBackendURL}${this.REST_URLS.networkEnvironmentUrl}`, {
                    networking: {
                        enableInternet: this.networkEnvironmentView.enableInternet,
                        serverMode: this.networkEnvironmentView.serverMode,
                        localServerMode: this.networkEnvironmentView.localServerMode,
                        enableSocks: this.networkEnvironmentView.enableSocks,
                        serverPort: this.networkEnvironmentView.serverPort,
                        serverIp: this.networkEnvironmentView.serverIp,
                        isDHCPenabled: this.networkEnvironmentView.isDHCPenabled,
                        isArchivedInternetEnabled: this.networkEnvironmentView.isArchivedInternetEnabled,
                        allowExternalConnections: this.networkEnvironmentView.allowExternalConnections
                    },
                    emilEnvironments: this.networkEnvironmentView.chosenEnvs,
                    title: this.networkEnvironmentView.networkEnvironmentTitle,
                    envId: this.selectedNetworkEnvironment.envId
                }).subscribe((reply : any) =>{
                    console.log("reply", reply);
                    // TODO check status
                    // if(reply.status == "0"){
                        this.growl.success("Done");
                        this.$state.go('admin.standard-envs-overview', {}, {reload: true});
                    // } else {
                    //     this.growl.error("Saved failed! ", reply);
                    //     console.log(reply);
                    // }
                });
            } else {
                f.form.controls['evnLabel'].markAsTouched();
            }
        };
    }
}
