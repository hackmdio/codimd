const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const path = require('path')

module.exports = {
  name: 'save-as-html',
  entry: {
    htmlExport: path.join(__dirname, 'public/js/htmlExport.js')
  },
  module: {
    rules: [{
      test: /\.css$/,
      use: [MiniCssExtractPlugin.loader, 'css-loader']
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
}
