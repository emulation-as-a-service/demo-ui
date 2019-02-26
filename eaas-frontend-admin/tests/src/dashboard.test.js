import './setup.js';
import { SelectorUtils } from './helpers.js';
import { AdminUI } from './ui.js';

const ui = new AdminUI(page);


// ===== TestSuite ===============

describe('dashboard', () => {
    beforeEach(async () => ui.gotoStartPage());

    test('show dashboard', async () => {
        const selector = SelectorUtils.fromDataId('m-env-overview');
        const expectation = expect(page);
        await expectation.toMatchElement(selector);
        await expectation.toMatch('Resource Provider');
        await expectation.toMatch('State');
        await expectation.toMatch('Node Count');
    });
});
