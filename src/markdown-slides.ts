import marked from 'marked'
import { LitElement, html, css, property, customElement, unsafeCSS } from 'lit-element'
import { unsafeHTML } from 'lit-html/directives/unsafe-html'

@customElement('markdown-slides')
export class MarkdownSlides extends LitElement {
  @property({ type: String }) markdown: string  // the markdown to parse
  @property({ type: Number }) index = 0         // current slide index
  @property({ type: Boolean }) dark: boolean    // invert slides color
  @property({ type: Boolean }) hash: boolean    // sync with location hash
  @property({ type: Array }) _pages = []        // splited markdown

  static get styles () {
    return css`
      :host {
        display: block;
        min-height: 400px;
        display: grid;
        grid-template-rows: 10% auto 20%;
        grid-template-columns: 10% auto 10%;
        --font-family: "Source Sans Pro", sans-serif;
        background-color: white;
      }
      .slide {
        grid-row: 2;
        grid-column: 2;
        justify-self: center;
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }
      .slide {
        font: 32px/1.8em var(--font-family);
      }
      .slide > * {
        margin: 0;
      }

      h1 { font: 4em/1.6em var(--font-family) }
      h2 { font: 3em/1.6em var(--font-family) }
      h3 { font: 2em/1.6em var(--font-family) }
      h4 { font: 1.4em/1.6em var(--font-family) }
      h1, h2, h3, h4, h5, h6 {
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: -0.02em;
      }
      li {
        text-align: left;
      }
      code {
        display: inline-block;
        background: #E7E7E7;
        padding: 0 0.2em;
        margin: 0 0.2em;
        border-radius: 0.3em;
        line-height: 1.4em;
      }
      pre code {
        padding: 0.8em 1.2em;
      }
      .slide > p {
        text-align: justify;
        margin-bottom: 5vh !important;
      }
    `
  }

  _readMarkdownScript () {
    const scriptTag = this.querySelector('script[type="text/markdown"]')
    return scriptTag ? trimIndent(scriptTag.textContent) : ''
  }

  _readCustomStyles () {
    const styleTag = this.querySelector('style')
    return styleTag ? styleTag.textContent : ''
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
    // console.log(ev)
    switch (ev.code) {
      case 'ArrowRight':
      case 'Space':
        if (ev.shiftKey) {
          return this._switchSlide('prev')
        } else {
          return this._switchSlide('next')
        }
      case 'ArrowLeft':
        return this._switchSlide('prev')
      case 'KeyI':
      case 'KeyD':
        return this.dark = !this.dark
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
    if (targetIndex >= this._pages.length) {
      targetIndex = this._pages.length - 1
    }
    if (targetIndex < 0) {
      targetIndex = 0
    }

    this.index = targetIndex
  }

  render() {
    if (this._pages.length === 0) {
      return html``
    }

    const markup = marked(this._pages[this.index])

    return html`
      <style>
        :host {
          ${this.dark ? 'filter: invert(90%)' : ''}
        }
        ${ unsafeCSS(this._readCustomStyles()) }
      </style>
      <section class="slide">${unsafeHTML(markup)}</section>
      <slot hidden @slotchange=${() => this.requestUpdate()}></slot>
    `;
  }
}

function trimIndent (text: string): string {
  const lines = text.split('\n')

  const indentCount = lines.reduce((accu: number, curr: string): number => {
    if (curr.trim().length === 0) return accu

    const leadingIndentCount = curr.search(/\S/)
    return leadingIndentCount < accu ? leadingIndentCount : accu
  }, lines[0].length)

  const indentChars = lines[0].substr(0, indentCount)
  return lines.map(line => line.replace(indentChars, '')).join('\n')
}

function splitMarkdownToPages (markdown: string): Array<string> {
  const pages = markdown
    .split(/\n-{3,}\n/) // page break
    .filter(page => Boolean(page.trim()))

  return pages
}
