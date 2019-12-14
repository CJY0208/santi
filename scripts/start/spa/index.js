const Koa = require('koa')
const serve = require('koa-static')
const compress = require('koa-compress')

const { paths } = require('../../../server')

const DEFAULT = {
  compress: {
    threshold: 4096
  },
  static: {
    maxAge: 365 * 24 * 60 * 60 * 1000,
    immutable: true,

    // 需要存在 .gz 文件时才能生效
    // https://github.com/koajs/send/blob/5.0.0/index.js#L80
    gzip: true
  }
}

function run(config = DEFAULT, port) {
  const app = new Koa()

  app.use(compress(config.compress))
  app.use(serve(paths.appBuild, config.static))

  app.listen(port, () => {
    console.log(`listening on port ${port}`)
  })
}

module.exports = run
