import marked from 'marked'
import { LitElement, html, css, property, customElement, unsafeCSS } from 'lit-element'
import { unsafeHTML } from 'lit-html/directives/unsafe-html'
import Prism from 'prismjs'

import themeCodeDefault from './theme-code-default'
import themeDefault from './theme-default'

const ORIGINAL_WIDTH = 1000
const ORIGINAL_HEIGHT = 600

@customElement('markdown-deck')
export class MarkdownDeck extends LitElement {
  @property({ type: String }) markdown: string  // the markdown to parse
  @property({ type: String }) src: string       // the markdown file url to load
  @property({ type: Number }) index = 0         // current slide index
  @property({ type: Boolean }) hotkey = false   // sync with location hash
  @property({ type: Boolean }) hashsync = false // sync with location hash
  @property({ type: Boolean }) invert = false   // invert slides color

  _pages = []        // splited markdown
  _scale = 1

  static get styles () {
    return deckStyle(themeDefault, themeCodeDefault)
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

    this._setScale()

    if (this.markdown === undefined && this.src) {
      this._loadMarkdownFile(this.src)
    }

    if (this.hashsync) {
      this.index = parseInt(location.hash.replace('#', ''), 10) || 0
      setLocationHash(this.index)
    }

    if (this.hotkey) {
      this._bindShortcuts()
    }

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

  _setScale () {
    const { width, height } = this.parentElement.getBoundingClientRect()
    const maxScale = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT)
    this._scale = maxScale * 0.9
  }

  _loadMarkdownFile (src: string) {
    fetch(src, { mode: 'cors' })
      .then(resp => {
        if (resp.status === 200) return resp.text()
        throw new Error(`(fetching ${src}) ${resp.statusText}`)
      })
      .then(text => {
        this.markdown = text
        this._updatePages()
      })
      .catch(console.error)
  }

  _onKeydown = (ev) => {
    // console.log(ev)
    switch (ev.code) {
      case 'ArrowRight':
      case 'ArrowDown':
      case 'Space':
        if (ev.shiftKey) {
          return this._switchSlide('prev')
        } else {
          return this._switchSlide('next')
        }
      case 'ArrowLeft':
      case 'ArrowUp':
        if (ev.shiftKey) {
          return this._switchSlide('next')
        } else {
          return this._switchSlide('prev')
        }
      case 'KeyI':
      case 'KeyD':
        return this.invert = !this.invert
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

    if (this.hashsync) {
      setLocationHash(this.index)
    }
  }

  render() {
    if (this._pages.length === 0) {
      return html``
    }

    const markup = marked(this._pages[this.index], {
      highlight: function (code, lang = 'markup') {
        try {
          // console.log(hyper(code))
          return Prism.highlight(code, Prism.languages[lang] || 'markup')
        } catch (e) {
          console.warn(`[highlighting]`, e)
          return code
        }
      }
    })

    return html`
      <style>
        ${ unsafeCSS(this._readCustomStyles()) }
        section { transform: scale(${this._scale}) }
      </style>
      <div class="deck ${this.invert ? 'invert' : ''}">
        <section class="slide">${unsafeHTML(markup)}</section>
      </div>
      <slot @slotchange=${() => this.requestUpdate()}></slot>
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

function setLocationHash (hash: any) {
  const hashString = '#' + String(hash)

  if (history.replaceState) {
    history.replaceState(null, null, hashString)
  } else {
    location.hash = hashString
  }
}

function deckStyle (theme, codeTheme) {
  return css`
    :host {
      display: block;
      min-height: 400px;
    }
    .invert {
      filter: invert(100%);
    }
    .invert img {
      filter: invert(100%);
    }
    .deck {
      height: 100%;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: white;
    }
    .slide {
      width: ${ORIGINAL_WIDTH}px;
      height: ${ORIGINAL_HEIGHT}px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .slide > * {
      margin: 0;
    }
    .slide > p {
      text-align: justify;
      margin-bottom: 5vh !important;
    }

    ${ theme }
    ${ codeTheme }
  `
}
