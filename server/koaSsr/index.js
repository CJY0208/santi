const serve = require('koa-static')
const proxy = require('koa-proxy')
const compress = require('koa-compress')
const qs = require('qs')

const Renderer = require('./Renderer')

const cacheMap = new Map()
const renderTaskMap = new Map()

module.exports = function ssr({
  staticDir,
  server,
  log = true,
  renderConfig: renderConfigTable = {},
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
    // 不处理非 html 或 .html 结尾的请求
    if (
      /\.html$/.test(ctx.request.url) ||
      !/text\/html/.test(ctx.header.accept)
      // /\..*$/.test(ctx.request.url)
    ) {
      return redirect(ctx, next)
    }

    let times
    if (log) {
      times = ++count

      console.time(`[${times}] "${ctx.request.url}" rendered after`)
    }

    const __REQUEST__ = {
      href: ctx.request.href,
      url: ctx.request.url,
      path: ctx.request.path,
      query: ctx.request.query,
      cookie: qs.parse(ctx.request.headers.cookie, { delimiter: '; ' }),
      headers: ctx.request.headers,
      URL: ctx.request.URL
    }

    const getRenderConfig = renderConfigTable[ctx.request.path]
    const renderConfig =
      typeof getRenderConfig === 'function'
        ? getRenderConfig(__REQUEST__)
        : getRenderConfig || null

    try {
      if (!renderConfig) {
        const html = await render(ctx.request.url, {
          cookie: ctx.request.headers.cookie,
          inject: {
            __REQUEST__
          }
        })

        ctx.body = html
        return applyCompress(ctx, next)
      }

      const useCache = !!renderConfig.cache
      const cacheConfig =
        renderConfig.cache === true ? {} : renderConfig.cache || {}

      if (useCache) {
        const cache = !cacheConfig.forceUpdate
          ? cacheMap.get(renderConfig.key)
          : null

        if (cache) {
          ctx.body = cache
          return applyCompress(ctx, next)
        }
      }

      let renderTask = renderTaskMap.get(renderConfig.key)

      if (renderTask) {
        const html = await renderTask

        ctx.body = html
        return applyCompress(ctx, next)
      }

      renderTask = render(ctx.request.url, {
        timeout: renderConfig.timeout,
        cookie: ctx.request.headers.cookie,
        inject: {
          __REQUEST__,
          ...(renderConfig.inject || {})
        }
      })

      renderTaskMap.set(renderConfig.key)

      const html = await renderTask

      if (useCache) {
        cacheMap.set(renderConfig.key, html)

        if (typeof cacheConfig.maxAge === 'number' && cacheConfig.maxAge > 0) {
          setTimeout(() => {
            cacheMap.delete(renderConfig.key)
          }, cacheConfig.maxAge)
        }
      }

      ctx.body = html
      return applyCompress(ctx, next)
    } catch (err) {
      console.error('[ssr error]', err)
      return redirect(ctx, next)
    } finally {
      if (log) {
        console.timeEnd(`[${times}] "${ctx.request.url}" rendered after`)
      }
    }
  }
}
