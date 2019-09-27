import {Component, Inject, ViewEncapsulation} from "@angular/core";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material";
import {HttpClient} from "@angular/common/http";
import {NgForm, FormArray, FormControl, FormGroup, FormBuilder} from '@angular/forms'
@Component({
    selector: 'dialog-content-dialog',
    template: require('./edit-network-elements-modal.html'),
    styles: [require("./edit-network-elements-modal.css").toString()],
    encapsulation: ViewEncapsulation.None,
})
export class NetworkDialogComponent {
    macAddress: any;
    private label: string;
    serverIp: string;
    portForm: FormGroup;
    ports: FormArray;
    fqdn: string;
    wildcard: boolean;

    constructor(public dialogRef: MatDialogRef<NetworkDialogComponent>,
                @Inject(MAT_DIALOG_DATA) public data: any,
                private http: HttpClient,
                private formBuilder: FormBuilder,
                @Inject('$state') private $state: any,
                @Inject('REST_URLS') private REST_URLS: any,
                @Inject('localConfig') private localConfig: any) {
        if (typeof this.data.env.macAddress != "undefined")
            this.macAddress = this.data.env.macAddress;
        if (typeof this.data.env.label != "undefined")
            this.label = this.data.env.label;

        if (typeof this.data.env.serverIp != "undefined")
            this.serverIp = this.data.env.serverIp;

        if (typeof this.data.env.fqdn != "undefined")
            this.fqdn = this.data.env.fqdn;
        if (typeof this.data.env.wildcard != "undefined")
            this.wildcard = this.data.env.wildcard;
    }

    ngOnInit() {
        this.portForm = new FormGroup({
            ports: new FormArray([])
        });
        if (this.data.env.serverPorts != undefined) {
            this.data.env.serverPorts.forEach((port) => {
                this.addPort(port)
            })
        } else this.addPort('');
    }

    editEnv(f: NgForm) {
        if (f.valid && this.portForm.valid) {
            let ports = this.portForm.get('ports') as FormArray;
            const portNumbers =[]
            ports.value.forEach(port => {
                if (port.portNumber != "")
                    portNumbers.push(port.portNumber);
            });
            this.dialogRef.close({
                env: this.data.env,
                macAddress: this.macAddress,
                label: this.label,
                fqdn: this.fqdn,
                wildcard: this.wildcard,
                serverIp: this.serverIp,
                serverPorts: portNumbers
            });
        }
    }

    addPort(portNumber) {
        this.ports = this.portForm.get('ports') as FormArray;
        this.ports.push(this.createPort(portNumber));
    }

    private createPort(portNumber): FormGroup {
        return this.formBuilder.group({
            portNumber: portNumber ? portNumber : ''
        });
    }

    removePort(i) {
        const control = <FormArray>this.portForm.controls['ports'];
        control.removeAt(i);
    }

    assignRandomMac() {
        this.macAddress = "auto";
    }
}
