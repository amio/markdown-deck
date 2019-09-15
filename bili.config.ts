import { Config } from 'bili'

const config: Config = {
  input: 'src/index.ts',
  output: {
    fileName: 'index.min.js',
    sourceMap: true,
  },
  bundleNodeModules: true,
  plugins: {
    babel: false
  },
}

export default config
