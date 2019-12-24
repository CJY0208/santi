const Koa = require('koa')
const httpProxy = require('koa-server-http-proxy')

const { paths, koaSsr, getConfig } = require('../../../server')

const { ssr: ssrConfig = {}, proxy: proxyTable = {} } = getConfig()

const DEFAULT = {
  useTaskCache: false,
  taskCacheTimeout: -1,
  deferHeadScripts: true,
  inlinePrimaryStyle: true,
  inject: {
    __SSR__: true
  }
}

function run(config = DEFAULT, port) {
  const app = new Koa()

  app.use(
    koaSsr({
      staticDir: paths.appBuild,
      ...DEFAULT,
      ...ssrConfig,
      ...config,
      proxy: {
        ...proxyTable,
        ...(config.proxy || {})
      },
      renderAfterTimeout:
        config.renderAfterTimeout || ssrConfig.timeout || 1000,
      renderAfterDocumentEvent: 'snapshotable',
      inject: {
        ...(ssrConfig.inject || null),
        ...(config.inject || null),
        __SSR__: true
      }
    })
  )

  Object.entries(proxyTable).forEach(([context, options]) => {
    app.use(httpProxy(context, options))
  })

  app.listen(port, () => {
    console.log(`[SSR] Koa server listening on port ${port}`)
  })
}

module.exports = run
