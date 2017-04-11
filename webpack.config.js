var baseConfig = require('./webpackBaseConfig')
var ExtractTextPlugin = require('extract-text-webpack-plugin')
var path = require('path')

module.exports = [Object.assign({}, baseConfig, {
  plugins: baseConfig.plugins.concat([
    new ExtractTextPlugin('[name].css')
  ]),
  devtool: 'source-map'
}), {
  devtool: 'source-map',
  entry: {
    htmlExport: path.join(__dirname, 'public/js/htmlExport.js')
  },
  module: {
    loaders: [{
      test: /\.css$/,
      loader: ExtractTextPlugin.extract('style-loader', 'css-loader')
    }, {
      test: /\.scss$/,
      loader: ExtractTextPlugin.extract('style-loader', 'sass-loader')
    }, {
      test: /\.less$/,
      loader: ExtractTextPlugin.extract('style-loader', 'less-loader')
    }]
  },
  output: {
    path: path.join(__dirname, 'public/build'),
    publicPath: '/build/',
    filename: '[name].js'
  },
  plugins: [
    new ExtractTextPlugin('html.min.css')
  ]
}]
