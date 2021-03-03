const {
  override,
  overrideDevServer,
  addBabelPlugin,
  addBundleVisualizer,
  addWebpackPlugin,
  adjustStyleLoaders,
} = require('customize-cra')
const { argv } = require('yargs')
const CompressionPlugin = require('compression-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')

const PrerenderSPAPlugin = require('./PrerenderSPAPlugin')
const { getConfig, paths, JSDOMPrerenderer } = require('../server')
const parsePrerenderConfig = require('./parsePrerenderConfig')
const { addDevProxy } = require('./override')

const {
  webpack = [],
  devServer = [],
  prerender: prerenderConfig,
  proxy: proxyTable,
  gzip = true,
} = getConfig()
const { usePrerender, prerenderRoutes, rendererConfig } = parsePrerenderConfig(
  prerenderConfig
)

// 不使用 eject 自定义 create-react-app
// https://github.com/timarney/react-app-rewired
// https://github.com/arackaf/customize-cra
module.exports = {
  webpack: override.apply(
    null,
    [
      ...webpack,

      addBabelPlugin('react-node-key/babel'),

      // 启用 webpack-bundle-analyzer 分析，命令行中使用 --analyze 生效
      argv.analyze ? addBundleVisualizer() : undefined,

      // development 模式下启用 css sourceMap 功能
      // cra 官方未做修复，讨论在此处：https://github.com/facebook/create-react-app/issues/5707
      adjustStyleLoaders(({ use: [, css, postcss, resolve, processor] }) => {
        if (process.env.NODE_ENV === 'development') {
          try {
            css.options.sourceMap = true // css-loader
            postcss.options.sourceMap = true // postcss-loader
            // when enable pre-processor,
            // resolve-url-loader will be enabled too
            if (resolve) {
              resolve.options.sourceMap = true // resolve-url-loader
            }
            // pre-processor
            if (processor && processor.loader.includes('sass-loader')) {
              processor.options.sourceMap = true // sass-loader
            }
          } catch (err) {
            // nothing, just try
          }
        }
      }),

      addWebpackPlugin(
        new HtmlWebpackPlugin(
          Object.assign(
            {},
            {
              filename: '__root.html',
              inject: true,
              template: paths.appHtml,
            },
            process.env.NODE_ENV === 'production'
              ? {
                  minify: {
                    removeComments: true,
                    collapseWhitespace: true,
                    removeRedundantAttributes: true,
                    useShortDoctype: true,
                    removeEmptyAttributes: true,
                    removeStyleLinkTypeAttributes: true,
                    keepClosingSlash: true,
                    minifyJS: true,
                    minifyCSS: true,
                    minifyURLs: true,
                  },
                }
              : undefined
          )
        )
      ),

      // 预渲染插件
      // https://github.com/chrisvfritz/prerender-spa-plugin
      usePrerender && process.env.NODE_ENV === 'production'
        ? addWebpackPlugin(
            new PrerenderSPAPlugin({
              // Required - The path to the webpack-outputted app to prerender.
              staticDir: paths.appBuild,
              publicPath: paths.publicUrlOrPath,
              // Required - Routes to render.
              routes: prerenderRoutes,
              server: {
                proxy: proxyTable
              },
              renderer: new JSDOMPrerenderer({
                ...rendererConfig,
                renderAfterTimeout: rendererConfig.timeout || 1000,
                renderAfterDocumentEvent: 'ssr-ready',
                useResourceCache: false,
                inject: {
                  ...(rendererConfig.inject || null),
                  __SSR__: true,
                  __PR__: true,
                },
              }),
            })
          )
        : undefined,

      // gzip 压缩
      // https://webpack.js.org/plugins/compression-webpack-plugin/
      gzip && process.env.NODE_ENV === 'production'
        ? addWebpackPlugin(
            new CompressionPlugin({
              exclude: /\.html$/,
              threshold: 4096, // 4MB 以下文件不压缩
            })
          )
        : undefined,
    ].filter(Boolean)
  ),
  devServer: overrideDevServer.apply(
    null,
    [...devServer, addDevProxy({ publicPath: paths.publicUrlOrPath })].filter(Boolean)
  ),
}
