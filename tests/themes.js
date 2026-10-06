// Open page.html?themes=custom&test=themes to run these browser regression checks.
const results = document.createElement('pre');
document.body.append(results);

function assert(condition, message)
{
    if (!condition) {
        throw new Error(message);
    }
    results.textContent += `PASS: ${message}\n`;
}

async function expectInvalid(themes, message)
{
    const element = document.createElement('ce-eclipse');
    element.themes = themes;
    const initialClasses = document.documentElement.className;
    document.body.append(element);
    let error;
    try {
        await element.updateComplete;
    } catch (caught) {
        error = caught;
    } finally {
        element.remove();
    }
    assert(error instanceof TypeError && error.message === message,
        `Invalid configuration is rejected: ${message}`);
    assert(document.documentElement.className === initialClasses,
        'Invalid configuration leaves the document classes unchanged.');
}

try {
    await customElements.whenDefined('ce-eclipse');
    const original = document.querySelector('ce-eclipse');
    await original.updateComplete;
    const select = original.shadowRoot.querySelector('select');
    const root = document.documentElement;
    assert(select.options[0].textContent.trim() === '東京' && select.options[1].textContent.trim() === '大阪',
        'Non-Latin labels are displayed as provided.');
    assert(select.selectedIndex === 1 && select.value === 'osaka' && root.className === 'foo osaka bar',
        'The initial selection matches the explicit class name.');

    select.options[0].dispatchEvent(new FocusEvent('focus'));
    assert(root.className === 'foo bar tokyo', 'Preview applies the explicit class and preserves unrelated classes.');
    select.dispatchEvent(new MouseEvent('mouseleave'));
    assert(root.className === 'foo bar osaka', 'Leaving the picker restores the explicit committed class.');
    select.selectedIndex = 0;
    select.dispatchEvent(new Event('change'));
    select.options[1].dispatchEvent(new FocusEvent('focus'));
    select.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape'}));
    assert(root.className === 'foo bar tokyo', 'Selection and preview cancellation retain the committed identifier.');

    original.setAttribute('disable-preview', '');
    await original.updateComplete;
    select.options[1].dispatchEvent(new FocusEvent('focus'));
    assert(root.classList.contains('tokyo') && !root.classList.contains('osaka'),
        'Disabled preview does not apply another identifier.');
    select.selectedIndex = 1;
    select.dispatchEvent(new Event('change'));
    assert(root.classList.contains('osaka'), 'Selection still works with preview disabled.');
    original.remove();

    const translated = document.createElement('ce-eclipse');
    translated.themes = [
        {label: 'Osaka', className: 'osaka'},
        {label: 'Tokyo', className: 'tokyo'},
    ];
    document.body.append(translated);
    await translated.updateComplete;
    const translatedSelect = translated.shadowRoot.querySelector('select');
    assert(translatedSelect.selectedIndex === 0 && translatedSelect.value === 'osaka',
        'Translated and reordered labels retain the existing theme identifier.');
    translatedSelect.selectedIndex = 1;
    translatedSelect.dispatchEvent(new Event('change'));
    assert(root.className === 'foo bar tokyo', 'Reordering does not change the class applied by selection.');
    translated.remove();

    const unicode = document.createElement('ce-eclipse');
    unicode.themes = [{label: 'Night', className: '夜_色'}, {label: 'Night', className: 'day_theme'}];
    root.className = 'foo 夜_色 bar';
    document.body.append(unicode);
    await unicode.updateComplete;
    const unicodeSelect = unicode.shadowRoot.querySelector('select');
    assert(unicodeSelect.value === '夜_色', 'Explicit class names can contain Unicode and underscores.');
    unicodeSelect.selectedIndex = 1;
    unicodeSelect.dispatchEvent(new Event('change'));
    assert(root.className === 'foo bar day_theme', 'Duplicate labels are allowed when class names are distinct.');
    unicode.remove();

    await expectInvalid({}, 'The "themes" property must be an array of {label, className} objects.');
    const fieldsMessage = 'Each theme must have string "label" and "className" fields.';
    await expectInvalid(['Dark'], fieldsMessage);
    await expectInvalid([null], fieldsMessage);
    await expectInvalid([{label: 1, className: 'dark'}], fieldsMessage);
    await expectInvalid([{label: 'Dark'}], fieldsMessage);
    const tokenMessage = 'Each theme className must be nonempty and contain no HTML whitespace.';
    await expectInvalid([{label: 'Dark', className: ''}], tokenMessage);
    for (const whitespace of [' ', '\t', '\n', '\f', '\r']) {
        await expectInvalid([{label: 'Dark', className: `dark${whitespace}light`}], tokenMessage);
    }
    await expectInvalid([
        {label: 'Dark', className: 'dark'},
        {label: 'Night', className: 'dark'},
    ], 'Duplicate theme className: "dark".');

    results.textContent += '\nAll theme checks passed.\n';
} catch (error) {
    results.textContent += `FAIL: ${error.message}\n`;
    throw error;
}
