// 开发阶段使用
const httpProxy = require('http-proxy-middleware')
const portFinder = require('portfinder')

const Server = require('./Server')

const jsdomReg = /jsdom/

const proxy = ({ logError = true, ejectPortModifier, ...ssrConfig } = {}) => {
  let ssrProxy
  let port = process.env.PORT

  if (typeof ejectPortModifier === 'function') {
    ejectPortModifier((nextPort) => {
      port = nextPort
    })
  }

  const ssr = new Server({
    ...ssrConfig,
    devMode: true,
    log: true,
    server: () => `http://127.0.0.1:${port}`,
    renderAfterDocumentEvent: 'ssr-ready',
    deferHeadScripts: true,
    inlinePrimaryStyle: false,
    useResourceCache: false,
    inject: {
      __SSR__: true,
    },
  })

  const HTMLReg = /^text\/html/
  const isHTML = (accept) => HTMLReg.test(accept)

  const ssrFilter = (pathname, req) => {
    const {
      accept,
      'user-agent': userAgent,
      'x-ssr-redirect': isSsrRedirect,
    } = req.headers

    return isHTML(accept) && !jsdomReg.test(userAgent) && !isSsrRedirect
  }

  ssrFilter.toString = () => 'SSRServer'

  portFinder.getPortPromise().then((port) => {
    ssr.listen(port)

    ssrProxy = httpProxy(ssrFilter, {
      target: `http://127.0.0.1:${port}/`,
      secure: false,
    })
  })

  // 防止 SSR 中未知错误导致 dev 进程退出
  // Ref: https://cnodejs.org/topic/5576a30bc4e7fbea6e9a32ad
  process.on('uncaughtException', (err) => {
    if (logError) {
      console.error('[SSR Error]', err)
    }
  })

  return (req, res, next) => {
    if (ssrProxy) {
      return ssrProxy(req, res, next)
    } else {
      next()
    }
  }
}

module.exports = proxy
