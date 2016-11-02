var baseConfig = require('./webpackBaseConfig');
var webpack = require('webpack');
var path = require('path');
var ExtractTextPlugin = require("extract-text-webpack-plugin");

module.exports = Object.assign({}, baseConfig, {
    plugins: baseConfig.plugins.concat([
        new webpack.DefinePlugin({
            'process.env': {
                'NODE_ENV': JSON.stringify('production')
            }
        }),
        new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: false
            },
            mangle: false,
            sourceMap: false
        }),
        new ExtractTextPlugin("[name].[hash].css")
    ]),

    output: {
        path: path.join(__dirname, 'public/build'),
        publicPath: '/build/',
        filename: '[id].[name].[hash].js'
    }
});
