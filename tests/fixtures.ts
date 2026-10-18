import {test as base, expect, type Page, type Frame} from '@playwright/test';
import type {Theme} from '../src/types';

export type EclipseElement = HTMLElement & {
    themes: Theme[];
    disablePreview: boolean;
    updateComplete: Promise<boolean>;
};

export type Setup = {
    initialClasses?: string;
    themes?: unknown;
    themesAttribute?: string;
    disablePreviewAttribute?: string;
    label?: string;
    labelMarkup?: string;
};

declare global {
    interface Window {
        eclipseTestSetup?: Setup;
        eclipseReady?: {error: null | {name: string; message: string}};
    }
}

// Expected lifecycle errors must be declared individually, including repeats.
// This catches unrelated failures without swallowing configuration errors.
export const test = base.extend<{browserErrors: {expect: (message: string) => void}}>({
    browserErrors: [async ({page}, use) => {
        const actual: string[] = [];
        const expected: string[] = [];
        page.on('pageerror', error => actual.push(error.message));
        await use({expect: message => expected.push(message)});
        expect(actual, 'Unexpected or missing browser errors').toEqual(expected);
    }, {auto: true}],
});
export {expect};

export async function load(page: Page, setup: Setup = {})
{
    await page.addInitScript(configuration => {
        // Child documents configure their own picker through the playground URL.
        if (window === window.top) window.eclipseTestSetup = configuration;
    }, {initialClasses: 'foo dark bar', ...setup});
    await page.goto('/tests/page.html');
    await expect.poll(() => page.evaluate(() => window.eclipseReady)).toBeTruthy();
    return page.evaluate(() => window.eclipseReady!.error);
}

export async function open(page: Page, setup: Setup = {})
{
    expect(await load(page, setup)).toBeNull();
}

export const component = (page: Page | Frame) => page.locator('ce-eclipse');
export const picker = (page: Page | Frame) => component(page).locator('[part~="select"]');
export const option = (page: Page | Frame, label: string) => picker(page).getByRole('option', {name: label, exact: true});

export async function expectTheme(page: Page | Frame, theme: string | null)
{
    // Class membership matters; DOMTokenList insertion order does not.
    await expect.poll(() => page.locator('html').evaluate(element =>
        Array.from(element.classList).filter(name => name !== 'foo' && name !== 'bar').sort(),
    )).toEqual(theme === null ? [] : [theme]);
    await expect(page.locator('html')).toContainClass('foo bar');
}

export async function openPicker(page: Page)
{
    // Fail visibly if a browser upgrade loses the feature; don't silently skip
    // the interactions this component relies on.
    expect(await page.evaluate(() => CSS.supports('appearance', 'base-select')),
        'This browser must support customizable selects').toBe(true);
    await picker(page).click();
    await expect.poll(() => picker(page).evaluate(element => element.matches(':open'))).toBe(true);
}

export async function setPreviewDisabled(page: Page, disabled: boolean, via: 'property' | 'attribute')
{
    await component(page).evaluate(async (element: EclipseElement, preference) => {
        if (preference.via === 'property') element.disablePreview = preference.disabled;
        else element.toggleAttribute('disable-preview', preference.disabled);
        await element.updateComplete;
    }, {disabled, via});
}

export const duplicateMessage = 'Only one <ce-eclipse> instance can be connected per document.';
export const conflictMessage = "Multiple configured theme classes are applied to the document's <html> element.";
