// Open page.html?test=ownership to run these browser regression checks.
const results = document.createElement('pre');
document.body.append(results);

function assert(condition, message)
{
    if (!condition) {
        throw new Error(message);
    }
    results.textContent += `PASS: ${message}\n`;
}

const duplicateMessage = 'Only one <ce-eclipse> instance can be connected per document.';
const conflictMessage = "Multiple configured theme classes are applied to the document's <html> element.";
let duplicateErrors = 0;
let conflictErrors = 0;
function captureExpectedError(event)
{
    if (event.error?.message === duplicateMessage) {
        duplicateErrors++;
        event.preventDefault();
    }
    if (event.error?.message === conflictMessage) {
        conflictErrors++;
        event.preventDefault();
    }
}
window.addEventListener('error', captureExpectedError);

try {
    await customElements.whenDefined('ce-eclipse');
    const original = document.querySelector('ce-eclipse');
    await original.updateComplete;
    const select = original.shadowRoot.querySelector('select');
    const root = document.documentElement;
    assert(select.selectedIndex === 5 && root.className === 'foo lightest bar',
        'The existing theme is selected without changing the root classes.');

    const duplicate = document.createElement('ce-eclipse');
    assert(duplicateErrors === 0, 'Detached instances can be constructed.');
    document.body.append(duplicate);
    assert(duplicateErrors === 1 && !duplicate.shadowRoot,
        'Connecting a second instance reports an error before rendering.');
    duplicate.remove();

    const host = document.createElement('div');
    document.body.append(host);
    host.attachShadow({mode: 'open'}).append(duplicate);
    assert(duplicateErrors === 2, 'The guard also detects instances inside shadow roots.');
    host.remove();

    select.options[2].dispatchEvent(new FocusEvent('focus'));
    assert(root.classList.contains('dark'), 'The active instance can preview a theme.');
    original.remove();
    assert(root.classList.contains('lightest') && !root.classList.contains('dark'),
        'Removing the active instance restores its committed theme.');

    document.body.append(duplicate);
    await duplicate.updateComplete;
    const replacementSelect = duplicate.shadowRoot.querySelector('select');
    assert(replacementSelect.selectedIndex === 5, 'A replacement can take ownership.');
    replacementSelect.selectedIndex = 2;
    replacementSelect.dispatchEvent(new Event('change'));
    assert(root.classList.contains('dark') && !root.classList.contains('lightest'),
        'The replacement can commit a theme.');

    document.body.append(original);
    assert(duplicateErrors === 3, 'Reconnecting an old instance is rejected while a replacement is active.');
    select.options[3].dispatchEvent(new FocusEvent('focus'));
    assert(root.classList.contains('dark') && !root.classList.contains('light'),
        'A rejected instance cannot change the theme through its old event handlers.');
    original.remove();
    replacementSelect.selectedIndex = 3;
    replacementSelect.dispatchEvent(new Event('change'));
    assert(root.classList.contains('light'), 'Removing a rejected instance preserves the active owner.');
    duplicate.remove();

    document.body.append(original);
    assert(select.selectedIndex === 3, 'Reconnecting synchronizes selection with the current theme.');

    const frame = document.createElement('iframe');
    frame.src = './page.html?themes=custom';
    const frameLoaded = new Promise(resolve => frame.addEventListener('load', resolve, {once: true}));
    document.body.append(frame);
    await frameLoaded;
    const frameDocument = frame.contentDocument;
    await frame.contentWindow.customElements.whenDefined('ce-eclipse');
    const separate = frameDocument.querySelector('ce-eclipse');
    await separate.updateComplete;
    const frameSelect = separate.shadowRoot.querySelector('select');
    frameSelect.selectedIndex = 0;
    frameSelect.dispatchEvent(new Event('change'));
    assert(frameDocument.documentElement.classList.contains('tokyo')
        && !frameDocument.documentElement.classList.contains('osaka') && root.classList.contains('light'),
        'Separate documents have independent ownership and theme classes.');
    frame.remove();

    original.remove();
    root.className = 'foo bar';
    document.body.append(original);
    assert(select.selectedIndex === 0 && root.className === 'foo bar',
        'No theme is applied automatically when an initial class is missing.');
    select.options[2].dispatchEvent(new FocusEvent('focus'));
    select.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape'}));
    assert(root.className === 'foo bar', 'Canceling a preview restores an initially unthemed document.');

    original.remove();
    root.className = 'foo dark light bar';
    const conflicting = document.createElement('ce-eclipse');
    document.body.append(conflicting);
    let configurationError;
    try {
        await conflicting.updateComplete;
    } catch (error) {
        configurationError = error;
    }
    assert(configurationError instanceof TypeError && configurationError.message === conflictMessage,
        'Multiple initial theme classes report a configuration error.');
    assert(!conflicting.shadowRoot.querySelector('select') && root.className === 'foo dark light bar',
        'Conflicting initial classes are preserved and no usable picker is rendered.');
    conflicting.remove();

    document.body.append(original);
    assert(conflictErrors === 1, 'Reconnection also rejects multiple theme classes.');
    select.options[0].dispatchEvent(new FocusEvent('focus'));
    assert(root.className === 'foo dark light bar',
        'A rejected reconnection cannot change the conflicting classes through its old picker.');
    original.remove();
    root.className = 'foo dark bar';
    document.body.append(original);
    assert(select.value === 'dark', 'Reconnection succeeds after the consumer resolves the conflicting classes.');

    results.textContent += '\nAll ownership checks passed.\n';
} catch (error) {
    results.textContent += `FAIL: ${error.message}\n`;
    throw error;
} finally {
    window.removeEventListener('error', captureExpectedError);
}
