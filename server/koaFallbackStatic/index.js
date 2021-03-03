const koaStatic = require('./koaStatic')

function koaFallbackStatic(root, { fallback = '/', publicPath = '/', ...opts } = {}) {
  const serveStatic = koaStatic(root, opts)

  return async (ctx, next) => {
    ctx.request.url = ctx.request.url.replace(publicPath, '/')

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
        ctx.request.url = fallback
        return await serveStatic(ctx, next)
      } else {
        throw err
      }
    }
  }
}

module.exports = koaFallbackStatic
