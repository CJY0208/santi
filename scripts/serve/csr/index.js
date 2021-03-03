const Koa = require('koa')
const koaCompress = require('koa-compress')
const httpProxy = require('koa-server-http-proxy')

const { getConfig, paths, koaFallbackStatic } = require('../../../server')

const KOA_DEFAULT = {
  compress: {
    threshold: 4096
  },
  static: {
    maxAge: 365 * 24 * 60 * 60 * 1000,
    immutable: true,

    // 需要存在 .gz 文件时才能生效
    // https://github.com/koajs/send/blob/5.0.0/index.js#L80
    gzip: true
  }
}

function runKoa(config = KOA_DEFAULT, port) {
  const {
    proxy: proxyTable,
    staticDir = paths.appBuild,
    publicPath = paths.publicUrlOrPath,
    static: staticOpts
  } = {
    ...KOA_DEFAULT,
    ...getConfig(),
    ...config
  }
  const app = new Koa()

  Object.entries(proxyTable).forEach(([context, options]) => {
    app.use(httpProxy(context, options))
  })
  app.use(koaCompress(config.compress))
  app.use(
    koaFallbackStatic(staticDir, {
      ...staticOpts,
      fallback: '__root.html',
      publicPath
    })
  )

  app.listen(port, () => {
    console.log(`[CSR] Koa2 server listening on port ${port}`)
  })
}

module.exports = runKoa
