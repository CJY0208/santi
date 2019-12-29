const Prerenderer = require('./Prerenderer')

const JSDOMPrerenderer = require('../JSDOMPrerenderer')
const renderWithJSDOM = require('../renderWithJSDOM')

const DEFAULT_RENDERER_CONFIG = {}

module.exports = class Renderer {
  constructor({ staticDir, server, proxy, ...rendererConfig }) {
    this.config = {
      ...DEFAULT_RENDERER_CONFIG,
      ...rendererConfig
    }

    if (staticDir) {
      const prerender = new Prerenderer({
        // Required - The path to the app to prerender. Should have an index.html and any other needed assets.
        staticDir,
        server: {
          proxy
        },
        // The plugin that actually renders the page.
        renderer: new JSDOMPrerenderer(this.config)
      })

      prerender.initialize()

      this.renderer = {
        render: (routeUrl, config = {}) =>
          prerender
            .renderRoutes([routeUrl], config)
            .then(([renderedRoute]) => renderedRoute.html.trim())
      }
    }

    if (server) {
      this.renderer = {
        render: (
          routeUrl,
          { cookie, inject = {}, timeout = this.config.renderAfterTimeout } = {}
        ) =>
          renderWithJSDOM(`${server}${routeUrl}`, {
            ...this.config,
            renderAfterTimeout: timeout,
            cookie,
            inject: {
              ...(inject || {}),
              ...(this.config.inject || {})
            }
          })
      }
    }

    this.render = this.render.bind(this)
  }

  render(routeUrl, ...rest) {
    return this.renderer.render(routeUrl, ...rest)
  }

  // TODO: 待实现
  inject() {
    // ...
  }
}
