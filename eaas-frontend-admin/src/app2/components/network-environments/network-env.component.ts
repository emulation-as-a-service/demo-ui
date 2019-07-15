import {Component, Input} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';


@Component({
    selector: 'add-network-environment',
    template: `
        <button (click)="addBoldText()">{{ 'ADD_NETWORK_ENVIRONMENT' | translate }}</button>
    `
})
export class HeroDetailComponent {

    constructor(public translate: TranslateService) {
        translate.addLangs(['en', 'de']);
        translate.setDefaultLang('en');

        const browserLang = translate.getBrowserLang();
        translate.use(browserLang.match(/en|de/) ? browserLang : 'en');
    }

    @Input() myHTML: any;
    customText: "";

    addBoldText() {
        console.log("very nice")
    }


}
