import resolve from 'rollup-plugin-node-resolve'
import babel from 'rollup-plugin-babel'
import { uglify } from 'rollup-plugin-uglify'

export default [
  {
    input: 'client/index.js',
    output: {
      file: 'lib/client/index.min.js',
      format: 'umd',
      name: 'ReactActivation',
      exports: 'named'
    },
    external: ['react', 'hoist-non-react-statics'],
    plugins: [
      resolve(),
      babel({
        exclude: 'node_modules/**'
      }),
      uglify()
    ]
  },
  {
    input: 'client/index.js',
    output: {
      file: 'lib/client/index.js',
      format: 'cjs',
      exports: 'named',
      sourcemap: true
    },
    external: ['react', 'hoist-non-react-statics'],
    plugins: [
      resolve(),
      babel({
        exclude: 'node_modules/**'
      })
    ]
  }
]
