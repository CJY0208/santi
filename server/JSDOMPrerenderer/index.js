// 由于官方 renderer-jsdom 未开启对 link 标签的异步加载功能，导致 webpack import() 无法 resolve，预渲染功能不正常
// 该库长期不维护故 fork 至此修复
// Fork from https://github.com/JoshTheDerf/prerenderer/blob/master/renderers/renderer-jsdom/es6/renderer.js

const promiseLimit = require('promise-limit')
const renderWithJSDOM = require('../renderWithJSDOM')

const DEFAULT_CONFIG = {
  maxConcurrentRoutes: 0
}

class JSDOMPrerenderer {
  constructor(config = DEFAULT_CONFIG) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config
    }
  }

  async initialize() {
    // NOOP
    return Promise.resolve()
  }

  renderRoutes(routes, Prerenderer) {
    const rootOptions = Prerenderer.getOptions()

    const limiter = promiseLimit(this.config.maxConcurrentRoutes)

    const results = Promise.all(
      routes.map(route =>
        limiter(() =>
          renderWithJSDOM(
            `http://127.0.0.1:${rootOptions.server.port}${route}`,
            this.config
          ).then(html => ({
            originalRoute: route,
            route: route,
            html
          }))
        )
      )
    ).catch(e => {
      console.error('[renderRoutes error]', e)
      return Promise.reject(e)
    })

    return results
  }

  destroy() {
    // NOOP
  }
}

module.exports = JSDOMPrerenderer
