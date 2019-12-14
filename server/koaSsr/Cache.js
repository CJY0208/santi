const DEFAULT_CACHE_CONFIG = {
  useCache: false,
  removeAfterTimeout: -1
}

class Cache {
  constructor(config = DEFAULT_CACHE_CONFIG) {
    this.config = {
      ...DEFAULT_CACHE_CONFIG,
      ...config
    }
    this.cache = {}
  }

  save(key, result) {
    if (!this.config.useCache) {
      return
    }

    this.cache[key] = result

    if (this.config.removeAfterTimeout > 0) {
      setTimeout(() => {
        this.remove(key)
      }, this.config.removeAfterTimeout)
    }
  }

  get(key) {
    if (!this.config.useCache) {
      return
    }
    return this.cache[key]
  }

  remove(key) {
    if (!this.config.useCache) {
      return
    }
    delete this.cache[key]
  }
}

module.exports = Cache
