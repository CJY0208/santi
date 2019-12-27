const { resolve } = require('path')
const send = require('koa-send')

function koaStatic(root, opts) {
  opts.root = resolve(root)
  if (opts.index !== false) opts.index = opts.index || 'index.html'

  return async function serve(ctx, next) {
    let done = false

    if (ctx.method === 'HEAD' || ctx.method === 'GET') {
      try {
        done = await send(ctx, ctx.path, opts)
      } catch (err) {
        throw err
      }
    }

    if (!done) {
      await next()
    }
  }
}

module.exports = koaStatic
