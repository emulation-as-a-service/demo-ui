import './setup.js';
import { SelectorUtils } from './helpers.js';
import { AdminUI} from './ui.js';

const ui = new AdminUI(page);


// ===== TestSuite ===============

describe('machine-environments', () => {
    beforeEach(async () => ui.gotoStartPage());

    test('show overview', async () => {
        await ui.gotoEnvironmentsOverview();

        const expectation = expect(page);
        for (const archive of ['private', 'public', 'remote']) {
            const selector = SelectorUtils.fromDataId('t-archive-' + archive);
            await expectation.toMatchElement(selector);
        }

        await expectation.toMatch('Number of Environments:');
    });

    test('search/filter', async () => {
        await ui.gotoEnvironmentsOverview();

        let selector = SelectorUtils.fromDataId('t-archive-private');
        let element = await page.waitForSelector(selector);
        await element.click();

        const envname ='DooM';
        const envid = '5001'

        await ui.searchForEnvironmentId(envid);
        await ui.clickChooseActionButton(envid);

        selector = SelectorUtils.fromDataId('m-edit');
        element = await page.waitForSelector(selector);
        await element.click();

        const expectation = expect(page);
        await expectation.toMatch(envname);
        await expectation.toMatch('ID: ' + envid);
    });

    test('run doom environment', async () => {
        await ui.gotoEnvironmentsOverview();

        let selector = SelectorUtils.fromDataId('t-archive-private');
        let element = await page.waitForSelector(selector);
        await element.click();

        const envid = '5001'

        await ui.searchForEnvironmentId(envid);
        await ui.clickChooseActionButton(envid);

        // Start emulator
        selector = SelectorUtils.fromDataId('m-run');
        element = await page.waitForSelector(selector);
        await element.click();

        // Wait until emulator starts...
        await page.waitForSelector('canvas', { visible: true, timeout: 10000 });
        await page.waitFor(2000);

        // Stop emulator
        selector = SelectorUtils.fromDataId('b-stop');
        element = await page.waitForSelector(selector);
        await element.click();

        // Wait for confirm modal-dialog and confirm
        selector = SelectorUtils.fromDataId('b-confirm-stop');
        element = await page.waitForSelector(selector);
        await element.click();

        // Let the emulator time to stop
        await page.waitFor(1000);

        // Check that we were redirected to environments-overview
        const expectation = expect(page);
        await expectation.toMatch('Environments');
        await expectation.toMatch('Number of Environments:');
    }, 60000);
});


describe('object-environments', () => {
    beforeEach(async () => ui.gotoStartPage());

    test('show overview', async () => {
        await ui.gotoEnvironmentsOverview('t-objects');

        const expectation = expect(page);
        await expectation.toMatch('Number of Environments:');
    });
});


describe('container-environments', () => {
    beforeEach(async () => ui.gotoStartPage());

    test('show overview', async () => {
        await ui.gotoEnvironmentsOverview('t-containers');

        const expectation = expect(page);
        await expectation.toMatch('Number of Environments:');
    });
});
