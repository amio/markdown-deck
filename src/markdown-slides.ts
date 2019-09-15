import marked from 'marked'
import { LitElement, html, css, property, customElement } from 'lit-element'
import { unsafeHTML } from 'lit-html/directives/unsafe-html'

@customElement('markdown-slides')
export class MarkdownSlides extends LitElement {
  @property({ type: String }) markdown: string  // the markdown to parse
  @property({ type: Number }) index = 0         // current slide index
  @property({ type: Boolean }) hash: boolean    // sync with location hash
  @property({ type: Array }) _pages = []        // splited markdown

  static get styles () {
    return css`
      :host {
        display: block;
        min-height: 400px;
      }
      .deck {
        height: 100%;
        width: 100%;
      }
    `
  }

  _readMarkdownScript () {
    const scriptTag = this.querySelector('script[type="text/markdown"]')
    return scriptTag ? trimIndent(scriptTag.textContent) : ''
  }

  _updatePages () {
    const markdown = this.markdown || this._readMarkdownScript()
    this._pages = splitMarkdownToPages(markdown)
  }

  connectedCallback () {
    super.connectedCallback()
    this._bindShortcuts()
    this._updatePages()
  }

  disconnectedCallback () {
    super.disconnectedCallback()
    this._unbindShortcuts()
  }

  _bindShortcuts () {
    window.addEventListener('keydown', this._onKeydown)
  }

  _unbindShortcuts () {
    window.removeEventListener('keydown', this._onKeydown)
  }

  _onKeydown = (ev) => {
    switch (ev.code) {
      case 'ArrowRight':
      case 'Space':
        this._switchSlide('next')
        break
      case 'ArrowLeft':
        this._switchSlide('prev')
    }
  }

  _switchSlide = (to: 'next' | 'prev' | 'first' | 'last' | number) => {
    let targetIndex: number = this.index
    switch (to) {
      case 'next':
        targetIndex = this.index + 1
        break;
      case 'prev':
        targetIndex = this.index - 1
      default:
        if (typeof to === 'number') {
          targetIndex = to
        }
    }

    // prevent index overflow
    if (targetIndex < 0) {
      targetIndex = 0
    }

    if (targetIndex >= this._pages.length) {
      targetIndex = this._pages.length - 1
    }

    this.index = targetIndex
  }

  render() {
    // const index = this.index >= pages.length ? pages.length - 1 : this.index

    const markup = marked(this._pages[this.index])

    return html`
      <div class="deck">
        ${unsafeHTML(markup)}
      </div>
      <slot hidden @slotchange=${() => this.requestUpdate()}></slot>
    `;
  }
}

function trimIndent (text: string): string {
  const lines = text.split('\n').filter(line => line.length > 0)

  const indentCount = lines.reduce((accu: number, curr: string): number => {
    const leadingIndentCount = curr.search(/\S/)
    return leadingIndentCount > accu ? leadingIndentCount : accu
  }, 0)

  const indentChars = lines[0].substr(0, indentCount)
  return lines.map(line => line.replace(indentChars, '')).join('\n')
}

function splitMarkdownToPages (markdown: string): Array<string> {
  const pages = markdown
    .split(/\n-{3,}\n/) // page break
    .filter(page => Boolean(page.trim()))

  return pages
}
