import {AfterViewInit, Component, Inject, Input, ViewChild} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {HttpClient} from "@angular/common/http";
import {NetworkEnvironmentView} from "../templates/network-environment-view-template/network-environment-view.component.ts";
import {NgForm} from "@angular/forms";
import * as uuid from "uuid";

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

    ngOnInit() {
        // enrich chosenEnvs with title and implicit id
        if (this.selectedNetworkEnvironment.emilEnvironments.length > 0) {
            this.selectedNetworkEnvironment.emilEnvironments.forEach(networkElement => {
                    networkElement.title = this.environments.find((env => env.envId == networkElement.envId)).title;
                    networkElement.uiID = uuid.v4();
                }
            )
        }
    }

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
                        isDHCPenabled: this.networkEnvironmentView.isDHCPenabled,
                        isArchivedInternetEnabled: this.networkEnvironmentView.isArchivedInternetEnabled,
                        allowExternalConnections: this.networkEnvironmentView.allowExternalConnections
                    },
                    emilEnvironments: this.networkEnvironmentView.chosenEnvs,
                    title: this.networkEnvironmentView.networkEnvironmentTitle,
                    envId: this.selectedNetworkEnvironment.envId
                }).subscribe((reply : any) =>{
                    if(reply.status == "0"){
                        this.growl.success("Done");
                        this.$state.go('admin.standard-envs-overview', {showObjects: false, showContainers: false, showNetworkEnvs: true}, {reload: true});
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
