# Eclipse

Lit component to preview and apply color schemes

---

The component is simply a list a value. When the user focuses, hovers, or selects a value, a class is added to the `html` element.

The list of values can be overriden by the user. By default, they are: white, lighter, light, dark, darker, black.

Needs to set CSS variable in JS => Lit.

Probably needs the "external" config property of Rolldown to exclude Lit from the output.

Probably needs custom select element to preview the theme on option hover (i.e. before an option is selected).

The consumer needs an importmap if he does not use a bundler.

Note: need to publish your .d.ts typings in your npm package.

## Demo



## Attributes

### `themes`

* Type: `string[]`
* Default: `["Darkest","Darker","Dark","Light","Lighter","Lightest"]`

Theme names as displayed in the list.

Examples:
```html
<eclipse themes='["Black","Dark","Light","White"]'></eclipse>
<eclipse themes='["Dawn","Dusk"]'></eclipse>
```

### `disable-preview`

* Type: `boolean  `
* Default: `true`

Prevents the component from updating the CSS class applied on the `html` element when themes are hovered or focused.

### `naming`

* Type: `"theme-slug" | "agnostic"`
* Default: `theme-slug`

Allows you to set a language-agnostic CSS class name if your application uses i18n for theme names. If set to `agnostic`, the class will be names `theme-<i>`, where `i` is the index of the theme in the array.

## FAQ

<details>
<summary>Why is the list unstyled? How can I style it?</summary>

Eclipse is unopinionated. It features a standard [customizable select element](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Customizable_select) ([explainer](https://open-ui.org/components/customizable-select.explainer/)), which you can style based on your own conventions. For a CSS sample, see the demo.
</details>

<details>
<summary>Why Lit?</summary>


</details>

## Trivia