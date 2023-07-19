// @ts-check
const {test, expect} = require('@playwright/test');

const domain = "http://localhost:80"
const origin = new URL(domain).origin;

const timeout = time_ms => new Promise(r => setTimeout(r, time_ms));


test("Test Setup Emulator, Image and Environment", async ({page}) => {
    console.log("Starting tests...")
    await page.goto(`${origin}/admin/`);
    await page.goto(`${origin}/admin/#/admin/dashboard`);
    console.log("Installing Emulator...")
    await page.getByRole('link', {name: 'Environments'}).click();
    await page.getByRole('link', {name: 'Administration'}).click();
    await page.screenshot({path: "test-results/administration.png"});
    await page.getByRole('link', {name: 'Manage Emulators Emulators'}).click();
    await page.screenshot({path: "test-results/emulators.png"});
    await page.getByRole('row', {name: 'qemu-system 0 install latest Details'}).getByRole('button', {name: 'install latest'}).click();
    console.log("Waiting for emulator to be installed...")
    await page.getByRole('link', {name: 'Images'}).click({timeout: 300_000});
    console.log("Emulator installed successfully, creating new Image...")
    await page.getByRole('button', {name: '+ New Image'}).click();
    await page.getByLabel('Disk image label:').click();
    await page.getByLabel('Disk image label:').fill('elephan-dos');
    await page.getByText('Import image').click();
    await page.getByPlaceholder('http://').click();
    await page.getByPlaceholder('http://').fill('https://github.com/rafaelgieschke/elephan-dos/raw/main/elephan-dos');
    await page.getByRole('button', {name: 'OK'}).click();
    console.log("Successfully created Image, creating Env...")
    await page.getByRole('link', {name: 'Environments'}).click();
    await page.getByRole('button', {name: '+ Create Environment'}).click();
    await page.getByRole('button', {name: 'Linux'}).click();
    await page.getByLabel('Machine Name').fill('elphan-dos');
    await page.getByTitle('Search or choose a system...').locator('span').first().click();
    await page.getByRole('link', {name: 'Debian/Ubuntu'}).click();
    await page.getByPlaceholder(' MB').click();
    await page.getByPlaceholder(' MB').fill('10 MB');
    await page.locator('.main-container > div:nth-child(2)').click();
    await page.locator('div:has(> input)').filter({hasText: 'XPRA Video (Experimental)'}).getByRole('checkbox').check();
    await page.locator('div:has(> input)').filter({hasText: 'XPRA Video (Experimental) png jpeg auto'}).getByRole('checkbox').uncheck();
    await page.locator('div:has(> input)').filter({hasText: 'XPRA Video (Experimental)'}).getByRole('checkbox').check();
    await page.locator('div:has(> input)').filter({hasText: 'WebRTC Audio (Beta)'}).getByRole('checkbox').check();
    await page.getByRole('listitem').filter({hasText: 'Drive Type: disk empty drive boot drive'}).locator('i').click();
    await page.getByText('Select from disk image library').click();
    await page.getByTitle('Select disk image').locator('span').first().click();
    await page.getByRole('link', {name: 'elephan-dos'}).click();
    await page.getByRole('button', {name: 'OK'}).click();
    await page.getByRole('button', {name: 'Save'}).click();
    console.log("Successfully Created Env!")
    await page.getByRole('button', {name: 'Choose action'}).click();
    console.log("Running Env now...")
    await page.getByText('Run Environment').click();

    await timeout(40_000);
    await page.screenshot({path: "test-results/environment.png"});
    await page.getByRole('button', { name: 'Stop' }).click();
    await page.getByRole('button', { name: 'OK' }).click();
    console.log("Successfully stopped...")

});

test('Test Environment can be run', async ({page}) => {
    console.log("Starting test 1.1")
    await page.goto('http://localhost/admin/');
    await page.goto('http://localhost/admin/#/admin/dashboard');
    await page.getByRole('link', { name: 'Environments' }).click();
    await page.getByRole('button', { name: 'Choose action' }).click();
    await page.getByText('Run Environment').click();
    await page.getByRole('button', { name: 'Stop' }).click();
    await page.getByRole('button', { name: 'OK' }).click();
    await expect(page.getByRole('heading', { name: 'elphan-dos' })).toBeVisible();
});

test('Test Ghost Cursor Field', async ({page}) => {
    console.log("Starting test 1.2 (Hide ghust cursor setting)")
    await page.goto('http://localhost/admin/');
    await page.goto('http://localhost/admin/#/admin/dashboard');
    await page.getByRole('link', { name: 'Environments' }).click();
    await page.getByRole('button', { name: 'Choose action' }).click();
    await page.getByRole('menuitem', { name: 'Details' }).locator('a').click();
    await page.screenshot({path: "test-results/env_overview.png", fullPage: true});
    await page.locator('div:nth-child(6) > .ng-pristine').check();
    await page.getByRole('link', { name: 'Save' }).click();
    await expect(page.locator('div:nth-child(6) > .ng-pristine')).toBeChecked();

});

