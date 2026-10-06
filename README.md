# Eclipse

Lit component to preview and apply color schemes

---

The component displays a native `select` element. When selecting a value, it applies a corresponding class name on the root element.

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

Eclipse does not apply a default theme automatically. If no recognized theme class is present, the picker displays its first option, and the document's classes stay unchanged until the user previews or selects a theme.

# Installation

TODO

(The consumer needs an importmap if he does not use the pre-bundled version and does not use a bundler.)

TODO: need to publish .d.ts typings in the npm package. (How?)

## Demo



## Attributes

### `themes`

* Type: `Array<{label: string, className: string}>`

The themes in display order. `label` is the text shown in the picker; `className` is the exact CSS class applied to `<html>`. You can translate labels or reorder themes while keeping the same class names.

Each class name must be unique, nonempty, and contain no whitespace. Eclipse reports an error for an invalid theme list.

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

* Type: `boolean  `
* Default: `false`

Prevents the component from updating the CSS class applied on the root element when themes are hovered or focused.

## FAQ

<details>
<summary>Why is the list unstyled? How can I style it?</summary>

Eclipse is unopinionated. It features a native [customizable select element](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Customizable_select) ([explainer](https://open-ui.org/components/customizable-select.explainer/)), which you can style according to your own conventions. For a CSS sample, see the demo.
</details>

<details>
<summary>Why Lit?</summary>


</details>
