const HtmlWebpackPlugin = require('html-webpack-plugin')

const modifyHtmlWebpackPlugin = pluginOpts => config => {
  config.plugins = config.plugins.filter(
    plugin => !(plugin instanceof HtmlWebpackPlugin)
  )

  config.plugins.push(new HtmlWebpackPlugin(pluginOpts))

  return config
}

module.exports = modifyHtmlWebpackPlugin
