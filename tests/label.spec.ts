import {test, expect, open, component, picker} from './fixtures';

test('plain default-slot content supplies the accessible name and activates the picker', async ({page}) => {
    await open(page, {label: 'Theme'});
    await expect(picker(page)).toHaveAccessibleName('Theme');
    await expect(page.getByRole('combobox', {name: 'Theme', exact: true})).toHaveCount(1);
    await component(page).locator('[part~="label"]').click();
    await expect(picker(page)).toBeFocused();
});

test('slotted markup supplies a translated accessible name and remains consumer styled', async ({page}) => {
    await open(page, {labelMarkup: '<span class="theme-label">Thème</span>'});
    await page.addStyleTag({content: '.theme-label { color: rgb(1, 2, 3); }'});
    await expect(picker(page)).toHaveAccessibleName('Thème');
    await expect(component(page).locator('.theme-label')).toHaveCSS('color', 'rgb(1, 2, 3)');
    await component(page).getByText('Thème', {exact: true}).click();
    await expect(picker(page)).toBeFocused();
});

test('the native picker is reachable in the page Tab order', async ({page}) => {
    await open(page);
    await page.getByRole('button', {name: 'Before the picker'}).focus();
    await page.keyboard.press('Tab');
    await expect(picker(page)).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', {name: 'After the picker'})).toBeFocused();
});
