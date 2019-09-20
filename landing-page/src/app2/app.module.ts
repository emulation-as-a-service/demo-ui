import * as angular from 'angular';
import 'zone.js';
import 'babel-polyfill';
import 'hammerjs';


import {Injectable, NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {downgradeComponent, UpgradeModule} from '@angular/upgrade/static';
import {platformBrowserDynamic} from "@angular/platform-browser-dynamic";
import {setAngularJSGlobal} from '@angular/upgrade/static';
import { MatIconModule } from '@angular/material/icon';
import '../app/app.js';

import {MaterialModule} from '../../../eaas-frontend-admin/src/app2/material-module.ts';
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {MultiTranslateHttpLoader} from "ngx-translate-multi-http-loader";
import {HttpClient, HttpClientModule} from "@angular/common/http";
import {TranslateLoader, TranslateModule, TranslateService} from "@ngx-translate/core";
import {MatButtonModule, MatCheckboxModule, MatCardModule} from '@angular/material';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';


export function HttpLoaderFactory(http: HttpClient) {
    return new MultiTranslateHttpLoader(http, [
        {prefix: "./locales/", suffix: ".json"}
    ]);
}

@NgModule({
    imports: [
        BrowserModule,
        UpgradeModule,
        FormsModule,
        ReactiveFormsModule,
        HttpClientModule,
        MatButtonModule,
        MatCheckboxModule,
        MaterialModule,
        BrowserAnimationsModule,
        MatIconModule,
        MatCardModule,
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: HttpLoaderFactory,
                deps: [HttpClient]
            }
        })],
    declarations: [

    ],
    entryComponents: [

    ],
    providers: [
        {
            provide: '$state',
            useFactory: ($injector: any) => $injector.get('$state'),
            deps: ['$injector']
        },
        {
            provide: 'REST_URLS',
            useFactory: ($injector: any) => $injector.get('REST_URLS'),
            deps: ['$injector']
        },
        {
            provide: 'localConfig',
            useFactory: ($injector: any) => $injector.get('localConfig'),
            deps: ['$injector']
        },
        {
            provide: 'growl',
            useFactory: ($injector: any) => $injector.get('growl'),
            deps: ['$injector']
        }
    ]
})

export class AppModule {
    constructor(private upgrade: UpgradeModule, public translate: TranslateService) {
        translate.addLangs(['en', 'de']);
        translate.setDefaultLang('en');

        const browserLang = translate.getBrowserLang();
        translate.use(browserLang.match(/en|de/) ? browserLang : 'en');
    }

    ngDoBootstrap() {
        this.upgrade.bootstrap(document.body, ['emilUI'], {});
    }
}

setAngularJSGlobal(angular);

platformBrowserDynamic().bootstrapModule(AppModule);

