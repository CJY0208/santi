const { getPort } = require('../../server')

function run() {
  process.env.PORT = getPort(3000)  
  process.argv[2] = 'start'

  require('react-app-rewired/bin')
}

module.exports = run
