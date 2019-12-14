// build 下默认关闭 sourcemap 功能
process.env.GENERATE_SOURCEMAP = process.env.GENERATE_SOURCEMAP || false
process.argv[2] = 'build'

require('react-app-rewired/bin')
