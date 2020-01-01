const httpProxy = require('koa-server-http-proxy')
const compress = require('koa-compress')
const LRU = require('lru-cache') // https://github.com/isaacs/node-lru-cache
const qs = require('qs') // https://github.com/ljharb/qs
const micromatch = require('micromatch') // https://github.com/micromatch/micromatch

const Renderer = require('./Renderer')
const {
  isArray,
  isUndefined,
  isFunction,
  isNumber,
  isObject,
  isString,
  isPromiseLike
} = require('../helpers/base/is')
const koaFallbackStatic = require('../koaFallbackStatic')

const renderTaskMap = new Map()
const defaultCacheMap = new LRU()
const defaultCacheEngine = {
  get: key => defaultCacheMap.get(key),
  set: (key, value, maxAge) => {
    if (isObject(maxAge)) {
      maxAge = maxAge.maxAge
    }

    if (isNumber(maxAge) && maxAge > 0) {
      defaultCacheMap.set(key, value, maxAge)
    } else {
      defaultCacheMap.set(key, value)
    }
  }
}

module.exports = function ssr({
  devMode = false,
  staticDir,
  server,
  log: useLog = true,
  renderConfig: renderConfigTable = [],
  cacheEngine = defaultCacheEngine,
  ...rendererConfig
} = {}) {
  let count = 0

  const redirect = staticDir
    ? koaFallbackStatic(staticDir, {
        maxAge: 365 * 24 * 60 * 60 * 1000,
        immutable: true,

        // 需要存在 .gz 文件时才能生效
        // https://github.com/koajs/send/blob/5.0.0/index.js#L80
        gzip: true,
        fallback: '__root.html'
      })
    : server
    ? httpProxy({
        target: server,
        onProxyReq: (proxyReq, req, res) => {
          proxyReq.setHeader('x-ssr-redirect', true)
        }
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

  const log = useLog
    ? (...args) => {
        console.log(...args)
      }
    : () => null

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
    if (useLog) {
      times = ++count

      console.time(`[${times}] "${ctx.request.url}" finished after`)
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

    const getRenderConfigEntries = renderConfigTable.find(([key]) =>
      micromatch.isMatch(ctx.request.url, key)
    )
    const getRenderConfig = !!getRenderConfigEntries
      ? getRenderConfigEntries[1]
      : undefined
    const renderConfig = isFunction(getRenderConfig)
      ? getRenderConfig(__REQUEST__)
      : getRenderConfig

    const useSsr =
      isUndefined(renderConfig) ||
      isUndefined(renderConfig.ssr) ||
      !!renderConfig.ssr
    const { key } = renderConfig || {}

    if (useLog) {
      if (isArray(getRenderConfigEntries) && getRenderConfigEntries[0]) {
        log(
          `[${times}] "${
            ctx.request.url
          }" matched render config: ${JSON.stringify(
            getRenderConfigEntries[0]
          )}`
        )
      } else {
        log(`[${times}] "${ctx.request.url}" match no any render config`)
      }
    }

    try {
      if (useSsr && isUndefined(key)) {
        const html = await render(ctx.request.url, {
          cookie: ctx.request.headers.cookie,
          inject: {
            __REQUEST__
          }
        })

        log(`[${times}] "${ctx.request.url}" no render config, forced rendered`)
        ctx.body = html
        return applyCompress(ctx, next)
      }

      if (!useSsr) {
        log(
          `[${times}] "${ctx.request.url}" don't use ssr, return static entry`
        )
        return redirect(ctx, next)
      }

      const cacheConfig =
        renderConfig.cache === true ? {} : renderConfig.cache || {}

      const useCache =
        !!renderConfig.cache && !cacheConfig.forceUpdate && !devMode

      const cache = useCache ? await cacheEngine.get(key) : undefined

      if (isString(cache)) {
        ctx.body = cache
        log(`[${times}] "${ctx.request.url}" from cache with key: ${key}`)
        return applyCompress(ctx, next)
      }

      let renderTask = renderTaskMap.get(key)

      if (isPromiseLike(renderTask)) {
        const htmlContent = await renderTask

        ctx.body = htmlContent
        log(
          `[${times}] "${ctx.request.url}" from exist render task with key: ${key}`
        )
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

      renderTaskMap.set(key, renderTask)

      const htmlContent = await renderTask

      renderTaskMap.delete(key)

      if (useCache) {
        await cacheEngine.set(key, htmlContent, cacheConfig.maxAge)
      }

      ctx.body = htmlContent
      log(`[${times}] "${ctx.request.url}" render with key: ${key}`)
      return applyCompress(ctx, next)
    } catch (err) {
      console.error(`[${times}] ssr error!`, err)
      return redirect(ctx, next)
    } finally {
      if (useLog) {
        console.timeEnd(`[${times}] "${ctx.request.url}" finished after`)
      }
    }
  }
}
