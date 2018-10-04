var baseConfig = require('./webpackBaseConfig')
var webpack = require('webpack')
var path = require('path')
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

module.exports = [Object.assign({}, baseConfig, {
  plugins: baseConfig.plugins.concat([
    new webpack.DefinePlugin({
      'process.env': {
        'NODE_ENV': JSON.stringify('production')
      }
    }),
    new MiniCssExtractPlugin({
      filename: '[name].[hash].css',
      chunkFilename: '[id].css'
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
    filename: '[name].[hash].js'
    // baseUrl: '<%- url %>'
  },
  mode: 'production'
}), {
  // This Chunk is used in the 'save as html' feature.
  // It is embedded in the html file and contains CSS for styling.

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
    new MiniCssExtractPlugin({
      filename: 'html.min.css'
    })
  ],

  optimization: {
    minimizer: [
      new OptimizeCSSAssetsPlugin({})
    ]
  },

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
