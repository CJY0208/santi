const httpProxy = require('http-proxy-middleware')
const { run } = require('szfe-tools')

const { devSsr, getConfig } = require('../../server')

const { ssr, mode, proxy: proxyTable } = getConfig()

const addDevProxy = ({ publicPath } = {}) => (config) => {
  const originBefore = config.before
  const originOnListening = config.onListening

  let modifyPort

  config.onListening = (server, ...rest) => {
    // 获取实际运行时 webpack dev server 监听的 port
    // https://webpack.js.org/configuration/dev-server/#devserveronlistening
    const port = server.listeningApp.address().port

    run(modifyPort, undefined, port)
    run(originOnListening, 'call', server, ...rest)
  }

  // https://github.com/facebook/create-react-app/blob/2da5517689/packages/react-scripts/config/webpackDevServer.config.js#L113
  config.before = (app, server) => {
    // SSR DEV 模式下增加 html 渲染代理
    if (mode === 'ssr') {
      app.use(
        devSsr({
          ...ssr,
          publicPath,
          logError: false,
          renderAfterTimeout: ssr.timeout || 1000,
          ejectPortModifier(modifier) {
            modifyPort = modifier
          },
        })
      )
    }

    // SSR DEV 模式下增加 proxyTable 代理
    Object.entries(proxyTable).forEach(([key, proxy]) => {
      app.use(key, httpProxy(proxy))
    })

    run(originBefore, 'call', config, app, server)
  }
  return config
}

module.exports = addDevProxy
