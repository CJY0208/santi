import resolve from 'rollup-plugin-node-resolve'
import babel from 'rollup-plugin-babel'
import { uglify } from 'rollup-plugin-uglify'
import dts from 'rollup-plugin-dts'

export default [
  {
    input: 'client/index.js',
    output: [{ file: 'index.d.ts', format: 'es' }],
    external: ['react', 'hoist-non-react-statics', 'react-node-key'],
    plugins: [
      resolve(),
      babel({
        exclude: 'node_modules/**',
      }),
      dts(),
    ],
  },
  {
    input: 'client/index.js',
    output: {
      file: 'lib/client/index.min.js',
      format: 'umd',
      name: 'SantiClient',
      exports: 'named',
    },
    external: ['react', 'hoist-non-react-statics', 'react-node-key'],
    plugins: [
      resolve(),
      babel({
        exclude: 'node_modules/**',
      }),
      uglify(),
    ],
  },
  {
    input: 'client/index.js',
    output: {
      file: 'lib/client/index.js',
      format: 'cjs',
      exports: 'named',
      sourcemap: true,
    },
    external: ['react', 'hoist-non-react-statics', 'react-node-key'],
    plugins: [
      resolve(),
      babel({
        exclude: 'node_modules/**',
      }),
    ],
  },
]
