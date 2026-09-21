import {LitElement, html, css} from 'lit';
import {customElement, property, query} from 'lit/decorators.js';

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
    naming: "theme-slug" | "agnostic" = "theme-slug";

    @query('#theme-list', true)
    private themeList: HTMLSelectElement;

    /**
     * The CSS class applied to the `<html>` element.
     * Only one class at a time can be applied by the component.
     */
    currentCssClass: string = '';

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

    private updateCssClass(event: MouseEvent): void
    {
        const option = event.currentTarget as HTMLOptionElement;

        const className = this.naming === 'theme-slug'
            ? option.value
            : `theme-${option.index + 1}`;

        const classList = document.documentElement.classList;

        classList.remove(this.currentCssClass);
        classList.add(className);

        this.currentCssClass = className;
    }

    // TODO: look how Bootstrap and Tailwind handle dark theme.
}

declare global
{
    interface HTMLElementTagNameMap {
        "ce-eclipse": Eclipse;
    }
}
