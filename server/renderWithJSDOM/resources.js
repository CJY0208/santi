const jsdom = require('jsdom')

const { ResourceLoader } = jsdom

class CustomResourceLoader extends ResourceLoader {
  constructor() {
    super()
    this.cache = {}
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

module.exports = new CustomResourceLoader()
