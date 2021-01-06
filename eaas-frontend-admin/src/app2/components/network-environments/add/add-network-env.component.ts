import {AfterViewInit, Component, Inject, Input} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {HttpClient} from "@angular/common/http";
import {ViewChild} from '@angular/core';
import * as uuid from "uuid";
import {NgForm} from '@angular/forms';
import {NetworkEnvironmentView} from "EaasLibs/network-environments/networking-environments-templates/network-environment-view-template/network-environment-view.component.ts";
import {saveNetworkEnv} from "EaasLibs/network-environments/network-environment-saver.ts";
import {NetworkBuilder} from "../../../../../../eaas-client/lib/networkBuilder.js";
import { AuthService } from '../../../auth/auth.service.ts';


@Component({
    selector: 'add-network-environment',
    template: require('./add-network-env.html'),
})
export class AddNetworkComponent implements AfterViewInit {
    @Input() environments: any;
    @Input() containerList: any;
    
    @ViewChild(NetworkEnvironmentView, {static: false})
    private networkEnvironmentView: NetworkEnvironmentView;

    constructor(public dialog: MatDialog,
                private http: HttpClient,
                @Inject('$state') private $state: any,
                @Inject('REST_URLS') private REST_URLS: any,
                @Inject('localConfig') private localConfig: any,
                @Inject('growl') private growl: any,
                public auth: AuthService) {
    }

    ngAfterViewInit() {
        // Override submitForm
        this.networkEnvironmentView.submitForm = (f: NgForm, run: boolean=false) => {
            if (f.valid) {
                // You will get form value if your form is valid
                // You will get form value if your form is valid
                const _uuid :string = uuid.v4();
                saveNetworkEnv(this.http,
                    'put',
                    `${this.localConfig.data.eaasBackendURL}${this.REST_URLS.networkEnvironmentUrl}`,
                    this.networkEnvironmentView,
                    _uuid)
                    .subscribe(async (reply: any) => {
                        if (reply.status == "0") {
                            this.growl.success("Done");
                            if(!run)
                                this.$state.go('admin.networking', {}, {reload: true});
                            else {
                                let networkBuilder = new NetworkBuilder(this.localConfig.data.eaasBackendURL, this.auth.getToken());
                                let networkEnvironment = await networkBuilder.getNetworkEnvironmentById(_uuid);
                                await networkBuilder.loadNetworkEnvironment(networkEnvironment);
                                this.$state.go("admin.emuView",  {
                                    components: networkBuilder.getComponents(), 
                                    clientOptions: networkBuilder.getClientOptions()
                                }, {}); 
                            }
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
