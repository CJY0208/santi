const compression = require('compression')
const express = require('express')
const httpProxy = require('http-proxy-middleware')

const { getConfig, paths } = require('../../../server')


const EXPRESS_DEFAULT = {
  compress: {},
  static: {}
}

function runExpress(config = EXPRESS_DEFAULT, port) {
  const { proxy: configProxy } = getConfig()

  const app = express()

  app.use(compression()) // gzip 压缩

  Object.entries(configProxy).forEach(([key, proxy]) => {
    app.use(key, httpProxy(proxy))
  })

  app.use(
    express.static(paths.appBuild, {
      extensions: ['html']
    })
  )

  app.listen(port, () => {
    console.log(`[SPA] Express server listening on port ${port}`)
  })
}

module.exports = runExpress
