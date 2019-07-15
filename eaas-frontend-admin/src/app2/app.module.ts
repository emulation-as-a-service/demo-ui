import * as angular from 'angular';
import 'zone.js';
import 'babel-polyfill';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import {downgradeComponent, UpgradeModule} from '@angular/upgrade/static';
import {platformBrowserDynamic} from "@angular/platform-browser-dynamic";
import { setAngularJSGlobal } from '@angular/upgrade/static';

import '../app/app.js';
import {HeroDetailComponent} from "./components/network-environments/network-env.component.ts";
import {FormsModule} from "@angular/forms";
import {MultiTranslateHttpLoader} from "ngx-translate-multi-http-loader";
import {HttpClient, HttpClientModule} from "@angular/common/http";
import {TranslateLoader, TranslateModule} from "@ngx-translate/core";

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
        HttpClientModule,
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: HttpLoaderFactory,
                deps: [HttpClient]
            }
        })],
    declarations: [
        HeroDetailComponent
    ],
    entryComponents: [
        HeroDetailComponent
    ]
})
export class AppModule {
    constructor(private upgrade: UpgradeModule) { }
    ngDoBootstrap() {
        this.upgrade.bootstrap(document.body, ['emilAdminUI'], { });
    }
}
setAngularJSGlobal(angular);

platformBrowserDynamic().bootstrapModule(AppModule);

