const Koa = require('koa')

const { paths, koaSsr, getConfig } = require('../../../server')

const { ssr: ssrConfig = {} } = getConfig()

const DEFAULT = {
  useTaskCache: false,
  taskCacheTimeout: -1,
  deferHeadScripts: true,
  inlinePrimaryStyle: true,
  inject: {
    __SSR__: true
  }
  // tastCacheConfig: [
  //   ['default', clear => {
  //     setTimeout(clear, 300)
  //   }],
  //   [/\^\//]
  // ],
}

function run(config = DEFAULT, port) {
  const app = new Koa()

  app.use(
    koaSsr({
      ...DEFAULT,
      ...ssrConfig,
      ...config,
      renderAfterTimeout:
        config.renderAfterTimeout || ssrConfig.timeout || 1000,
      staticDir: paths.appBuild,
      renderAfterDocumentEvent: 'snapshotable',
      inject: {
        ...(ssrConfig.inject || null),
        ...(config.inject || null),
        __SSR__: true
      }
    })
  )

  app.listen(port, () => {
    console.log(`listening on port ${port}`)
  })
}

module.exports = run
