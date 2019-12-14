const Koa = require('koa')

const ssr = require('../koaSsr')

class Server {
  constructor(config) {
    const app = new Koa()

    app.use(ssr(config))

    this.app = app
  }

  listen(port, ...args) {
    this.app.listen(port, ...args)
  }
}

module.exports = Server
