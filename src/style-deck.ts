import { css } from 'lit-element'

export const DEFAULT_WIDTH = 1000
export const DEFAULT_HEIGHT = 600

export default css`
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
    width: ${DEFAULT_WIDTH}px;
    height: ${DEFAULT_HEIGHT}px;
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
`
