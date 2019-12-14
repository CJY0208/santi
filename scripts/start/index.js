const { getConfig, getPort } = require('../../server')

function run(runConfig = {}) {
  const { port = getPort(3000), ...config } = runConfig

  const cwd = process.cwd()
  const { mode } = getConfig(cwd)

  const run = require(`./${mode}`)

  run(config, port)
}

module.exports = run
