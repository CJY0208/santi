const { getConfig, getPort } = require('../../server')

function run(runConfig = {}) {
  const cwd = process.cwd()
  const { port = getPort(3000), mode, ...config } = {
    ...getConfig(cwd),
    ...runConfig
  }

  const run = require(`./${mode}`)

  run(config, port)
}

module.exports = run
