const {
  override,
  overrideDevServer,
  addBabelPlugin,
  addBundleVisualizer,
  addWebpackPlugin
} = require('customize-cra')
const { argv } = require('yargs')
const CompressionPlugin = require('compression-webpack-plugin')

const PrerenderSPAPlugin = require('./PrerenderSPAPlugin')
const { devSsr, getConfig, paths, JSDOMPrerenderer } = require('../server')
const parsePrerenderConfig = require('./parsePrerenderConfig')

const { webpack = [], devServer = [], prerender: prerenderConfig } = getConfig()
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

      addBabelPlugin('react-activation/babel'),

      // 启用 webpack-bundle-analyzer 分析，命令行中使用 --analyze 生效
      argv.analyze ? addBundleVisualizer() : undefined,

      // 预渲染插件
      // https://github.com/chrisvfritz/prerender-spa-plugin
      usePrerender && process.env.NODE_ENV === 'production'
        ? addWebpackPlugin(
            new PrerenderSPAPlugin({
              // Required - The path to the webpack-outputted app to prerender.
              staticDir: paths.appBuild,
              // Required - Routes to render.
              routes: prerenderRoutes,
              renderer: new JSDOMPrerenderer({
                ...rendererConfig,
                renderAfterTimeout: rendererConfig.timeout || 1000,
                renderAfterDocumentEvent: 'snapshotable',
                useResourceCache: false,
                inject: {
                  ...(rendererConfig.inject || null),
                  __SSR__: true,
                  __PR__: true
                }
              })
            })
          )
        : undefined,

      // gzip 压缩
      // https://webpack.js.org/plugins/compression-webpack-plugin/
      process.env.NODE_ENV === 'production'
        ? addWebpackPlugin(
            new CompressionPlugin({
              exclude: /\.html$/,
              threshold: 4096 // 4MB 以下文件不压缩
            })
          )
        : undefined
    ].filter(Boolean)
  ),
  devServer: overrideDevServer.apply(
    null,
    [
      ...devServer,
      config => {
        const { mode } = getConfig()

        // SSR DEV 模式下增加 html 渲染代理
        if (mode === 'ssr') {
          const originBefore = config.before

          config.before = (app, server) => {
            app.use(
              devSsr({
                logError: false
              })
            )

            originBefore.call(config, app, server)
          }
        }
        return config
      }
    ].filter(Boolean)
  )
}
