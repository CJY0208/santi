const Koa = require('koa')
const koaCompress = require('koa-compress')
const httpProxy = require('koa-server-http-proxy')

const { paths, koaSsr, getConfig } = require('../../../server')

const { ssr: ssrConfig = {}, proxy: proxyTable = {} } = getConfig()

const DEFAULT = {
  deferHeadScripts: true,
  inlinePrimaryStyle: true,
  inject: {
    __SSR__: true
  }
}

function run(config = DEFAULT, port) {
  const app = new Koa()

  Object.entries(proxyTable).forEach(([context, options]) => {
    app.use(httpProxy(context, options))
  })
  app.use(
    koaCompress({
      threshold: 4096
    })
  )

  app.use(
    koaSsr({
      staticDir: paths.appBuild,
      publicPath: paths.publicUrlOrPath,
      ...DEFAULT,
      ...ssrConfig,
      ...config,
      proxy: {
        ...proxyTable,
        ...(config.proxy || {})
      },
      renderAfterTimeout:
        config.renderAfterTimeout || ssrConfig.timeout || 1000,
      renderAfterDocumentEvent: 'ssr-ready',
      inject: {
        ...(ssrConfig.inject || null),
        ...(config.inject || null),
        __SSR__: true
      }
    })
  )

  app.listen(port, () => {
    console.log(`[SSR] Koa server listening on port ${port}`)
  })
}

module.exports = run
