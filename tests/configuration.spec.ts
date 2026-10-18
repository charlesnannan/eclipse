import {test, expect, open, load, component, picker, expectTheme, conflictMessage, type EclipseElement} from './fixtures';

test('default options match the initial document theme', async ({page}) => {
    await open(page, {initialClasses: 'foo lightest bar'});
    await expect(picker(page).locator('option')).toHaveText(['Darkest', 'Darker', 'Dark', 'Light', 'Lighter', 'Lightest']);
    await expect(picker(page)).toHaveValue('lightest');
    await expectTheme(page, 'lightest');
});

test('missing initial theme displays the first option without applying it', async ({page}) => {
    await open(page, {initialClasses: 'foo bar'});
    await expect(picker(page)).toHaveValue('darkest');
    await expectTheme(page, null);
});

test('JSON configuration preserves translated labels and explicit class names', async ({page}) => {
    await open(page, {
        initialClasses: 'foo osaka bar',
        themesAttribute: JSON.stringify([{label: '東京', className: 'tokyo'}, {label: '大阪', className: 'osaka'}]),
    });
    await expect(picker(page).locator('option')).toHaveText(['東京', '大阪']);
    await expect(picker(page)).toHaveValue('osaka');
    await expectTheme(page, 'osaka');
});

test('property configuration allows Unicode identifiers and repeated labels', async ({page}) => {
    await open(page, {
        initialClasses: 'foo 夜_色 bar',
        themes: [{label: 'Night', className: 'day_theme'}, {label: 'Night', className: '夜_色'}],
    });
    await expect(picker(page).locator('option')).toHaveText(['Night', 'Night']);
    await expect(picker(page)).toHaveValue('夜_色');
    await picker(page).selectOption('day_theme');
    await expectTheme(page, 'day_theme');
});

test('theme configuration stays fixed through preference updates and reconnection', async ({page}) => {
    await open(page);
    await component(page).evaluate(async (element: EclipseElement) => {
        element.themes[0].label = 'Changed';
        element.themes[0].className = 'changed';
        element.themes.push({label: 'Extra', className: 'extra'});
        element.themes = [{label: 'Replacement', className: 'replacement'}];
        element.setAttribute('themes', '[{"label":"Attribute replacement","className":"attribute"}]');
        element.disablePreview = true;
        await element.updateComplete;
        element.remove();
        document.body.append(element);
    });
    await expect(picker(page).locator('option')).toHaveText(['Darkest', 'Darker', 'Dark', 'Light', 'Lighter', 'Lightest']);
    await expect(picker(page)).toHaveValue('dark');
    await expectTheme(page, 'dark');
});

const fieldsMessage = 'Each theme must have string "label" and "className" fields.';
const tokenMessage = 'Each theme className must be nonempty and contain no HTML whitespace.';
const invalidLists: {name: string; themes: unknown; message: string}[] = [
    {name: 'a non-array', themes: {}, message: 'The "themes" property must be an array of {label, className} objects.'},
    {name: 'no themes', themes: [], message: 'The "themes" property must contain at least two themes.'},
    {name: 'one theme', themes: [{label: 'Dark', className: 'dark'}], message: 'The "themes" property must contain at least two themes.'},
    {name: 'legacy string entries', themes: ['Dark', 'Light'], message: fieldsMessage},
    {name: 'a null entry', themes: [null], message: fieldsMessage},
    {name: 'a non-string label', themes: [{label: 1, className: 'dark'}], message: fieldsMessage},
    {name: 'a missing class name', themes: [{label: 'Dark'}], message: fieldsMessage},
    {name: 'an empty class name', themes: [{label: 'Dark', className: ''}], message: tokenMessage},
    ...[' ', '\t', '\n', '\f', '\r'].map(whitespace => ({
        name: `HTML whitespace ${JSON.stringify(whitespace)}`,
        themes: [{label: 'Dark', className: `dark${whitespace}light`}], message: tokenMessage,
    })),
    {name: 'duplicate class names', themes: [{label: 'Dark', className: 'dark'}, {label: 'Night', className: 'dark'}], message: 'Duplicate theme className: "dark".'},
];

for (const {name, themes, message} of invalidLists) {
    test(`rejects ${name} without changing document classes`, async ({page}) => {
        expect(await load(page, {themes})).toEqual({name: 'TypeError', message});
        await expect(picker(page)).toHaveCount(0);
        await expectTheme(page, 'dark');
    });
}

test('rejects conflicting initial theme classes before rendering the picker', async ({page}) => {
    expect(await load(page, {initialClasses: 'foo dark light bar'})).toEqual({name: 'TypeError', message: conflictMessage});
    await expect(picker(page)).toHaveCount(0);
    await expect(page.locator('html')).toContainClass('foo dark light bar');
});

for (const value of ['not JSON', '{}']) {
    test(`rejects an invalid themes attribute (${value})`, async ({page}) => {
        expect(await load(page, {themesAttribute: value})).toEqual({
            name: 'TypeError', message: 'The "themes" property must be an array of {label, className} objects.',
        });
        await expect(picker(page)).toHaveCount(0);
        await expectTheme(page, 'dark');
    });
}
