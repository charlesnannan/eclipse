# Eclipse

Lit component to preview and apply color schemes

---

The component displays a native `select` element. When selecting a value, it applies a corresponding class name on the root element.

By default, hovering or focusing values also applies a temporary class name for quick previews.
Leaving the picker or pressing Escape restores the last selected theme. Selecting a value keeps it applied.

# Installation

TODO

(The consumer needs an importmap if he does not use the pre-bundled version and does not use a bundler.)

TODO: need to publish .d.ts typings in the npm package. (How?)

## Demo



## Attributes

### `themes`

* Type: `string[]`
* Default: `["Darkest","Darker","Dark","Light","Lighter","Lightest"]`

The names displayed in the list.

Examples:
```html
<ce-eclipse themes='["Black","Dark","Light","White"]'></ce-eclipse>
<ce-eclipse themes='["Dawn","Dusk"]'></ce-eclipse>
```

### `disable-preview`

* Type: `boolean  `
* Default: `false`

Prevents the component from updating the CSS class applied on the root element when themes are hovered or focused.

### `naming`

* Type: `"derived" | "agnostic"`
* Default: `derived`

By default, the CSS class applied on the root element is the slugified version of the theme. For example, `Polar Night` gets the `polar-night` derivative.

If your application uses i18n for theme names, you may rather want a language-agnostic class name. With the attribute set to `agnostic`, the class is named `theme-[1,n]`, where `n` is the theme position in the list.

## FAQ

<details>
<summary>Why is the list unstyled? How can I style it?</summary>

Eclipse is unopinionated. It features a native [customizable select element](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Customizable_select) ([explainer](https://open-ui.org/components/customizable-select.explainer/)), which you can style according to your own conventions. For a CSS sample, see the demo.
</details>

<details>
<summary>Why Lit?</summary>


</details>
