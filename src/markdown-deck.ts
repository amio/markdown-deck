import { html, css, property, customElement, unsafeCSS } from 'lit-element'
import { LitElement, CSSResult, TemplateResult, PropertyValues } from 'lit-element'
import { classMap } from 'lit-html/directives/class-map'
import { repeat } from 'lit-html/directives/repeat'

import { splitMarkdownToPages, getRangeByIndex } from './markdeck'

import './markdown-slide'

@customElement('markdown-deck')
export class MarkdownDeck extends LitElement {
  @property({ type: String }) markdown: string      // markdown content to present
  @property({ type: String }) src: string           // markdown file url to load
  @property({ type: String }) css: string           // custom css url to load
  @property({ type: Number }) index = 0             // current slide index

  // feature switch
  @property({ type: Boolean }) hotkey = false       // enable hotkey
  @property({ type: Boolean }) hashsync = false     // sync with location hash

  // view mode switch
  @property({ type: Boolean }) printing = false     // printing mode
  @property({ type: Boolean }) editing = false      // reveal editor
  @property({ type: Boolean }) invert = false       // invert color

  // watched private properties
  @property({ type: Number }) _scale = 1            // scale canvas to fit container
  @property({ type: Array }) _pages = []            // split markdown to pages
  @property({ type: Array }) _stylesheet = ''       // custom stylesheet

  // private properties
  _touchStart: { clientX: number, clientY: number } // handle for remove swipe listener

  static get styles () {
    return deckStyle()
  }

  render () {
    if (this._pages.length === 0) {
      return html``
    }

    const deckClassNames = {
      invert: this.invert,
      printing: this.printing,
      editing: this.editing && window.innerWidth > 960,
      editor: this.editing && window.innerWidth <= 960
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
        ${
          this.markdown === undefined && this.hotkey
            ? this._renderBlankHint()
            : this.printing
              ? this._renderSlides(this._pages)
              : this._renderSlide(this._pages[this.index])
        }
      </div>
      <slot @slotchange=${() => this.requestUpdate()}></slot>
    `;
  }

  _renderEditor () {
    return html`
      <textarea class="editor"
        @keydown=${this._handleEditing}
        @keyup=${this._handleEditing}
        @input=${this._handleEditing}
        @click=${this._handleEditing}
      >${this.markdown}</textarea>
    `
  }

  _renderBlankHint (): TemplateResult {
    return this._renderSlide(`press <kbd>esc</kbd> to start writing`)
  }

  _renderSlide = (md: string): TemplateResult => {
    return html`
      <markdown-slide
        markdown=${md}
        scale=${this._scale}
        css=${this._stylesheet}
        ?invert=${this.invert}
      >
      </markdown-slide>
    `
  }

  _renderSlides (mds: Array<string>): TemplateResult {
    return html`<div class="print-wrap">${repeat(mds, this._renderSlide)}</div>`
  }

  connectedCallback () {
    super.connectedCallback()

    window.addEventListener('resize', this._handleResize)

    if (this.hotkey) {
      window.addEventListener('keydown', this._handleKeydown)
    }

    if (this.hashsync) {
      this.index = parseInt(location.hash.replace('#', ''), 10) || 0
    }
  }

  disconnectedCallback () {
    super.disconnectedCallback()
    window.removeEventListener('keydown', this._handleKeydown)
    window.removeEventListener('resize', this._handleResize)
  }

  shouldUpdate (changedProps: PropertyValues) {
    if (changedProps.has('markdown')) {
      this._updatePages()
    }

    if (changedProps.has('src')) {
      this.src && this._loadMarkdownFile(this.src)
    }

    if (changedProps.has('css')) {
      this.css && this._loadCSSFile(this.css)
    }

    // return true if any changed prop is not in omitProps
    const omitProps = ['_touchStart', 'css', 'src']
    for (const prop of changedProps.keys()) {
      if (!omitProps.includes(prop as string)) return true
    }

    return false
  }

  updated (changedProps: PropertyValues) {
    if (changedProps.has('editing')) {
      // event: editor-toggle
      this._dispatchEvent('editor-toggle', {
        open: this.editing
      })
    }

    if (changedProps.has('editing') && this.editing) {
      this._syncEditorSelection()
    }

    if (changedProps.has('index')) {
      // sync with hash
      if (this.hashsync) {
        setLocationHash(this.index)
      }
    }
  }

  _syncEditorSelection () {
    const textarea = this.shadowRoot.querySelector('textarea')
    const [start, end] = getRangeByIndex(this.markdown, this.index)
    scrollTextareaTo(textarea, start)
    textarea.setSelectionRange(start, end)
    textarea.focus()
  }

  _dispatchEvent (name: string, detail: any) {
    // console.info('dispatch event:', name, detail)
    this.dispatchEvent(new CustomEvent(name, {
      detail,
      bubbles: true,
      composed: true
    }))
  }

  _readMarkdownScript () {
    const scriptTag = this.querySelector('script[type="text/markdown"]')
    return scriptTag ? trimIndent(scriptTag.textContent) : ''
  }

  _readCustomStyles () {
    const styleTag = this.querySelector('style')
    return `${this._stylesheet}\n${styleTag ? styleTag.textContent : ''}`
  }

  _updatePages () {
    const markdown = this.markdown || this._readMarkdownScript()
    this._pages = splitMarkdownToPages(markdown)
  }

  _handleEditing = (ev: KeyboardEvent | InputEvent) => {
    if (ev instanceof KeyboardEvent) {
      if (ev.code === 'Escape' || ev.metaKey || ev.ctrlKey) return
      ev.stopPropagation()
    }

    // sync deck with editor
    const editor: HTMLTextAreaElement = this.shadowRoot.querySelector('textarea')
    const textBeforeCaret = editor.value.substr(0, editor.selectionStart + 2)
    const pageIndex = splitMarkdownToPages(textBeforeCaret).length - 1
    this.markdown = editor.value
    this.index = pageIndex
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
    this.requestUpdate()
  }

  _loadCSSFile (src: string) {
    fetch(src, { mode: 'cors' })
      .then(resp => {
        if (resp.status === 200) return resp.text()
        throw new Error(`(fetching ${src}) ${resp.status}`)
      })
      .then(text => {
        this._stylesheet = text
      })
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
    if (ev.target !== this && ev.target !== document.body || ev.metaKey || ev.ctrlKey) {
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
        this.editing = !this.editing
        return
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

    this._dispatchEvent('navigation', {
      to: this.index
    })

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

function setLocationHash (hash: any) {
  const hashString = '#' + String(hash)

  if (history.replaceState) {
    history.replaceState(null, null, hashString)
  } else {
    location.hash = hashString
  }
}

function scrollTextareaTo (textarea: HTMLTextAreaElement, start: number) {
  if (start === 0) return

  const content = textarea.value
  textarea.value = content.substr(0, start)

  const originalScrollHeight = textarea.scrollHeight
  textarea.style.paddingBottom = textarea.scrollHeight + 'px'
  const expandScrollHeight = textarea.scrollHeight
  textarea.style.paddingBottom = '15px'

  textarea.value = content
  textarea.scrollTop = expandScrollHeight - originalScrollHeight - 46
}

function deckStyle (): CSSResult {
  return css`
    :host {
      display: block;
      min-height: 400px;
      height: 100%;
    }
    #deck {
      height: 100%;
      width: 100%;
    }
    #deck.editing {
      display: grid;
      grid-template-columns: 1fr 2fr;
    }
    #deck.editor .slide .content {
      display: none;
    }
    .print-wrap {
      height: 100%;
    }
    .editor {
      height: 100%;
      width: 100%;
      color: #666;
      padding: 15px 18px;
      border: 0px solid transparent;
      box-sizing: border-box;
      background-color: #F7F7F7;
      font: 16px/1.6em monospace;
      resize: none;
    }
    .editor:focus {
      color: #111;
      outline: none;
      box-shadow: inset 0 0 100px #EEE;
    }
  `
}
