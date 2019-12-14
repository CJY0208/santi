'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./lib/client/index.min.js')
} else {
  module.exports = require('./lib/client/index.js')
}
