import { isArray, isPromiseLike } from './base/is'

export const nextTick = func => Promise.resolve().then(func)

export const delay = time => new Promise(resolve => setTimeout(resolve, time))

/**
 * [防抖]
 * @param {Function} func 执行函数
 * @param {Number} wait 多少毫秒后运行一次
 */
export const debounce = (func, wait = 16) => {
  let timeout

  return function(...args) {
    clearTimeout(timeout)

    timeout = setTimeout(() => {
      func.apply(this, args)
    }, wait)

    return timeout
  }
}

/**
 * [用来智能处理Promise类型返回值]
 * 当值生成过程为 promise 时，将得到 promise 类型返回值，按约定 resolve 最终值
 * 当过程不为 promise 时将直接得到值
 * @param {Function} executor 执行过程获取
 * @param {Function} valuer 值处理过程
 */
export const promiseGuess = (executor, valuer) =>
  function(...args) {
    let value = executor.apply(this, args)

    return isPromiseLike(value)
      ? new Promise(resolve =>
          value
            .then(value => resolve(valuer.call(this, null, value, ...args)))
            .catch(err => resolve(valuer.call(this, err, undefined, ...args)))
        )
      : valuer.call(this, null, value, ...args)
  }

export function getKey2Id() {
  let uuid = 0
  const map = new Map()

  // 对每种 NodeType 做编号处理
  return function key2Id(key) {
    let id = map.get(key)

    if (!id) {
      id = (++uuid).toString(32)
      map.set(key, id)
    }

    return id
  }
}
