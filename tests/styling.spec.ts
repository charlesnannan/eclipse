import {test, expect, open, component, picker, option, openPicker, expectTheme} from './fixtures';

test('external styles reach the label, select, and every option through parts', async ({page}) => {
    await open(page);
    await page.addStyleTag({content: `
        ce-eclipse { display: inline-flex; gap: 12px; }
        ce-eclipse::part(label) { color: rgb(1, 2, 3); }
        ce-eclipse::part(select) { border: 3px solid rgb(4, 5, 6); }
        ce-eclipse::part(option) { padding: 9px; }
    `});
    await expect(component(page)).toHaveCSS('gap', '12px');
    await expect(component(page).locator('[part~="label"]')).toHaveCSS('color', 'rgb(1, 2, 3)');
    await expect(picker(page)).toHaveCSS('border-top-color', 'rgb(4, 5, 6)');
    await expect(picker(page)).toHaveCSS('border-top-width', '3px');
    const options = picker(page).locator('option');
    await expect(options).toHaveCount(6);
    for (const entry of await options.all()) await expect(entry).toHaveCSS('padding-top', '9px');
});

test('bare part selectors work and class qualifiers restrict their scope', async ({page}) => {
    await open(page);
    await page.addStyleTag({content: `
        ::part(label) { color: rgb(1, 2, 3); }
        .theme-picker::part(select) { border-top: 3px solid rgb(4, 5, 6); }
    `});
    await expect(component(page).locator('[part~="label"]')).toHaveCSS('color', 'rgb(1, 2, 3)');
    await expect(picker(page)).not.toHaveCSS('border-top-color', 'rgb(4, 5, 6)');
    await component(page).evaluate(element => element.classList.add('theme-picker'));
    await expect(picker(page)).toHaveCSS('border-top-color', 'rgb(4, 5, 6)');
});

test('ordinary descendant selectors cannot style shadow contents', async ({page}) => {
    await open(page);
    await page.addStyleTag({content: 'ce-eclipse select { border-top: 3px solid rgb(1, 2, 3); }'});
    await expect(picker(page)).not.toHaveCSS('border-top-color', 'rgb(1, 2, 3)');
});

test('external hover and focus styles preserve native picker interactions', async ({page, browserName}) => {
    await open(page);
    await page.addStyleTag({content: `
        ce-eclipse::part(option):hover { background-color: rgb(1, 2, 3); }
        ce-eclipse::part(option):focus { color: rgb(4, 5, 6); }
        ce-eclipse::part(select):focus { color: rgb(4, 5, 6); }
    `});
    await openPicker(page);
    await option(page, 'Light').hover();
    await expect(option(page, 'Light')).toHaveCSS('background-color', 'rgb(1, 2, 3)');
    await expectTheme(page, 'light');
    await page.keyboard.press('Escape');
    await expectTheme(page, 'dark');
    await openPicker(page);
    await page.keyboard.press('ArrowDown');
    if (browserName === 'firefox') {
        await expect(picker(page)).toBeFocused();
        await expect(picker(page)).toHaveCSS('color', 'rgb(4, 5, 6)');
        await expect(picker(page)).toHaveValue('light');
    } else {
        await expect(option(page, 'Light')).toBeFocused();
        await expect(option(page, 'Light')).toHaveCSS('color', 'rgb(4, 5, 6)');
    }
    await expectTheme(page, 'light');
    await page.keyboard.press('Enter');
    await expectTheme(page, 'light');
});

test('parts expose the native dropdown, arrow, and selection checkmark', async ({page}) => {
    await open(page);
    await page.addStyleTag({content: `
        ce-eclipse::part(select)::picker(select) { background-color: rgb(1, 2, 3); }
        ce-eclipse::part(select)::picker-icon { color: rgb(4, 5, 6); }
        ce-eclipse::part(option)::checkmark { color: rgb(7, 8, 9); }
    `});
    await openPicker(page);
    await expect.poll(() => picker(page).evaluate(element =>
        getComputedStyle(element, '::picker(select)').backgroundColor)).toBe('rgb(1, 2, 3)');
    await expect.poll(() => picker(page).evaluate(element =>
        getComputedStyle(element, '::picker-icon').color)).toBe('rgb(4, 5, 6)');
    await expect.poll(() => option(page, 'Dark').evaluate(element =>
        getComputedStyle(element, '::checkmark').color)).toBe('rgb(7, 8, 9)');
});
