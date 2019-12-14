const fs = require('fs')
const path = require('path')

const DEFAULT = {
  mode: 'ssr',
  webpack: [],
  devServer: []
}

module.exports = function getConfig(cwd = process.cwd()) {
  let config
  if (fs.existsSync(path.join(cwd, './santi.config.js'))) {
    config = require(path.join(cwd, './santi.config.js'))
  }
  return {
    ...DEFAULT,
    ...config
  }
}
