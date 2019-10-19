import marked from 'marked'
import { html, css, property, customElement, unsafeCSS } from 'lit-element'
import { LitElement, CSSResult, TemplateResult, PropertyValues } from 'lit-element'
import { unsafeHTML } from 'lit-html/directives/unsafe-html'
import { classMap } from 'lit-html/directives/class-map'

import Prism from 'prismjs'
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-bash'
import 'prismjs/components/prism-go'
import 'prismjs/components/prism-sql'
import 'prismjs/components/prism-rust'
import 'prismjs/components/prism-csharp'

import themeCodeDefault from './theme-code-default'
import themeDefault from './theme-default'

const orienPortrait = window.innerHeight > window.innerWidth
const ORIGINAL_WIDTH = orienPortrait ? 400 : 640
const ORIGINAL_HEIGHT = orienPortrait ? 640 : 400

@customElement('markdown-slide')
export class MarkdownSlide extends LitElement {
  @property({ type: String }) markdown: string
  @property({ type: Boolean }) invert: boolean
  @property({ type: Number }) scale: number
  @property({ type: String }) css: string

  static get styles () {
    return slideStyle(themeDefault, themeCodeDefault)
  }

  render () {
    const markup = marked(this.markdown, {
      highlight: function (code: string, lang: string) {
        try {
          return Prism.highlight(code, Prism.languages[lang || 'markup'])
        } catch (e) {
          console.warn(`[highlight error] lang:${lang} index:${this.index}`)
          return code
        }
      }
    })

    const classNames = {
      slide: true,
      invert: this.invert
    }

    return html`
      <div class=${classMap(classNames)}>
        <style>
          .slide { background-color: white }
          .content { scale: ${this.scale} }
          ${this.css}
        </style>
        <section class="content">${unsafeHTML(markup)}</section>
      </div>
    `
  }
}

function slideStyle (theme: CSSResult, codeTheme: CSSResult): CSSResult {
  return css`
    .slide {
      height: 100%;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .slide.invert {
      filter: invert(100%);
    }
    .slide.invert img {
      filter: invert(100%);
    }
    .content {
      width: ${ORIGINAL_WIDTH}px;
      height: ${ORIGINAL_HEIGHT}px;
      place-self: center;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      --content-width: ${ORIGINAL_WIDTH}px;
      --content-height: ${ORIGINAL_HEIGHT}px;
    }
    ${ theme }
    ${ codeTheme }
  `
}
