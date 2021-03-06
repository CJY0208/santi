// 值类型判断 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
export const isUndefined = val => typeof val === 'undefined'

export const isNull = val => val === null

export const isFunction = val => typeof val === 'function'

export const isArray = val =>
  isFunction(Array.isArray) ? Array.isArray(val) : val instanceof Array

export const isRegExp = val => val instanceof RegExp

export const isObject = val =>
  typeof val === 'object' && !(isArray(val) || isNull(val))

export const isBoolean = val => typeof val === 'boolean'

export const isString = val => typeof val === 'string'

export const isExist = val => !(isUndefined(val) || isNull(val))

export const isNaN = val =>
  isFunction(Number.isNaN) ? Number.isNaN(val) : val !== val // eslint-disable-line

export const isNumber = val => typeof val === 'number' && !isNaN(val)

export const isPromiseLike = val => isExist(val) && isFunction(val.then)
// 值类型判断 -------------------------------------------------------------
