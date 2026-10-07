import {css, html, LitElement} from 'lit';
import {customElement, property, query} from 'lit/decorators.js';
import type {PropertyValues} from 'lit';
import type {Theme} from './types';

@customElement('ce-eclipse')
class Eclipse extends LitElement
{
    /** Each document can have one connected instance controlling its theme. */
    private static instances = new WeakMap<Document, Eclipse>();

    static styles = css`
        select,
        select::picker(select) {
             /* The customizable picker is required for individual options
                to trigger focus and pointer events. */
            appearance: base-select;
        }
    `;

    /**
     * An ordered array makes display order explicit. Separate labels and class
     * names allow translation and reordering without changing CSS identifiers,
     * and avoid the collisions caused by slugifying non-Latin labels.
     * We render options ourselves because slotted options would remain outside
     * the internal select's DOM tree and would not become native select options.
     * The list is setup-time configuration: noAccessor keeps attribute parsing
     * without scheduling updates when the public property is assigned.
     */
    @property({type: Array, noAccessor: true})
    themes: Theme[] = [
        {label: 'Darkest', className: 'darkest'},
        {label: 'Darker', className: 'darker'},
        {label: 'Dark', className: 'dark'},
        {label: 'Light', className: 'light'},
        {label: 'Lighter', className: 'lighter'},
        {label: 'Lightest', className: 'lightest'},
    ];

    @property({type: Boolean, attribute: 'disable-preview'})
    disablePreview: boolean = false;

    @query('#theme-list', true)
    private themeList: HTMLSelectElement;

    /** The selected theme, which a preview must restore when it ends. */
    private committedCssClass: string = '';

    /** The theme class currently applied to the document's `<html>` element. */
    private appliedCssClass: string = '';

    private activeDocument?: Document;

    /** Captured once so caller mutations cannot affect later preview updates. */
    private configuredThemes: readonly Theme[] = [];

    connectedCallback(): void
    {
        const document = this.ownerDocument;
        const instance = Eclipse.instances.get(document);
        if (instance && instance !== this) {
            throw new Error('Only one <ce-eclipse> instance can be connected per document.');
        }

        // Another instance may have changed the theme while this one was removed.
        // Validate before taking ownership so an invalid reconnection cannot
        // change the document through the instance's previously rendered picker.
        if (this.hasUpdated) {
            this.synchronizeSelection();
        }

        Eclipse.instances.set(document, this);
        this.activeDocument = document;
        super.connectedCallback();
    }

    /**
     * The consumer must apply the initial theme class before the first render.
     */
    firstUpdated()
    {
        if (this.activeDocument) {
            this.synchronizeSelection();
        }
    }

    protected willUpdate(): void
    {
        if (!this.hasUpdated) {
            this.validateThemes();
            this.configuredThemes = this.themes.map(({label, className}) => ({label, className}));
            // Reject conflicting initial classes before rendering a usable picker.
            this.getInitialCssClass();
        }
    }

    protected updated(changedProperties: PropertyValues): void
    {
        if (changedProperties.has('disablePreview') && this.disablePreview) {
            this.restoreCssClass();
        }
    }

    private validateThemes(): void
    {
        if (!Array.isArray(this.themes)) {
            throw new TypeError('The "themes" property must be an array of {label, className} objects.');
        }

        const classNames = new Set<string>();
        for (const theme of this.themes) {
            if (!theme || typeof theme.label !== 'string' || typeof theme.className !== 'string') {
                throw new TypeError('Each theme must have string "label" and "className" fields.');
            }
            // DOMTokenList uses HTML whitespace to separate class tokens.
            if (!theme.className || /[\t\n\f\r ]/.test(theme.className)) {
                throw new TypeError('Each theme className must be nonempty and contain no HTML whitespace.');
            }
            if (classNames.has(theme.className)) {
                throw new TypeError(`Duplicate theme className: "${theme.className}".`);
            }
            classNames.add(theme.className);
        }

        if (this.themes.length < 2) {
            throw new TypeError('The "themes" property must contain at least two themes.');
        }
    }

    private getInitialCssClass(): string
    {
        const classList = this.ownerDocument.documentElement.classList;
        const matchingClasses = this.configuredThemes
            .map(theme => theme.className)
            .filter(className => classList.contains(className));

        // Picking one would leave other theme classes active and make the result
        // depend on CSS cascade order. The consumer must resolve this ambiguity.
        if (matchingClasses.length > 1) {
            throw new TypeError("Multiple configured theme classes are applied to the document's <html> element.");
        }

        return matchingClasses[0] ?? '';
    }

    private synchronizeSelection(): void
    {
        const className = this.getInitialCssClass();
        this.committedCssClass = className;
        this.appliedCssClass = className;
        const index = this.configuredThemes.findIndex(theme => theme.className === className);
        this.themeList.selectedIndex = index < 0 ? 0 : index;
    }

    render()
    {
        // The label and select share a shadow tree so `for` can associate them.
        // A default slot lets the consumer supply the label's text and markup;
        // its rendered content also supplies the select's accessible name.
        return html`
            <label for="theme-list"><slot></slot></label>
            <select
                id="theme-list"
                @change="${this.commitSelection}"
                @mouseleave="${this.restoreCssClass}"
                @focusout="${this.restoreOnFocusOut}"
                @keydown="${this.restoreOnEscape}"
            >
                <button>
                    <selectedcontent></selectedcontent>
                </button>

                ${this.configuredThemes.map((theme) =>
                    html`<option
                        value=${theme.className}
                        @mouseover="${this.disablePreview ? null : this.previewCssClass}"
                        @focus="${this.disablePreview ? null : this.previewCssClass}"
                    >
                        ${theme.label}
                    </option>`
                )}
            </select>
        `;
    }

    private applyCssClass(className: string): void
    {
        // A previously rendered instance may be rejected when it reconnects.
        if (!this.activeDocument || Eclipse.instances.get(this.activeDocument) !== this
            || this.appliedCssClass === className) {
            return;
        }

        const classList = this.activeDocument.documentElement.classList;
        if (this.appliedCssClass) {
            classList.remove(this.appliedCssClass);
        }
        if (className) {
            classList.add(className);
        }
        this.appliedCssClass = className;
    }

    private commitSelection(event: Event): void
    {
        // `change` is handled by the select, not by an option.
        const select = event.currentTarget as HTMLSelectElement;
        const option = select.selectedOptions[0];
        if (!option) {
            return;
        }

        this.committedCssClass = option.value;
        this.applyCssClass(this.committedCssClass);
    }

    private previewCssClass(event: Event): void
    {
        const option = event.currentTarget as HTMLOptionElement;
        this.applyCssClass(option.value);
    }

    private restoreCssClass(): void
    {
        this.applyCssClass(this.committedCssClass);
    }

    disconnectedCallback(): void
    {
        if (this.activeDocument) {
            this.restoreCssClass();
            Eclipse.instances.delete(this.activeDocument);
            this.activeDocument = undefined;
        }
        super.disconnectedCallback();
    }

    private restoreOnFocusOut(event: FocusEvent): void
    {
        // Moving between options is still part of the same preview session.
        if (event.relatedTarget instanceof HTMLOptionElement && this.themeList.contains(event.relatedTarget)) {
            return;
        }
        this.restoreCssClass();
    }

    private restoreOnEscape(event: KeyboardEvent): void
    {
        if (event.key === 'Escape') {
            this.restoreCssClass();
        }
    }
}

declare global
{
    interface HTMLElementTagNameMap {
        "ce-eclipse": Eclipse;
    }
}
