import {test, expect, open, component, picker, option, openPicker, expectTheme,
    duplicateMessage, conflictMessage, type EclipseElement} from './fixtures';

test('removal during preview restores the committed theme and permits a replacement', async ({page}) => {
    await open(page);
    await openPicker(page);
    await option(page, 'Light').hover();
    await expectTheme(page, 'light');
    await component(page).evaluate(element => element.remove());
    await expectTheme(page, 'dark');
    await page.evaluate(async () => {
        const replacement = document.createElement('ce-eclipse') as EclipseElement;
        replacement.textContent = 'Replacement';
        document.body.append(replacement);
        await replacement.updateComplete;
    });
    await expect(picker(page)).toHaveValue('dark');
    await picker(page).selectOption('lighter');
    await expectTheme(page, 'lighter');
});

test('removal retains a selected theme', async ({page}) => {
    await open(page);
    await picker(page).selectOption('light');
    await component(page).evaluate(element => element.remove());
    await expectTheme(page, 'light');
});

test('reconnection synchronizes after a replacement changes the document theme', async ({page}) => {
    await open(page);
    const original = await component(page).elementHandle();
    await original!.evaluate(element => element.remove());
    await page.evaluate(async () => {
        const replacement = document.createElement('ce-eclipse') as EclipseElement;
        replacement.textContent = 'Replacement';
        document.body.append(replacement);
        await replacement.updateComplete;
    });
    await picker(page).selectOption('light');
    await component(page).evaluate(element => element.remove());
    await original!.evaluate(element => document.body.append(element));
    await expect(picker(page)).toHaveValue('light');
    await expectTheme(page, 'light');
});

test('detached construction is allowed but a second connection is rejected', async ({page, browserErrors}) => {
    await open(page);
    const extra = await page.evaluateHandle(() => document.createElement('ce-eclipse'));
    browserErrors.expect(duplicateMessage);
    await extra.evaluate(element => document.body.append(element));
    // Lifecycle exceptions do not undo DOM insertion; the duplicate must have no picker.
    await expect(component(page)).toHaveCount(2);
    expect(await extra.evaluate(element => element.shadowRoot?.querySelector('select') ?? null)).toBeNull();
    await expectTheme(page, 'dark');
});

test('a second instance in another shadow root is also rejected', async ({page, browserErrors}) => {
    await open(page);
    browserErrors.expect(duplicateMessage);
    await page.evaluate(() => {
        const host = document.createElement('div');
        host.id = 'wrapper';
        const shadow = host.attachShadow({mode: 'open'});
        document.body.append(host);
        shadow.append(document.createElement('ce-eclipse'));
    });
    await expect(page.locator('#wrapper').locator('ce-eclipse').locator('select')).toHaveCount(0);
    await expectTheme(page, 'dark');
});

test('a previously rendered instance rejected on reconnect cannot control a replacement', async ({page, browserErrors}) => {
    await open(page);
    const original = await component(page).elementHandle();
    await original!.evaluate(element => element.remove());
    await page.evaluate(async () => {
        const replacement = document.createElement('ce-eclipse') as EclipseElement;
        replacement.textContent = 'Replacement';
        replacement.id = 'replacement';
        document.body.append(replacement);
        await replacement.updateComplete;
    });
    browserErrors.expect(duplicateMessage);
    await original!.evaluate(element => document.body.append(element));
    const rejected = page.locator('ce-eclipse:not(#replacement)').locator('[part~="select"]');
    await rejected.selectOption('light');
    await expectTheme(page, 'dark');
    await original!.evaluate(element => element.remove());
    await page.locator('#replacement').locator('select').selectOption('lighter');
    await expectTheme(page, 'lighter');
});

test('a rejected conflicting reconnect preserves classes and can recover', async ({page, browserErrors}) => {
    await open(page);
    const original = await component(page).elementHandle();
    await original!.evaluate(element => element.remove());
    await page.locator('html').evaluate(element => element.classList.add('light'));
    browserErrors.expect(conflictMessage);
    await original!.evaluate(element => document.body.append(element));
    await picker(page).selectOption('darkest');
    await expect(page.locator('html')).toContainClass('foo bar dark light');
    await original!.evaluate(element => element.remove());
    await page.locator('html').evaluate(element => element.classList.remove('dark'));
    await original!.evaluate(element => document.body.append(element));
    await expect(picker(page)).toHaveValue('light');
    await picker(page).selectOption('lighter');
    await expectTheme(page, 'lighter');
});

test('reconnecting to an unthemed document keeps it unthemed', async ({page}) => {
    await open(page);
    await component(page).evaluate(element => {
        element.remove();
        document.documentElement.classList.remove('dark');
        document.body.append(element);
    });
    await expect(picker(page)).toHaveValue('darkest');
    await expectTheme(page, null);
});

test('separate iframe documents have independent controllers', async ({page}) => {
    await open(page);
    await page.evaluate(() => {
        const frame = document.createElement('iframe');
        frame.src = '/tests/page.html?themes=custom';
        frame.title = 'Independent theme picker';
        document.body.append(frame);
    });
    const frameElement = await page.locator('iframe').elementHandle();
    const frame = await frameElement!.contentFrame();
    await expect.poll(() => frame!.evaluate(() => window.eclipseReady)).toEqual({error: null});
    await expectTheme(frame!, 'osaka');
    await picker(frame!).selectOption('tokyo');
    await expectTheme(frame!, 'tokyo');
    await expectTheme(page, 'dark');
    await picker(page).selectOption('light');
    await expectTheme(page, 'light');
    await expectTheme(frame!, 'tokyo');
});
