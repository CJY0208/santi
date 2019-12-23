const jsdom = require('jsdom')

const { ResourceLoader } = jsdom

class CustomResourceLoader extends ResourceLoader {
  constructor({ useCache = false, localStaticOnly = false } = {}) {
    super()
    this.cache = {}
    this.useCache = useCache
    this.localStaticOnly = localStaticOnly
  }

  fetch(url, options) {
    if (this.useCache && this.cache[url]) {
      return this.cache[url]
    }

    let fetch =
      this.localStaticOnly && new URL(url).hostname !== '127.0.0.1'
        ? Object.assign(Promise.resolve(Buffer.from('')), {
            abort: () => null
          })
        : super.fetch(url, options)

    this.cache[url] = fetch
    return fetch
  }
}

const defaultResources = new CustomResourceLoader({
  useCache: true,
  localStaticOnly: true
})

CustomResourceLoader.defaultResources = defaultResources

module.exports = CustomResourceLoader
