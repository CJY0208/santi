const fs = require('fs')
const path = require('path')

const DEFAULT = {
  mode: 'ssr',
  prerender: false,
  ssr: {},
  webpack: [],
  devServer: []
}

const possibleConfigPaths = [
  './santi.config.js',
  './santi.config.ts',
  './.santirc.js',
  './.santirc.ts',
  './config/index.js',
  './config/index.ts'
]

module.exports = function getConfig(cwd = process.cwd()) {
  const configPath = possibleConfigPaths.find(configPath =>
    fs.existsSync(path.join(cwd, configPath))
  )
  const config = require(path.join(cwd, configPath))

  return {
    ...DEFAULT,
    ...config
  }
}
