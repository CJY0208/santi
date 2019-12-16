const serve = require('koa-static')
const proxy = require('koa-proxy')
const compress = require('koa-compress')

const Renderer = require('./Renderer')

module.exports = function ssr({
  staticDir,
  server,
  log = true,
  ...rendererConfig
} = {}) {
  let count = 0

  const redirect = staticDir
    ? serve(staticDir, {
        maxAge: 365 * 24 * 60 * 60 * 1000,
        immutable: true,

        // 需要存在 .gz 文件时才能生效
        // https://github.com/koajs/send/blob/5.0.0/index.js#L80
        gzip: true
      })
    : server
    ? proxy({
        host: server
      })
    : undefined

  if (!redirect) {
    throw new Error('"staticDir" or "server" must exist!')
  }
  const applyCompress = compress()

  const { render } = new Renderer({
    staticDir,
    server,
    ...rendererConfig
  })

  return async (ctx, next) => {
    if (
      /\.html$/.test(ctx.request.url) ||
      !/text\/html/.test(ctx.header.accept)
      // /\..*$/.test(ctx.request.url)
    ) {
      return redirect(ctx, next)
    } else {
      let times
      if (log) {
        times = ++count

        console.time(`[${times}] "${ctx.request.url}" rendered after`)
      }

      try {
        const html = await render(ctx.request.url)

        ctx.body = html
        return applyCompress(ctx, next)
      } catch (err) {
        console.error('[prerender error]', err)
        return redirect(ctx, next)
      } finally {
        if (log) {
          console.timeEnd(`[${times}] "${ctx.request.url}" rendered after`)
        }
      }
    }
  }
}
