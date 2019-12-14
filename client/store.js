import { run, isUndefined, promiseGuess, isExist } from './helpers'

const KEY = '__SSRDATA'

function inject() {
  let script = document.getElementById(KEY) || document.createElement('script')
  script.id = KEY
  script.innerHTML = `window.${KEY}={};`
  document.head.appendChild(script)
}

function bootstrap() {
  if (window.__SSR__) {
    inject()
  } else {
    if (isExist(document.getElementById(KEY))) {
      window.__SSRED__ = true
    }
  }
  const data = window[KEY] || {}

  function remove(key) {
    delete data[key]
  }

  function set(key, value) {
    if (!window.__SSR__) {
      return
    }
    data[key] = value
    document.getElementById(KEY).innerHTML = `window.${KEY}=${JSON.stringify(
      data
    )};`
  }

  function get(key) {
    let value = data[key]
    remove(key) // 初始值只在 html 就绪后使用一次，使用即销毁
    return value
  }

  return { set, get, remove }
}

const store = bootstrap()

export default {
  get: promiseGuess(
    (key, builder) => {
      let value

      if (!window.__SSR__) {
        value = store.get(key)
      }

      if (isUndefined(value)) {
        value = run(builder)
      }

      return value
    },
    (err, value, key) => {
      if (err) {
        store.remove(key)
        return [err, undefined]
      }

      if (window.__SSR__) {
        store.set(key, value)
      }

      return [null, value]
    }
  )
}
