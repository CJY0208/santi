const Koa = require('koa')

const { paths, koaSsr } = require('../../../server')

const DEFAULT = {
  useTaskCache: false,
  taskCacheTimeout: -1,
  renderAfterTimeout: 1000,
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
      ...config,
      staticDir: paths.appBuild,
      renderAfterDocumentEvent: 'snapshotable',
      inject: {
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
