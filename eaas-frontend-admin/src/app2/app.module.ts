import * as angular from 'angular';
import 'zone.js';
import 'babel-polyfill';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { UpgradeModule } from '@angular/upgrade/static';
import {platformBrowserDynamic} from "@angular/platform-browser-dynamic";
import { setAngularJSGlobal } from '@angular/upgrade/static';

import '../app/app.js';


@NgModule({
    imports: [
        BrowserModule,
        UpgradeModule
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
