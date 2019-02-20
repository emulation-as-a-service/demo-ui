/// <reference types="jest-environment-puppeteer" />
/// <reference types="expect-puppeteer" />
/// <reference types="puppeteer" />

import { TestUtils } from './helpers.js';

if (TestUtils.isHeadless()) {
    page.setDefaultTimeout(3000);
    jest.setTimeout(10000);
}
else {
    page.setDefaultTimeout(5000);
    jest.setTimeout(15000);
}
