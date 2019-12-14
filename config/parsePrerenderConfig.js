function parseConfig(config) {
  if (Array.isArray(config)) {
    return {
      usePrerender: config.length > 0,
      prerenderRoutes: config,
      rendererConfig: {}
    }
  }

  if (typeof config === 'object') {
    const { routes, ...rendererConfig } = config

    return {
      usePrerender: routes.length > 0,
      prerenderRoutes: routes,
      rendererConfig
    }
  }

  return {
    usePrerender: false,
    prerenderRoutes: [],
    rendererConfig: {}
  }
}

module.exports = parseConfig
