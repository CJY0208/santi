const Prerenderer = require('@prerenderer/prerenderer')

const JSDOMPrerenderer = require('../JSDOMPrerenderer')
const renderWithJSDOM = require('../renderWithJSDOM')
const Cache = require('./Cache')

const DEFAULT_RENDERER_CONFIG = {}

module.exports = class Renderer {
  constructor({
    staticDir,
    server,
    useResultCache = false,
    resultCacheTimeout = -1,
    useTaskCache = false,
    taskCacheTimeout = -1,
    ...rendererConfig
  }) {
    this.config = {
      ...DEFAULT_RENDERER_CONFIG,
      ...rendererConfig
    }

    if (staticDir) {
      const prerender = new Prerenderer({
        // Required - The path to the app to prerender. Should have an index.html and any other needed assets.
        staticDir,
        // The plugin that actually renders the page.
        renderer: new JSDOMPrerenderer(this.config)
      })

      prerender.initialize()

      this.renderer = {
        render: routeUrl =>
          prerender
            .renderRoutes([routeUrl])
            .then(([renderedRoute]) => renderedRoute.html.trim())
      }
    }

    if (server) {
      this.renderer = {
        render: routeUrl => renderWithJSDOM(`${server}${routeUrl}`, this.config)
      }
    }

    this.tackCache = new Cache({
      useCache: useTaskCache,
      removeAfterTimeout: taskCacheTimeout
    })
    this.resultCache = new Cache({
      useCache: useResultCache,
      removeAfterTimeout: resultCacheTimeout
    })

    this.render = this.render.bind(this)
  }

  render(routeUrl) {
    const taskCache = this.tackCache.get(routeUrl)
    if (taskCache) {
      return taskCache
    }

    const resultCache = this.resultCache.get(routeUrl)
    if (resultCache) {
      return Promise.resolve(resultCache)
    }

    const task = new Promise((resolve, reject) => {
      this.renderer
        .render(routeUrl)
        .then(result => {
          this.resultCache.save(routeUrl, result)
          resolve(result)
        })
        .catch(err => {
          this.tackCache.remove(routeUrl)
          this.resultCache.remove(routeUrl)

          console.error('[render error]', err)
          reject(err)
        })
    })

    this.tackCache.save(routeUrl, task)

    return task
  }

  // TODO: 待实现
  inject() {
    // ...
  }
}
