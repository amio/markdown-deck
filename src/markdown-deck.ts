import marked from 'marked'
import { LitElement, html, css, property, customElement, unsafeCSS, CSSResult } from 'lit-element'
import { unsafeHTML } from 'lit-html/directives/unsafe-html'
import { classMap } from 'lit-html/directives/class-map'
import Prism from 'prismjs'

import themeCodeDefault from './theme-code-default'
import themeDefault from './theme-default'

const ORIGINAL_WIDTH = 640
const ORIGINAL_HEIGHT = 400

@customElement('markdown-deck')
export class MarkdownDeck extends LitElement {
  @property({ type: String }) markdown: string      // the markdown to parse
  @property({ type: String }) src: string           // the markdown file url to load
  @property({ type: Number }) index = 0             // current slide index
  @property({ type: Boolean }) hashsync = false     // sync with location hash
  @property({ type: Boolean }) printing = false     // printing mode [TODO]
  @property({ type: Boolean }) editing = false      // reveal editor
  @property({ type: Boolean }) hotkey = false       // enable hotkey
  @property({ type: Boolean }) invert = false       // invert color

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

    this._setScale()

    const markup = marked(this._pages[this.index], {
      highlight: function (code: string, lang: string) {
        try {
          return Prism.highlight(code, Prism.languages[lang || 'markup'])
        } catch (e) {
          console.warn(`[highlight error] lang:${lang} index:${this.index}`)
          return code
        }
      }
    })

    const deckClassNames = {
      invert: this.invert,
      editing: this.editing
    }

    return html`
      <style>
        section { transform: scale(${this._scale}) }
        ${ unsafeCSS(this._readCustomStyles()) }
      </style>
      <div id="deck" tabindex="1000"
        class="${classMap(deckClassNames)}"
        @touchstart=${this._handleTouchStart}
        @touchend=${this._handleTouchEnd} >
        ${this.editing ? this._renderEditor() : null}

        <div id="slide-wrap">
          <section class="slide">${unsafeHTML(markup)}</section>
        </div>
      </div>
      <slot @slotchange=${() => this.requestUpdate()}></slot>
    `;
  }

  _renderEditor () {
    return html`
      <textarea class="editor"
        @keydown=${this._handleEditing}
        @input=${this._handleEditing}
        @click=${this._handleEditing}
      >${this.markdown}</textarea>
    `
  }

  connectedCallback () {
    super.connectedCallback()

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

    const watched = ['markdown', 'index', 'invert', 'editing', '_scale', '_pages']
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

  _handleEditing = (ev: KeyboardEvent | InputEvent) => {
    if (ev instanceof KeyboardEvent && ev.code !== 'Escape') {
      ev.stopPropagation()
    }

    // sync deck with editor
    const editor: HTMLTextAreaElement = this.shadowRoot.querySelector('.editor')
    const textBeforeCaret = editor.value.substr(0, editor.selectionStart)
    const pageIndex = textBeforeCaret.split('\n---\n').length - 1
    this.markdown = editor.value
    this.index = pageIndex
    this._updatePages()
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
    const { width: deckWidth, height } = this.getBoundingClientRect()
    const width = this.editing ? deckWidth * 0.66 : deckWidth

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
      case 'Escape':
        return this.editing = !this.editing
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
      overflow: hidden;
      min-height: ${ORIGINAL_HEIGHT}px;
      height: 100%;
    }
    #deck {
      height: 100%;
      width: 100%;
      display: grid;
      background-color: white;
    }
    #deck.invert {
      filter: invert(100%);
    }
    #deck.invert img {
      filter: invert(100%);
    }
    #deck.editing {
      grid-template-columns: 1fr 2fr;
    }
    #slide-wrap {
      place-self: center;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .slide {
      width: ${ORIGINAL_WIDTH}px;
      height: ${ORIGINAL_HEIGHT}px;
      place-self: center;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }
    .editor {
      height: 100%;
      width: 100%;
      color: #666;
      padding: 1em;
      border: 0px solid transparent;
      box-sizing: border-box;
      background-color: #F7F7F7;
      font: 16px/1.6em monospace;
    }
    .editor:focus {
      color: #111;
      outline: none;
      box-shadow: inset 0 0 100px #EEE;
    }
    ${ theme }
    ${ codeTheme }
  `
}
