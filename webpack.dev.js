var baseConfig = require('./webpack.common')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
var path = require('path')

module.exports = [Object.assign({}, baseConfig, {
  plugins: baseConfig.plugins.concat([
    new MiniCssExtractPlugin({
      filename: '[name].css',
      chunkFilename: '[id].css'
    })

  ]),
  devtool: 'source-map'
}), {
  devtool: 'source-map',
  entry: {
    htmlExport: path.join(__dirname, 'public/js/htmlExport.js')
  },
  module: {
    rules: [{
      test: /\.css$/,
      use: ['style-loader', 'css-loader']
    }, {
      test: /\.scss$/,
      use: ['style-loader', 'sass-loader']
    }, {
      test: /\.less$/,
      use: ['style-loader', 'less-loader']
    }]
  },
  output: {
    path: path.join(__dirname, 'public/build'),
    publicPath: '/build/',
    filename: '[name].js'
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'html.min.css'
    })
  ]
}]
