import {test, expect, open, picker, option, openPicker, expectTheme, setPreviewDisabled} from './fixtures';

test('hover previews without changing selection and leaving restores it', async ({page}) => {
    await open(page);
    await openPicker(page);
    await option(page, 'Light').hover();
    await expectTheme(page, 'light');
    await expect(picker(page)).toHaveValue('dark');
    await page.getByRole('button', {name: 'After the picker'}).hover();
    await expectTheme(page, 'dark');
});

test('keyboard navigation preserves the browser\'s native commit or focus-preview behavior', async ({page, browserName}) => {
    await open(page);
    await openPicker(page);
    await page.keyboard.press('ArrowDown');
    // Gecko's current customizable select keeps focus on the select and emits
    // `change` on each arrow key. Chromium/WebKit focus options without selecting.
    if (browserName === 'firefox') {
        await expect(picker(page)).toBeFocused();
        await expect(picker(page)).toHaveValue('light');
        await expectTheme(page, 'light');
        await page.keyboard.press('ArrowDown');
        await expect(picker(page)).toHaveValue('lighter');
        await expectTheme(page, 'lighter');
        await page.keyboard.press('Escape');
        await expectTheme(page, 'lighter');
        return;
    }
    await expect(option(page, 'Light')).toBeFocused();
    await expectTheme(page, 'light');
    await expect(picker(page)).toHaveValue('dark');
    await page.keyboard.press('ArrowDown');
    await expect(option(page, 'Lighter')).toBeFocused();
    await expectTheme(page, 'lighter');
    await page.keyboard.press('Escape');
    await expectTheme(page, 'dark');
});

test('moving focus outside cancels a preview', async ({page}) => {
    await open(page);
    await openPicker(page);
    await option(page, 'Light').hover();
    await expectTheme(page, 'light');
    // Programmatic focus represents a consumer moving focus (e.g. opening a dialog).
    await page.getByRole('button', {name: 'After the picker'}).focus();
    await expectTheme(page, 'dark');
});

test('canceling restores an initially unthemed document', async ({page}) => {
    await open(page, {initialClasses: 'foo bar'});
    await openPicker(page);
    await option(page, 'Light').hover();
    await expectTheme(page, 'light');
    await page.keyboard.press('Escape');
    await expectTheme(page, null);
});

test('opening and canceling an unthemed picker does not commit its first option', async ({page}) => {
    await open(page, {initialClasses: 'foo bar'});
    await picker(page).focus();
    await page.keyboard.press('Space');
    await expect.poll(() => picker(page).evaluate(element => element.matches(':open'))).toBe(true);
    await page.keyboard.press('Escape');
    await expectTheme(page, null);
    await page.getByRole('button', {name: 'After the picker'}).click();
    await expectTheme(page, null);
});

for (const value of ['', 'false']) {
    test(`disable-preview=${JSON.stringify(value)} disables previews but permits native selection`, async ({page, browserName}) => {
        await open(page, {disablePreviewAttribute: value});
        await openPicker(page);
        await option(page, 'Light').hover();
        await expectTheme(page, 'dark');
        await page.keyboard.press('ArrowDown');
        const selected = browserName === 'firefox' ? 'light' : 'dark';
        await expect(picker(page)).toHaveValue(selected);
        await expectTheme(page, selected);
        await option(page, 'Light').click();
        await expectTheme(page, 'light');
    });
}

for (const via of ['attribute', 'property'] as const) {
    test(`toggling preview through the ${via} restores an active preview and enables it again`, async ({page}) => {
        await open(page);
        await openPicker(page);
        await option(page, 'Light').hover();
        await expectTheme(page, 'light');
        await setPreviewDisabled(page, true, via);
        await expectTheme(page, 'dark');
        await option(page, 'Lighter').hover();
        await expectTheme(page, 'dark');
        await setPreviewDisabled(page, false, via);
        await option(page, 'Light').hover();
        await expectTheme(page, 'light');
        await page.keyboard.press('Escape');
        await expectTheme(page, 'dark');
    });
}
