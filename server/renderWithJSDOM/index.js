const jsdom = require('jsdom')

const resources = require('./resources')
const getPageContent = require('./getPageContent')

const { JSDOM } = jsdom

const DEFAULT_CONFIG = {
  inject: {},
  localStaticOnly: true,
  useResourceCache: true
}

const renderWithJSDOM = async (url, config = {}) => {
  const options = {
    ...DEFAULT_CONFIG,
    ...config
  }

  resources.localStaticOnly = options.localStaticOnly
  resources.useCache = options.useResourceCache

  try {
    const dom = await JSDOM.fromURL(url, {
      pretendToBeVisual: true, // fake rAF
      runScripts: 'dangerously',
      resources,
      referrer: 'https://jsdom.ssr.org/'
    })

    const { window } = dom

    // Injection / shimming must happen before we resolve with the window,
    // otherwise the page will finish loading before the injection happens.
    if (Object.keys(options.inject).length > 0) {
      Object.entries(options.inject).forEach(([key, value]) => {
        window[key] = value
      })
    }

    window.addEventListener('error', event => {
      console.error(event.error)
    })

    // shim
    window.SVGElement = window.HTMLElement

    const content = await getPageContent(dom, options)

    return content
  } catch (error) {
    console.log('[JSDOM error]', error)
    return Promise.reject(error)
  }
}

module.exports = renderWithJSDOM
