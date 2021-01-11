import {AfterViewInit, Component, Inject, Input, ViewChild} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {HttpClient} from "@angular/common/http";
import {NetworkEnvironmentView} from "EaasLibs/network-environments/networking-environments-templates/network-environment-view-template/network-environment-view.component.ts";
import {NgForm} from "@angular/forms";
import * as uuid from "uuid";
import {saveNetworkEnv} from "EaasLibs/network-environments/network-environment-saver.ts";
import {NetworkBuilder} from "../../../../../../eaas-client/lib/networkBuilder.js";
import { AuthService } from '../../../auth/auth.service.ts';

@Component({
    selector: 'edit-network-environment',
    template: require('./edit-network-env.html'),
})
export class EditNetworkComponent implements AfterViewInit {
    @Input() selectedNetworkEnvironment: any;
    @Input() environments: any;
    @Input() containerList: any;

    @ViewChild(NetworkEnvironmentView, {static: false})
    private networkEnvironmentView: NetworkEnvironmentView;
    private networkingConfig: any;

    constructor(public dialog: MatDialog,
                private http: HttpClient,
                @Inject('$state') private $state: any,
                @Inject('REST_URLS') private REST_URLS: any,
                @Inject('localConfig') private localConfig: any,
                @Inject('growl') private growl: any,
                public auth: AuthService) {
    };

    ngOnInit() {
        this.networkingConfig = {
            serverMode: this.selectedNetworkEnvironment.networking.serverMode,
            isDHCPenabled: this.selectedNetworkEnvironment.networking.isDHCPenabled,
            enableInternet: this.selectedNetworkEnvironment.networking.enableInternet,
            localServerMode: this.selectedNetworkEnvironment.networking.localServerMode,
            enableSocks: this.selectedNetworkEnvironment.networking.enableSocks,
            dhcpNetworkMask: this.selectedNetworkEnvironment.networking.dhcpNetworkMask,
            dhcpNetworkAddress: this.selectedNetworkEnvironment.networking.dhcpNetworkAddress,
            isArchivedInternetEnabled: this.selectedNetworkEnvironment.networking.isArchivedInternetEnabled,
            allowExternalConnections: this.selectedNetworkEnvironment.networking.allowExternalConnections,
            archiveInternetDate: this.selectedNetworkEnvironment.networking.archiveInternetDate,
            network: this.selectedNetworkEnvironment.network,
            gateway: this.selectedNetworkEnvironment.gateway,
            upstream_dns: this.selectedNetworkEnvironment.upstream_dns,
            dnsServiceEnvId: this.selectedNetworkEnvironment.dnsServiceEnvId,
            smbServiceEnvId: this.selectedNetworkEnvironment.smbServiceEnvId,
            linuxArchiveProxyEnvId: this.selectedNetworkEnvironment.linuxArchiveProxyEnvId,
            startupEnvId: this.selectedNetworkEnvironment.startupEnvId,
            isShared: !!this.selectedNetworkEnvironment.startupEnvId,
            description: this.selectedNetworkEnvironment.description,
        };
        // enrich chosenEnvs with title and implicit id

        if (this.selectedNetworkEnvironment.emilEnvironments.length > 0) {
            this.selectedNetworkEnvironment.emilEnvironments.forEach(networkElement => {
                    networkElement.uiID = uuid.v4();
                }
            )
        }
    }

    ngAfterViewInit() {
        this.networkEnvironmentView.submitForm = (f: NgForm, run: boolean=false) => {
            if (f.valid) {
                // You will get form value if your form is valid
                saveNetworkEnv(this.http,
                    'post',
                    `${this.localConfig.data.eaasBackendURL}${this.REST_URLS.networkEnvironmentUrl}`,
                    this.networkEnvironmentView,
                    this.selectedNetworkEnvironment.envId)
                    .subscribe(async (reply: any) => {
                        if (reply.status == "0") {
                            this.growl.success("Done");
                            if(!run)
                                this.$state.go('admin.networking', {}, {reload: true});
                            else
                            {
                                let networkBuilder = new NetworkBuilder(this.localConfig.data.eaasBackendURL, this.auth.getToken());
                                let networkEnvironment = await networkBuilder.getNetworkEnvironmentById(this.selectedNetworkEnvironment.envId);
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
