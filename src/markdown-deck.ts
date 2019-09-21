import marked from 'marked'
import { LitElement, html, css, property, customElement, unsafeCSS, CSSResult } from 'lit-element'
import { unsafeHTML } from 'lit-html/directives/unsafe-html'
import Prism from 'prismjs'

import themeCodeDefault from './theme-code-default'
import themeDefault from './theme-default'

const ORIGINAL_WIDTH = 1000
const ORIGINAL_HEIGHT = 600

@customElement('markdown-deck')
export class MarkdownDeck extends LitElement {
  @property({ type: String }) markdown: string      // the markdown to parse
  @property({ type: String }) src: string           // the markdown file url to load
  @property({ type: Number }) index = 0             // current slide index
  @property({ type: Boolean }) hashsync = false     // sync with location hash
  @property({ type: Boolean }) hotkey = false       // hotkey support
  @property({ type: Boolean }) invert = false       // invert slides color

  // watched private properties
  @property({ type: Number }) _scale = 1            // scale canvas to fit container
  @property({ type: Array }) _pages = []            // split markdown to pages

  // private properties
  _touchStart: { clientX: number, clientY: number } // handle for remove swipe listener

  static get styles () {
    return deckStyle(themeDefault, themeCodeDefault)
  }

  render () {
    if (this._pages.length === 0) {
      return html``
    }

    const markup = marked(this._pages[this.index], {
      highlight: function (code: string, lang: string) {
        try {
          return Prism.highlight(code, Prism.languages[lang || 'markup'])
        } catch (e) {
          console.warn(`[highlight error] lang:${lang} #${this.index}`)
          return code
        }
      }
    })

    return html`
      <style>
        section { transform: scale(${this._scale}) }
        ${ unsafeCSS(this._readCustomStyles()) }
      </style>
      <div tabindex="999"
        class="deck ${this.invert ? 'invert' : ''}"
        @touchstart=${this._handleTouchStart}
        @touchend=${this._handleTouchEnd} >
        <section class="slide">${unsafeHTML(markup)}</section>
      </div>
      <slot @slotchange=${() => this.requestUpdate()}></slot>
    `;
  }

  connectedCallback () {
    super.connectedCallback()

    this._setScale()
    window.addEventListener('resize', this._handleResize)

    if (this.hotkey) {
      window.addEventListener('keydown', this._handleKeydown)
    }

    if (this.markdown === undefined && this.src) {
      this._loadMarkdownFile(this.src)
    }

    if (this.hashsync) {
      this.index = parseInt(location.hash.replace('#', ''), 10) || 0
      setLocationHash(this.index)
    }
  }

  disconnectedCallback () {
    super.disconnectedCallback()
    window.removeEventListener('keydown', this._handleKeydown)
    window.removeEventListener('resize', this._handleResize)
  }

  shouldUpdate (changedProps) {
    if (changedProps.has('markdown')) {
      // update computed property
      this._updatePages()
      return true
    }

    const watched = ['markdown', 'index', '_scale', '_pages']
    return watched.some(attr => changedProps.has(attr))
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

  _handleTouchStart = (ev: TouchEvent) => {
    const { clientX, clientY } = ev.changedTouches[0]
    this._touchStart = { clientX, clientY }
  }

  _handleTouchEnd = (ev: TouchEvent) => {
    const { clientX, clientY } = ev.changedTouches[0]
    const deltaX = clientX - this._touchStart.clientX
    const deltaY = clientY - this._touchStart.clientY

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > 0) {
        this._switchSlide('prev')
      } else {
        this._switchSlide('next')
      }
    }
  }

  _handleResize = () => {
    this._setScale()
    this.requestUpdate()
  }

  _setScale () {
    const { width, height } = this.getBoundingClientRect()

    const maxScale = width > height
      ? Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT)
      : Math.min(width / ORIGINAL_HEIGHT, height / ORIGINAL_WIDTH)

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

  _handleKeydown = (ev: KeyboardEvent) => {
    // console.log(ev.code)
    if (ev.target !== this && ev.target !== document.body || ev.metaKey) {
      return
    }

    switch (ev.code) {
      case 'Space':
      case 'ArrowRight':
      case 'KeyL':
        if (ev.shiftKey) {
          return this._switchSlide('prev')
        } else {
          return this._switchSlide('next')
        }
      case 'ArrowLeft':
      case 'KeyJ':
        if (ev.shiftKey) {
          return this._switchSlide('next')
        } else {
          return this._switchSlide('prev')
        }
      case 'ArrowUp':
        return this._switchSlide('first')
      case 'ArrowDown':
        return this._switchSlide('last')
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
        break;
      case 'first':
        targetIndex = 0
        break;
      case 'last':
        targetIndex = this._pages.length - 1
        break;
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

function deckStyle (theme: CSSResult, codeTheme: CSSResult): CSSResult {
  return css`
    :host {
      display: block;
      min-height: 400px;
      overflow: hidden;
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
    ${ theme }
    ${ codeTheme }
  `
}
