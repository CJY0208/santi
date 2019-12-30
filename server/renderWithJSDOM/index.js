const jsdom = require('jsdom')

const CustomResourceLoader = require('./CustomResourceLoader')
const getPageContent = require('./getPageContent')

const { JSDOM, CookieJar } = jsdom

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

  const resources = options.useResourceCache
    ? CustomResourceLoader.defaultResources
    : new CustomResourceLoader()

  resources.localStaticOnly = options.localStaticOnly

  try {
    let cookieJar

    if (config.cookie instanceof CookieJar) {
      cookieJar = config.cookie
    }

    if (typeof config.cookie === 'string') {
      cookieJar = new CookieJar()
      config.cookie.split('; ').forEach(cookie => {
        cookieJar.setCookieSync(cookie, url)
      })
    }

    const dom = await JSDOM.fromURL(url, {
      resources,
      cookieJar,
      pretendToBeVisual: true, // fake rAF
      runScripts: 'dangerously',
      referrer: 'jsdom://engine/'
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

    const content = await getPageContent(dom, options, resources)

    return content
  } catch (error) {
    console.log('[JSDOM error]', error)
    return Promise.reject(error)
  }
}

module.exports = renderWithJSDOM
