import {Component, Inject, Input, ViewEncapsulation} from "@angular/core";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material";
import {HttpClient} from "@angular/common/http";
import {NgForm, FormArray, FormControl, FormGroup, FormBuilder} from '@angular/forms'
@Component({
    selector: 'consolidated-network-view',
    template: require('./consolidated-network-view.html'),
})
export class ConsolidatedNetworkView {
    @Input() networkSessionEnvironments: any;

    constructor(public dialogRef: MatDialogRef<ConsolidatedNetworkView>,
                @Inject(MAT_DIALOG_DATA) public data: any,
                private http: HttpClient,
                private formBuilder: FormBuilder,
                @Inject('$state') private $state: any,
                @Inject('REST_URLS') private REST_URLS: any,
                @Inject('localConfig') private localConfig: any) {
    }
}
