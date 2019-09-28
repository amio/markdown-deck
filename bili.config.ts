import { Config } from 'bili'

const config: Config = {
  input: 'src/index.ts',
  output: {
    fileName: 'markdown-deck.min.js',
    sourceMap: true,
  },
  plugins: {
    babel: false
  },
  bundleNodeModules: true,
}

export default config
