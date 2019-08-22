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
import {AddNetworkComponent} from "./components/network-environments/add/add-network-env.component.ts";
import {EditNetworkComponent} from "./components/network-environments/edit/edit-network-env.component.ts";

import {MaterialModule} from './material-module.ts';
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {MultiTranslateHttpLoader} from "ngx-translate-multi-http-loader";
import {HttpClient, HttpClientModule} from "@angular/common/http";
import {TranslateLoader, TranslateModule, TranslateService} from "@ngx-translate/core";
import {MatButtonModule, MatCheckboxModule} from '@angular/material';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {NetworkDialogComponent} from "./components/network-environments/templates/network-environment-view-template/modal/edit-network-elements-modal.ts";
import {NetworkEnvironmentView} from "./components/network-environments/templates/network-environment-view-template/network-environment-view.component.ts";
import {StartedNetworkOverview} from "./components/network-environments/run/started-network-overview.component.ts";


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
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: HttpLoaderFactory,
                deps: [HttpClient]
            }
        })],
    declarations: [
        AddNetworkComponent,
        NetworkDialogComponent,
        EditNetworkComponent,
        NetworkEnvironmentView,
        StartedNetworkOverview
    ],
    entryComponents: [
        AddNetworkComponent,
        NetworkDialogComponent,
        EditNetworkComponent,
        StartedNetworkOverview
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
        this.upgrade.bootstrap(document.body, ['emilAdminUI'], {});
    }
}

setAngularJSGlobal(angular);

platformBrowserDynamic().bootstrapModule(AppModule);

