import {Component, Inject, ViewEncapsulation} from "@angular/core";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material";
import {HttpClient} from "@angular/common/http";
import {NgForm} from '@angular/forms'

@Component({
    selector: 'dialog-content-dialog',
    template: require('./edit-network-elements-modal.html'),
    encapsulation: ViewEncapsulation.None,
})
export class NetworkDialogComponent {
    macAddress: any;
    private label: string;

    constructor(public dialogRef: MatDialogRef<NetworkDialogComponent>,
                @Inject(MAT_DIALOG_DATA) public data: any,
                private http: HttpClient,
                @Inject('$state') private $state: any,
                @Inject('REST_URLS') private REST_URLS: any,
                @Inject('localConfig') private localConfig: any) {
        console.log(this.data.env);

        this.macAddress = "";
        if (typeof this.data.env.macAddress != "undefined")
            this.macAddress = this.data.env.macAddress;
        if (typeof this.data.env.label != "undefined")
            this.label = this.data.env.label;
    }

    editEnv(f: NgForm) {
        if (f.valid)
            this.dialogRef.close({env: this.data.env, macAddress: this.macAddress, label: this.label});
    }
}
