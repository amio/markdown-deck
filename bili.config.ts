import { Config } from 'bili'

const config: Config = {
  output: {
    fileName: 'markdown-deck[min][ext]',
    moduleName: 'MarkdownDeck',
    sourceMap: false,
  },
  plugins: {
    babel: false
  }
}

export default config
