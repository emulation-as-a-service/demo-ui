import {Component, Inject, ViewEncapsulation} from "@angular/core";
import {MAT_DIALOG_DATA} from "@angular/material";
import {HttpClient} from "@angular/common/http";

@Component({
    selector: 'dialog-content-dialog',
    template: require('./editEnvNetworkDialog.html'),
    encapsulation: ViewEncapsulation.None,
})
export class NetworkDialogComponent {
    macAddress: any;


    constructor(@Inject(MAT_DIALOG_DATA) public data: any,
                private http: HttpClient,
                @Inject('$state') private $state: any,
                @Inject('REST_URLS') private REST_URLS: any,
                @Inject('localConfig') private localConfig: any) {}

    private save() {
        this.http.post(this.REST_URLS.createNetworkEnvironmentUrl, {

        });

    }
}
