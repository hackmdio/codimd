var baseConfig = require('./webpackBaseConfig')
var webpack = require('webpack')
var path = require('path')
var ExtractTextPlugin = require('extract-text-webpack-plugin')
var OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin')
var ParallelUglifyPlugin = require('webpack-parallel-uglify-plugin')

module.exports = [Object.assign({}, baseConfig, {
  plugins: baseConfig.plugins.concat([
    new webpack.DefinePlugin({
      'process.env': {
        'NODE_ENV': JSON.stringify('production')
      }
    }),
    new ParallelUglifyPlugin({
      uglifyJS: {
        compress: {
          warnings: false
        },
        output: {
          max_line_len: 1000000
        },
        mangle: false,
        sourceMap: false
      }
    }),
    new ExtractTextPlugin('[name].[hash].css')
  ]),

  output: {
    path: path.join(__dirname, 'public/build'),
    publicPath: '/build/',
    filename: '[id].[name].[hash].js',
    baseUrl: '<%- url %>'
  }
}), {
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
    new webpack.DefinePlugin({
      'process.env': {
        'NODE_ENV': JSON.stringify('production')
      }
    }),
    new ExtractTextPlugin('html.min.css'),
    new OptimizeCssAssetsPlugin()
  ]
}]
