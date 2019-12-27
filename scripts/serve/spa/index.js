const Koa = require('koa')
const koaCompress = require('koa-compress')
const httpProxy = require('koa-server-http-proxy')

const koaStatic = require('./koaStatic')
const { getConfig, paths } = require('../../../server')

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
    static: staticOpts
  } = {
    ...KOA_DEFAULT,
    ...getConfig(),
    ...config
  }
  const app = new Koa()
  const serveStatic = koaStatic(staticDir, staticOpts)

  Object.entries(proxyTable).forEach(([context, options]) => {
    app.use(httpProxy(context, options))
  })
  app.use(koaCompress(config.compress))
  app.use(async (ctx, next) => {
    if (
      /\.html$/.test(ctx.request.url) ||
      !/text\/html/.test(ctx.header.accept)
    ) {
      return await serveStatic(ctx, next)
    }

    try {
      await serveStatic(ctx, next)
    } catch (err) {
      if (err.status === 404) {
        ctx.request.url = '/'
        return await serveStatic(ctx, next)
      } else {
        throw err
      }
    }
  })

  app.listen(port, () => {
    console.log(`[SPA] Koa2 server listening on port ${port}`)
  })
}

module.exports = runKoa
