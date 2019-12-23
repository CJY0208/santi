const httpProxy = require('http-proxy-middleware')

const { devSsr, getConfig } = require('../../server')

const { ssr, mode, proxy: proxyTable } = getConfig()

const addDevProxy = () => config => {
  const originBefore = config.before

  config.before = (app, server) => {
    // SSR DEV 模式下增加 html 渲染代理
    if (mode === 'ssr') {
      app.use(
        devSsr({
          ...ssr,
          logError: false,
          renderAfterTimeout: ssr.timeout || 1000
        })
      )
    }

    // SSR DEV 模式下增加 proxyTable 代理
    Object.entries(proxyTable).forEach(([key, proxy]) => {
      app.use(key, httpProxy(proxy))
    })

    originBefore.call(config, app, server)
  }
  return config
}

module.exports = addDevProxy
