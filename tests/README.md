# Browser tests

The suite uses Playwright Test against the built `dist/eclipse.js` and locally installed Lit modules. `page.html` is both the manual playground and the browser fixture. A small Node server starts and stops automatically with the runner; it needs no additional server package.

## Running

From the repository root:

```sh
npm clean-install
npx playwright install chromium firefox webkit
npm test
```

`npm test` builds Eclipse before running every test in Chromium, Firefox, and WebKit. To run one engine or file:

```sh
npm test -- --project=firefox
npm test -- tests/styling.spec.ts
```

Use `npm run test:ui` for interactive debugging. Failures retain screenshots, error context, and traces in `test-results`. Open a failure's `trace.zip` with `npx playwright show-trace path/to/trace.zip`. Generated results and browser dependencies are not committed. Port 8765 must be available.

The terminal uses the compact `dot` reporter by default. Override it with `npm test -- --reporter=html` to generate an HTML report. The three-worker limit caps concurrent browser processes across all projects; it does not allocate one worker per engine. Override it with `npm test -- --workers=1`, for example, to run tests sequentially.

## Organization

| File | Coverage |
| --- | --- |
| `configuration.spec.ts` | Initial classes, descriptors, JSON attributes, invalid setup, immutable themes |
| `selection.spec.ts` | Pointer and keyboard commits, custom identifiers, unchanged first-option activation |
| `preview.spec.ts` | Hover and focus previews, cancellation, reactive preferences, Boolean presence |
| `label.spec.ts` | Accessible names, slotted markup, label activation, Tab order |
| `lifecycle.spec.ts` | Removal, replacements, reconnection, duplicate rejection, independent documents |
| `styling.spec.ts` | External parts, selector scope, native pseudo-elements, interaction after styling |

`fixtures.ts` contains shared setup, locators, assertions, and browser error reporting. Keep reusable helpers small; introduce new ones when they clarify several tests.

## Conventions

- Describe observable behavior in test names and group tests by that behavior.
- Give every test its own page and browser context. Configure initial state before the component upgrades; await its public `updateComplete` promise when changing reactive properties.
- Use real pointer and keyboard input for interaction tests. Use `evaluate` for consumer API calls, DOM insertion/removal, and observations. Do not dispatch synthetic events to stand in for user interaction.
- Prefer role/name locators for user controls. Use exposed part names to locate Eclipse's styling surfaces; avoid private fields and implementation-specific IDs.
- Assert selected values, accessible names, focus, computed styles, and document class membership. Do not depend on class order or platform-specific screenshots.
- Use Playwright's retrying assertions and observable readiness. No fixed sleeps or automatic test retries; failures should remain visible.
- Unexpected JavaScript errors fail the test. Declare each expected lifecycle error by its exact message before triggering it; setup validation errors are caught through `updateComplete` and asserted explicitly.
- Test native browser differences explicitly rather than skipping a failing engine or simulating the missing behavior.

## Native keyboard behavior

The Firefox project enables `dom.select.customizable_select.enabled` and `layout.css.appearance-base.enabled` through Playwright's [Firefox preferences](https://playwright.dev/docs/api/class-browsertype#browser-type-launch-option-firefox-user-prefs). Tests require `appearance: base-select` support when opening the picker.

In the currently tested Firefox build, arrow keys keep focus on the select and immediately change its selected value. Eclipse commits those native changes; Escape retains the latest selection. Chromium and WebKit instead focus individual options while leaving selection unchanged, so Eclipse previews them until activation or cancellation. Hover previews work in all three engines.

The relevant tests assert both behaviors. Revisit these explicit expectations when upgrading Playwright's browsers; preserve the native interaction model as browser implementations evolve.
