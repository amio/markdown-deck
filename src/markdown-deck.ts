import marked from 'marked'
import { LitElement, html, css, property, customElement, unsafeCSS, CSSResult, TemplateResult } from 'lit-element'
import { unsafeHTML } from 'lit-html/directives/unsafe-html'
import { classMap } from 'lit-html/directives/class-map'
import { repeat } from 'lit-html/directives/repeat'
import Prism from 'prismjs'

import themeCodeDefault from './theme-code-default'
import themeDefault from './theme-default'

const ORIGINAL_WIDTH = 640
const ORIGINAL_HEIGHT = 400

@customElement('markdown-deck')
export class MarkdownDeck extends LitElement {
  @property({ type: String }) markdown: string      // the markdown to parse
  @property({ type: Number }) index = 0             // current slide index
  @property({ type: String }) src: string           // the markdown file url to load

  // feature switch
  @property({ type: Boolean }) hotkey = false       // enable hotkey
  @property({ type: Boolean }) hashsync = false     // sync with location hash

  // view mode switch
  @property({ type: Boolean }) printing = false     // printing mode [TODO]
  @property({ type: Boolean }) editing = false      // reveal editor
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

    const deckClassNames = {
      invert: this.invert,
      editing: this.editing,
      printing: this.printing
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
        ${this.printing
          ? renderSlides(this._pages)
          : renderSlide(this._pages[this.index])
        }
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

    const watched = ['markdown', 'index', 'invert', 'editing', 'printing', '_scale', '_pages']
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
    this._pages = markdown.split(/\n-{3,}\n/)
  }

  _handleEditing = (ev: KeyboardEvent | InputEvent) => {
    if (ev instanceof KeyboardEvent) {
      if (ev.code === 'Escape' || ev.metaKey || ev.ctrlKey) return
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
        console.error(`(fetching ${src}) ${resp.status}`)
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
        this.printing = false
        return this.editing = !this.editing
      case 'KeyP':
        this.editing = false
        this.printing = !this.printing
        return this.requestUpdate()
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


function renderSlide (md: string): TemplateResult {
  const markup = marked(md, {
    highlight: function (code: string, lang: string) {
      try {
        return Prism.highlight(code, Prism.languages[lang || 'markup'])
      } catch (e) {
        console.warn(`[highlight error] lang:${lang} index:${this.index}`)
        return code
      }
    }
  })

  return html`
    <div class="slide">
      <section class="content">${unsafeHTML(markup)}</section>
    </div>
  `
}

function renderSlides (mds: Array<string>): TemplateResult {
  return html`<div class="print-wrap">${repeat(mds, renderSlide)}</div>`
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
    #deck.printing {
      display: block;
    }
    .print-wrap {
      height: 100%;
    }
    .slide {
      height: 100%;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .content {
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
