const { argv } = require('yargs')

function getPort(defaultPort = 3000) {
  const port = argv.port ? Number(argv.port) : process.env.PORT || defaultPort

  return port
}

module.exports = getPort
