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

import { HTTP_INTERCEPTORS } from '@angular/common/http';

import {MaterialModule} from './material-module.ts';
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {MultiTranslateHttpLoader} from "ngx-translate-multi-http-loader";
import {HttpClient, HttpClientModule, HttpBackend} from "@angular/common/http";
import { TranslateService} from "@ngx-translate/core";
import {MatButtonModule, MatCheckboxModule, MatCardModule} from '@angular/material';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {NetworkDialogComponent} from "EaasLibs/network-environments/networking-environments-templates/network-environment-view-template/modal/edit-network-elements-modal.ts";
import {NetworkEnvironmentView} from "EaasLibs/network-environments/networking-environments-templates/network-environment-view-template/network-environment-view.component.ts";
import {ConsolidatedNetworkView} from "EaasLibs/network-environments/networking-environments-templates/consolidated-network-view-template/consolidated-network-view.component.ts";
import {NetworkConfigTemplate} from "EaasLibs/network-environments/networking-environments-templates/network-environment-view-template/network-config-template/network-config-template.ts";
import {BindPortView} from "EaasLibs/network-environments/networking-environments-templates/bind-port-view-template/bind-port-view.ts";
import {StartedNetworkOverview} from "EaasLibs/network-environments/run/started-network-overview.component.ts";
import {DescriptionTextDirective} from "EaasLibs/directives/description-angular-text.directory.ts";
import { AuthService } from "./auth/auth.service.ts"
import { TokenInterceptor } from "./auth/token.interceptor.ts"

import {TranslateModule, TranslateLoader} from '@ngx-translate/core';
import {TranslateHttpLoader} from '@ngx-translate/http-loader';

export function createTranslateLoader(http: HttpClient) {
    return new TranslateHttpLoader(http, './locales/', '.json');
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
              useFactory: createTranslateLoader,
              deps: [HttpClient]
            }
          })],
    declarations: [
        DescriptionTextDirective,
        AddNetworkComponent,
        NetworkDialogComponent,
        EditNetworkComponent,
        NetworkEnvironmentView,
        StartedNetworkOverview,
        ConsolidatedNetworkView,
        NetworkConfigTemplate,
        BindPortView
    ],
    entryComponents: [
        AddNetworkComponent,
        NetworkDialogComponent,
        EditNetworkComponent,
        StartedNetworkOverview,
        ConsolidatedNetworkView
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
        },
        AuthService,
        {provide: HTTP_INTERCEPTORS, useClass: TokenInterceptor, multi: true},
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

