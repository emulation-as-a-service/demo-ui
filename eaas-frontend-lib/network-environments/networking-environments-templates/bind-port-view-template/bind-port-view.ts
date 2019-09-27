import {Component, Inject, Input, ViewEncapsulation} from "@angular/core";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material";
import {HttpClient} from "@angular/common/http";
import {NgForm, FormArray, FormControl, FormGroup, FormBuilder} from '@angular/forms'
@Component({
    selector: 'bind-port-view',
    template: require('./bind-port-view.html'),
})
export class BindPortView {
    @Input() serverIp: string;
    @Input() serverPorts: string[];
    @Input() eaasClient: any;

    constructor(private http: HttpClient,
                private formBuilder: FormBuilder,
                @Inject('$state') private $state: any,
                @Inject('REST_URLS') private REST_URLS: any,
                @Inject('localConfig') private localConfig: any) {
    }

    bindLocalPort(f: NgForm, serverIp, serverPort) {
        if(f.valid){
            this.eaasClient.getProxyURL({localPort: f.value.localPortBinding, serverIP: serverIp, serverPort: serverPort}).then((result) => {
                const element: HTMLIFrameElement = document.getElementById('eaas-proxy-iframe') as HTMLIFrameElement;
                const iframe = element.contentWindow;
                iframe.location = result;
            })
        }
    }
}
