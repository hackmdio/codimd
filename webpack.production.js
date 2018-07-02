var baseConfig = require('./webpackBaseConfig')
var webpack = require('webpack')
var path = require('path')
var ExtractTextPlugin = require('extract-text-webpack-plugin')
var OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

module.exports = [Object.assign({}, baseConfig, {
  plugins: baseConfig.plugins.concat([
    new webpack.DefinePlugin({
      'process.env': {
        'NODE_ENV': JSON.stringify('production')
      }
    })
  ]),

  optimization: {
    minimizer: [
      new UglifyJsPlugin({
        parallel: true,
        cache: true
      })
    ],
    splitChunks: {
      chunks: 'async',
      minChunks: Infinity
    }
  },

  output: {
    path: path.join(__dirname, 'public/build'),
    publicPath: '/build/',
    filename: '[id].[name].[hash].js'
    // baseUrl: '<%- url %>'
  }
}), {
  entry: {
    htmlExport: path.join(__dirname, 'public/js/htmlExport.js')
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
    new OptimizeCssAssetsPlugin(),
    new MiniCssExtractPlugin()
  ],
  module: {
    rules: [{
      test: /\.css$/,
      use: [
        MiniCssExtractPlugin.loader,
        'css-loader'
      ]
    }]
  }
}]
