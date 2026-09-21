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

    /**
     * The CSS class applied to the `<html>` element.
     * Only one class at a time can be applied by the component.
     */
    currentCssClass: string = '';

    // TODO: probably need another property. One for the temporary class, one for the permanent one.

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
                this.currentCssClass = cssClass;
                this.themeList.selectedIndex = slugs.indexOf(cssClass);
                break;
            }
            // Look for a language-agnostic class name.
            if (cssClass.startsWith('theme-')) {
                const index = Number(cssClass.split('-')[1]);

                if (isNaN(index) || index > this.themes.length) {
                    continue;
                }

                this.currentCssClass = cssClass;
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
                @change="${this.updateCssClass}"
                @mouseleave="${this.restoreCssClass}"
            >
                <button>
                    <selectedcontent></selectedcontent>
                </button>

                ${this.themes.map((theme) =>
                    html`<option
                        value=${this.slugify(theme)}
                        @mouseover="${this.disablePreview ? null : this.updateCssClass}"
                        @focus="${this.disablePreview ? null : this.updateCssClass}"
                    >
                        ${theme}
                    </option>`
                )}
            </select>
        `;
    }

    private updateCssClass(event: MouseEvent): void
    {
        const option = event.currentTarget as HTMLOptionElement;

        const className = this.naming === Naming.Derived
            ? option.value
            : `theme-${option.index + 1}`;

        const classList = document.documentElement.classList;

        classList.remove(this.currentCssClass);
        classList.add(className);

        this.currentCssClass = className;
    }

    /**
     * TODO: must restore the CSS class name added during the last "change" event.
     */
    private restoreCssClass(event: MouseEvent): void
    {
        console.log('plop');
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
