const Prerenderer = require('@prerenderer/prerenderer')

class CustomPrerender extends Prerenderer {
  renderRoutes(routes, config = {}) {
    return (
      this._renderer
        .renderRoutes(routes, this, config)
        // Handle non-ASCII or invalid URL characters in routes by normalizing them back to unicode.
        // Some browser environments may change unicode or special characters in routes to percent encodings.
        // We need to convert them back for saving in the filesystem.
        .then(renderedRoutes => {
          renderedRoutes.forEach(rendered => {
            rendered.route = decodeURIComponent(rendered.route)
          })

          return renderedRoutes
        })
    )
  }
}

module.exports = CustomPrerender
