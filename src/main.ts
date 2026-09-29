import {css, html, LitElement} from 'lit';
import {customElement, property, query} from 'lit/decorators.js';
import {Naming} from "./types";

@customElement('ce-eclipse')
class Eclipse extends LitElement
{
    static styles = css`
        select,
        select::picker(select) {
             /* The customizable picker is required for individual options
                to trigger focus and pointer events. */
            appearance: base-select;
        }
    `;

    @property({type: Array})
    themes: string[] = [
        'Darkest',
        'Darker',
        'Dark',
        'Light',
        'Lighter',
        'Lightest',
    ];

    @property({type: Boolean, attribute: 'disable-preview'})
    disablePreview: boolean = false;

    @property({type: String})
    naming: Naming = Naming.Derived;

    @query('#theme-list', true)
    private themeList: HTMLSelectElement;

    /** The selected theme, which a preview must restore when it ends. */
    private committedCssClass: string = '';

    /** The theme class currently applied to the `<html>` element. */
    private appliedCssClass: string = '';

    /**
     * Preselect the theme based on the existing classes applied to the `<html>` element.
     */
    firstUpdated()
    {
        const cssClasses = document.documentElement.classList.values();
        const slugs = this.themes.map((theme: string) => this.slugify(theme));
        this.themeList.selectedIndex = 0;

        for (const cssClass of cssClasses) {
            // Look for a theme-derived class name.
            if (slugs.includes(cssClass)) {
                this.committedCssClass = cssClass;
                this.appliedCssClass = cssClass;
                this.themeList.selectedIndex = slugs.indexOf(cssClass);
                break;
            }
            // Look for a language-agnostic class name.
            const match = /^theme-([1-9]\d*)$/.exec(cssClass);
            if (match && Number(match[1]) <= this.themes.length) {
                const index = Number(match[1]);
                this.committedCssClass = cssClass;
                this.appliedCssClass = cssClass;
                this.themeList.selectedIndex = index - 1; // Zero-based index.
                break;
            }
        }
    }

    render()
    {
        return html`
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

                ${this.themes.map((theme) =>
                    html`<option
                        value=${this.slugify(theme)}
                        @mouseover="${this.disablePreview ? null : this.previewCssClass}"
                        @focus="${this.disablePreview ? null : this.previewCssClass}"
                    >
                        ${theme}
                    </option>`
                )}
            </select>
        `;
    }

    private classNameForOption(option: HTMLOptionElement): string
    {
        return this.naming === Naming.Derived
            ? option.value
            : `theme-${option.index + 1}`;
    }

    private applyCssClass(className: string): void
    {
        if (this.appliedCssClass === className) {
            return;
        }

        const classList = document.documentElement.classList;
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

        this.committedCssClass = this.classNameForOption(option);
        this.applyCssClass(this.committedCssClass);
    }

    private previewCssClass(event: Event): void
    {
        const option = event.currentTarget as HTMLOptionElement;
        this.applyCssClass(this.classNameForOption(option));
    }

    private restoreCssClass(): void
    {
        this.applyCssClass(this.committedCssClass);
    }

    disconnectedCallback(): void
    {
        super.disconnectedCallback();
        this.restoreCssClass();
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

    /**
     * Slugify a theme name so it can be applied to the document root as a CSS class.
     */
    private slugify(theme: string): string
    {
        return theme
            // Decompose the character code points.
            .normalize('NFD')
            // Remove the diacritics with Unicode property escapes.
            // Equivalent to the "Combining Diacritical Marks" block (/[\u0300-\u036f]/g).
            .replace(/\p{Diacritic}/gu, '')
            // Replace spaces and other non-alphanumeric characters with a hyphen.
            .replace(/\W+/g, '-')
            // Merge consecutive hyphens.
            .replace(/--+/g, '-')
            .toLowerCase();
    }
}

declare global
{
    interface HTMLElementTagNameMap {
        "ce-eclipse": Eclipse;
    }
}
