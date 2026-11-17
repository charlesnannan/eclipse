# Eclipse

Lit component to preview and apply color schemes

---

Eclipse displays a native `select` element. Selecting a theme applies its corresponding CSS class to the document's `<html>` element.

By default, hovering or focusing values also applies a temporary class name for quick previews.
Leaving the picker or pressing Escape restores the last selected theme. Selecting a value keeps it applied.

## Usage requirements

Use only one connected `<ce-eclipse>` instance per document, including instances inside shadow roots. Connecting another instance throws an error before it can control the document's theme. The browser reports this lifecycle error; the extra element is still inserted into the DOM.

Removing the active instance ends any preview and keeps the selected theme applied. You can then connect a replacement, or reconnect the original instance. A reconnected instance reads the document's current theme again.

Apply the initial theme class to the document's `<html>` element before Eclipse's first render, even when it represents your default theme. For example:

```html
<html lang="en" class="dark">
  <!-- Load Eclipse and place <ce-eclipse> in the body. -->
</html>
```

The initial class must match a theme's `className`. If JavaScript determines the initial theme, apply its class before loading or inserting Eclipse. Classes added asynchronously after initialization are not detected.

Only one configured theme class may be present on the document's `<html>` element. Eclipse reports a configuration error if it finds more than one during initialization or reconnection, leaving those classes unchanged. Unrelated classes are allowed.

Eclipse does not apply a default theme automatically. If no recognized theme class is present, the picker displays its first option, and the document's classes stay unchanged until the user previews or selects a theme.

## Label

Provide a nonempty label as the component's child content:

```html
<ce-eclipse>
  Theme
</ce-eclipse>
```

Eclipse associates this content with the picker, giving it an accessible name and allowing users to click the label to focus it. You choose the wording and language; Eclipse supplies no default label.

You can also provide markup and style it with your own CSS:

```html
<ce-eclipse>
  <span class="theme-label">Theme</span>
</ce-eclipse>
```

## Styling

Use your ordinary stylesheet, whether inline or loaded with `<link>`. Eclipse exposes [CSS parts](https://drafts.csswg.org/css-shadow-1/#part) so your rules can style its internal elements across the shadow DOM boundary:

| Part | Element |
| --- | --- |
| `label` | The label containing your child content |
| `select` | The theme picker |
| `option` | Every theme option |

Style the component itself to control its layout, and use `::part()` for its contents:

```css
ce-eclipse {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

ce-eclipse::part(label) {
  font-weight: bold;
}

ce-eclipse::part(select) {
  padding: 0.5rem;
  border-radius: 0.25rem;
}

ce-eclipse::part(option) {
  padding: 0.5rem;
}

ce-eclipse::part(option):hover,
ce-eclipse::part(option):focus {
  background: Highlight;
  color: HighlightText;
}
```

The customizable select's dropdown, arrow, and selection checkmark can also be styled:

```css
ce-eclipse::part(select)::picker(select) {
  border-radius: 0.25rem;
}

ce-eclipse::part(select)::picker-icon {
  color: currentColor;
}

ce-eclipse::part(option)::checkmark {
  color: currentColor;
}
```

The element name before `::part()` is optional. A bare `::part(select)` targets any component in your stylesheet's scope that exposes a `select` part. Use `ce-eclipse::part(select)` to restrict the rule to Eclipse, or a class such as `.theme-picker::part(select)` to target a component with that class.

## Installation

From a checkout of this repository, install the dependencies and build Eclipse:

```sh
npm ci
npm run build
```

The build produces `dist/eclipse.js`, an ES module that registers `<ce-eclipse>` when loaded. Eclipse's code is bundled with Rolldown; Lit remains a separate dependency so multiple components can share it.

### With a bundler

Install Lit in your application:

```sh
npm install lit@^3.3.3
```

Copy the built `eclipse.js` into your application and import it from your JavaScript entry point. For example, if you place it in a `components` directory beside that entry point:

```js
import './components/eclipse.js';
```

Your bundler resolves Eclipse's Lit imports from the installed package. You can then use `<ce-eclipse>` in your HTML.

### Without a bundler

Load `eclipse.js` with a module script. An import map must resolve its `lit` and `lit/decorators.js` imports, along with Lit's own dependencies.

For an HTML page at this repository's root, the following uses the packages installed by `npm ci`. Place the import map before the module script:

```html
<script type="importmap">
  {
    "imports": {
      "lit": "./node_modules/lit/index.js",
      "lit/decorators.js": "./node_modules/lit/decorators.js",
      "lit-element/": "./node_modules/lit-element/",
      "lit-html": "./node_modules/lit-html/lit-html.js",
      "lit-html/": "./node_modules/lit-html/",
      "@lit/reactive-element": "./node_modules/@lit/reactive-element/reactive-element.js",
      "@lit/reactive-element/": "./node_modules/@lit/reactive-element/"
    }
  }
</script>
<script type="module" src="./dist/eclipse.js"></script>
```

Serve the page over HTTP. For another project or deployment, adjust the URLs to wherever you serve these modules. Import maps resolve the module imports; you do not need a separate script to load Lit first.

The build currently produces JavaScript only; TypeScript declaration files are not yet generated.

## Demo

The [demo](https://charlesnannan.github.io/eclipse/) shows Eclipse switching between three color palettes. The [Pages workflow](.github/workflows/pages.yml) builds and publishes it from the [demo source](demo/index.html). For testing locally, see the [browser test guide](tests/README.md).

After building Eclipse, serve the repository with an HTTP server. For example, if Python is installed, run this from the repository's root:

```sh
python -m http.server 8000 --bind 127.0.0.1
```

Then open [the playground](http://127.0.0.1:8000/tests/page.html) in your browser.

## Attributes

### `themes`

* Type: `Array<{label: string, className: string}>`

The themes in display order. `label` is the text shown in the picker; `className` is the exact CSS class applied to the document's `<html>` element. You can translate labels or reorder themes while keeping the same class names.

Configure the list before Eclipse's first render. Changes to `themes` after initialization do not alter the picker, even if you remove and reconnect it. Create a new instance to use a different list.

Provide at least two themes. Each class name must be unique, nonempty, and contain no whitespace. Eclipse reports an error for an invalid theme list.

The default themes are:

```json
[
  {"label": "Darkest", "className": "darkest"},
  {"label": "Darker", "className": "darker"},
  {"label": "Dark", "className": "dark"},
  {"label": "Light", "className": "light"},
  {"label": "Lighter", "className": "lighter"},
  {"label": "Lightest", "className": "lightest"}
]
```

For custom themes, use a JSON array in the attribute:

```html
<ce-eclipse themes='[
  {"label": "Polar Night", "className": "polar-night"},
  {"label": "Dawn", "className": "dawn"}
]'></ce-eclipse>
```

### `disable-preview`

* Type: `boolean`
* Default: `false`

Prevents previews from changing the CSS class applied to the document's `<html>` element when themes are hovered or focused.

Theme previews rely on the [customizable select](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Customizable_select), which lets individual options receive hover and focus events.

You can toggle this preference at any time. Disabling preview immediately restores the selected theme if a preview is active; selecting a theme still works.

`disable-preview` is a Boolean presence attribute: its presence disables previews, regardless of its value. Even `disable-preview="false"` disables previews. Omit or remove the attribute to enable them, following [Lit's Boolean attribute conversion](https://lit.dev/docs/components/properties/#using-the-default-converter).

```html
<!-- Previews enabled -->
<ce-eclipse>Theme</ce-eclipse>

<!-- Previews disabled -->
<ce-eclipse disable-preview>Theme</ce-eclipse>
```

To toggle the attribute from JavaScript:

```js
const eclipse = document.querySelector('ce-eclipse');
eclipse.toggleAttribute('disable-preview', disablePreviews);
```

You can also set the `disablePreview` property to `true` or `false` from JavaScript.

## Testing

Install Playwright's browsers and run the suite:

```sh
npx playwright install chromium firefox webkit
npm test
```

`npm test` builds Eclipse and tests it in Chromium, Firefox, and WebKit. The local server starts and stops automatically. See [the testing guide](tests/README.md) for coverage, conventions, native browser differences, and debugging commands.

## FAQ

<details>
<summary>Why is the list unstyled? How can I style it?</summary>

Eclipse is unopinionated. It features a native [customizable select element](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Customizable_select) ([explainer](https://open-ui.org/components/customizable-select.explainer/)), which you can style according to your own conventions using the [exposed CSS parts](#styling).
</details>

<details>
<summary>Why Lit?</summary>

Eclipse is one of several web components being developed with Lit. Using the same library across them reduces repeated code for rendering templates, connecting attributes to properties, and updating the DOM when preferences change.

Lit builds on standard custom elements and shadow DOM, so the components can be used in ordinary HTML pages or alongside different application frameworks. Its declarative templates make the rendering and event handlers easier to read, and its update system changes the affected parts of the DOM while preserving the rest. All the components can share the same Lit dependency. See [What is Lit?](https://lit.dev/docs/).
</details>
