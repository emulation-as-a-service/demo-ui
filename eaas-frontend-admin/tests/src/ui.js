/// <reference types="puppeteer" />

import { Page } from 'puppeteer';
import { SelectorUtils} from './helpers.js';

export const APPURL = 'http://localhost:8082';

export class AdminUI {
    /**
     * @param {Page} page
     */
    constructor(page) {
        this.curpage = page;
    }

    async gotoStartPage() {
        // redirect to start-page
        const options = { waitUntil: ['domcontentloaded', 'networkidle0'] };
        return await this.curpage.goto(APPURL, options);
    }

    async gotoEnvironmentsOverview(tab = 't-vms') {
        let selector = SelectorUtils.fromDataId('m-env-overview');
        let element = await this.curpage.waitForSelector(selector);
        element.click();

        selector = SelectorUtils.fromDataId(tab);
        element = await this.curpage.waitForSelector(selector);
        return element.click();
    }

    async searchForEnvironmentId(envid) {
        const selector = SelectorUtils.fromDataId('i-search');
        const element = await page.waitForSelector(selector);
        await element.type(envid);

        // Wait a bit for the dynamic grid
        // to show filtered results!
        return page.waitFor(1000);
    }

    async clickChooseActionButton(exptext) {
        const pagefn = (stor, text) => {
            const matches = Array.from(document.querySelectorAll(stor))
                .filter(entry => entry.innerText.includes(text));

            return matches[0];
        };

        const selector = SelectorUtils.fromDataId('g-envs');
        let element = await this.curpage.waitForFunction(pagefn, {}, selector, exptext);
        element = await element.$('button');
        return element.click();
    }
};
