// 开发阶段使用
const httpProxy = require('http-proxy-middleware')
const portFinder = require('portfinder')

const Server = require('./Server')

const jsdomReg = /jsdom/

const proxy = ({ logError = true, ejectPortModifier, ...ssrConfig } = {}) => {
  let ssrProxy
  let port = process.env.PORT
  const host = process.env.HOST || '127.0.0.1'

  if (typeof ejectPortModifier === 'function') {
    ejectPortModifier((nextPort) => {
      port = nextPort
    })
  }

  const ssr = new Server({
    ...ssrConfig,
    devMode: true,
    log: true,
    server: () => `http://${host}:${port}`,
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

  // 静态资源文件扩展名列表（不需要 SSR 处理）
  const staticResourceReg = /\.(pdf|jpg|jpeg|png|gif|svg|webp|ico|woff|woff2|ttf|eot|otf|mp4|webm|mp3|wav|zip|gz|tar|xml|json|css|js|map)$/i

  const ssrFilter = (pathname, req) => {
    const {
      accept,
      'user-agent': userAgent,
      'x-ssr-redirect': isSsrRedirect,
    } = req.headers

    // 如果是静态资源文件，不进行 SSR 处理
    if (staticResourceReg.test(pathname)) {
      return false
    }

    return isHTML(accept) && !jsdomReg.test(userAgent) && !isSsrRedirect
  }

  ssrFilter.toString = () => 'SSRServer'

  portFinder.getPortPromise().then((port) => {
    ssr.listen(port)

    ssrProxy = httpProxy(ssrFilter, {
      target: `http://${host}:${port}/`,
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
