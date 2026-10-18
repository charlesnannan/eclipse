import {test, expect, open, picker, option, openPicker, expectTheme} from './fixtures';

test('pointer selection commits the exact class and becomes the preview baseline', async ({page}) => {
    await open(page);
    await openPicker(page);
    await option(page, 'Light').click();
    await expect(picker(page)).toHaveValue('light');
    await expectTheme(page, 'light');
    await openPicker(page);
    await option(page, 'Darker').hover();
    await expectTheme(page, 'darker');
    await page.keyboard.press('Escape');
    await expectTheme(page, 'light');
});

test('keyboard selection commits the focused option', async ({page}) => {
    await open(page);
    await picker(page).focus();
    await page.keyboard.press('Space');
    await expect.poll(() => picker(page).evaluate(element => element.matches(':open'))).toBe(true);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(picker(page)).toHaveValue('light');
    await expectTheme(page, 'light');
});

test('a custom option applies its identifier regardless of label or position', async ({page}) => {
    await open(page, {
        initialClasses: 'foo osaka bar',
        themes: [{label: 'Osaka', className: 'osaka'}, {label: '東京', className: 'tokyo'}],
    });
    await openPicker(page);
    await option(page, '東京').click();
    await expect(picker(page)).toHaveValue('tokyo');
    await expectTheme(page, 'tokyo');
});

for (const disabled of [false, true]) {
    test(`selecting the displayed first option applies its theme (preview disabled: ${disabled})`, async ({page}) => {
        await open(page, {initialClasses: 'foo bar', ...(disabled ? {disablePreviewAttribute: ''} : {})});
        await openPicker(page);
        await option(page, 'Darkest').click();
        await expect(picker(page)).toHaveValue('darkest');
        await expectTheme(page, 'darkest');
        await page.getByRole('button', {name: 'After the picker'}).click();
        await expectTheme(page, 'darkest');
    });

    for (const key of ['Enter', 'Space']) {
        test(`${key} activates the displayed first option (preview disabled: ${disabled})`, async ({page}) => {
            await open(page, {initialClasses: 'foo bar', ...(disabled ? {disablePreviewAttribute: ''} : {})});
            await picker(page).focus();
            await page.keyboard.press('Space');
            await page.keyboard.press(key);
            await expectTheme(page, 'darkest');
            await page.getByRole('button', {name: 'After the picker'}).click();
            await expectTheme(page, 'darkest');
        });
    }
}
