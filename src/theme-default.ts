import { css } from 'lit-element'

export default css`
  @import url("https://fonts.googleapis.com/css?family=Roboto:300,400,400i,900&display=swap");
  @import url("https://fonts.googleapis.com/css?family=Fira+Code:400,400i,700&display=swap");

  .slide {
    --font-family: "Roboto", sans-serif;
    --code-font-family: "Fira Code", monospace;
    font: 20px/1.6em var(--font-family);
  }

  .slide > * {
    margin-top: 0;
  }

  h1 { font: 3.2em/1.4em var(--font-family) }
  h2 { font: 2.1em/1.4em var(--font-family) }
  h3 { font: 1.6em/1.4em var(--font-family) }
  h4 { font: 1.2em/1.6em var(--font-family) }
  h5 { font: 1.0em/1.6em var(--font-family) }

  h1, h2, h3, h4, h5, h6 {
    font-weight: bold;
    letter-spacing: -0.01em;
    margin-bottom: 0.5em;
  }

  h1 {
    text-transform: uppercase;
  }

  h6 {
    font-weight: normal;
    font-size: 2em;
    line-height: 1.6em;
    letter-spacing: -0.02em;
  }

  li {
    text-align: left;
  }

  i {
    color: #333;
  }

  code {
    display: inline-block;
    background: #E7E7E7;
    padding: 0 0.25em;
    margin: 0 0.1em;
    border-radius: 0.3em;
    line-height: 1.4em;
    font-family: var(--code-font-family) !important;
  }

  pre {
    margin: 0 0.2em;
    font-size: 0.6em;
  }

  pre code {
    padding: 0.7em 1.2em;
  }

  a {
    color: #25E;
    text-decoration: none;
  }

  a:hover {
    text-decoration: underline;
  }

  iframe {
    width: 100%;
    height: 100%;
    border: none;
  }

  kbd {
    display: inline-block;
    min-width: 20px;
    text-align: center;
    padding: 2px 12px 6px 12px;
    margin: 0 12px;
    color: #444d56;
    background-color: #fafbfc;
    border: 1px solid #c6cbd1;
    border-bottom-color: #959da5;
    box-shadow: inset 0 -5px 0 #959da5;
    border-radius: 10px;
}
`
