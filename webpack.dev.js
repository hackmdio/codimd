const common = require('./webpack.common.js')
const htmlexport = require('./webpack.htmlexport')
const merge = require('webpack-merge')

module.exports = [
  // merge common config
  merge(common, {
    mode: 'development',
    devtool: 'cheap-module-eval-source-map'
  }),
  merge(htmlexport, {
    mode: 'development',
    devtool: 'cheap-module-eval-source-map'
  })]
