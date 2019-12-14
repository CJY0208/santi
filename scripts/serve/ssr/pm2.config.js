const path = require('path')
const os = require('os')

const clamp = (value, min, max = Number.MAX_VALUE) => {
  if (value < min) {
    return min
  }

  if (value > max) {
    return max
  }

  return value
}

const osCPUCount = os.cpus().length
const instances = clamp(osCPUCount, 1, osCPUCount - 2)

module.exports = {
  apps: [
    {
      name: 'ssr',
      script: path.resolve(__dirname, './index.js'),
      instances,
      exec_mode: 'cluster',
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
}
