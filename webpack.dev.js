const common = require('./webpack.common.js')
const htmlexport = require('./webpack.htmlexport')
const { merge } = require('webpack-merge')

module.exports = [
  // merge common config
  merge(common, {
    mode: 'development',
    devtool: 'eval-cheap-module-source-map'
  }),
  merge(htmlexport, {
    mode: 'development',
    devtool: 'eval-cheap-module-source-map'
  })]
