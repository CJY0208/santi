// 值类型判断 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
const isUndefined = val => typeof val === 'undefined'
exports.isUndefined = isUndefined

const isNull = val => val === null
exports.isNull = isNull

const isFunction = val => typeof val === 'function'
exports.isFunction = isFunction

const isArray = val => val instanceof Array
exports.isArray = isArray

const __error__type = [
  'Error',
  'EvalError',
  'RangeError',
  'ReferenceError',
  'SyntaxError',
  'TypeError',
  'URIError'
]
  .map(key => global[key])
  .filter(type => !isUndefined(type))
const isError = val => __error__type.some(type => val instanceof type)
exports.isError = isError

const isObject = val =>
  typeof val === 'object' && !(isArray(val) || isNull(val))
exports.isObject = isObject

const isBoolean = val => typeof val === 'boolean'
exports.isBoolean = isBoolean

const isString = val => typeof val === 'string'
exports.isString = isString

const isExist = val => !(isUndefined(val) || isNull(val))
exports.isExist = isExist

const isNaN = val => val !== val // eslint-disable-line
exports.isNaN = isNaN

const isNumber = val => typeof val === 'number' && !isNaN(val)
exports.isNumber = isNumber

const isDate = val => val instanceof Date
exports.isDate = isDate

const isPromiseLike = val => isExist(val) && isFunction(val.then)
exports.isPromiseLike = isPromiseLike
// 值类型判断 -------------------------------------------------------------
