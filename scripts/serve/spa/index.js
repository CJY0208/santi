// const Koa = require('koa')
// const koaServe = require('koa-static')
// const koaCompress = require('koa-compress')
const compression = require('compression')
const express = require('express')
const httpProxy = require('http-proxy-middleware')

const { getConfig, paths } = require('../../../server')

// const KOA_DEFAULT = {
//   compress: {
//     threshold: 4096
//   },
//   static: {
//     maxAge: 365 * 24 * 60 * 60 * 1000,
//     immutable: true,

//     // 需要存在 .gz 文件时才能生效
//     // https://github.com/koajs/send/blob/5.0.0/index.js#L80
//     gzip: true
//   }
// }

// function runKoa(config = KOA_DEFAULT, port) {
//   const app = new Koa()

//   app.use(koaCompress(config.compress))
//   app.use(koaServe(paths.appBuild, config.static))

//   app.listen(port, () => {
//     console.log(`[SPA] Koa2 server listening on port ${port}`)
//   })
// }

const EXPRESS_DEFAULT = {
  compress: {},
  static: {}
}

function runExpress(config = EXPRESS_DEFAULT, port) {
  const { proxy: configProxy, staticDir = paths.appBuild } = {
    ...getConfig(),
    ...config
  }

  const app = express()

  app.use(compression()) // gzip 压缩

  Object.entries(configProxy).forEach(([key, proxy]) => {
    app.use(key, httpProxy(proxy))
  })

  app.use(
    express.static(staticDir, {
      extensions: ['html']
    })
  )

  app.listen(port, () => {
    console.log(`[SPA] Express server listening on port ${port}`)
  })
}

module.exports = runExpress
