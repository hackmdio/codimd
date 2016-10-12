var baseConfig = require('./webpackBaseConfig');
var webpack = require('webpack');
var ExtractTextPlugin = require("extract-text-webpack-plugin");

module.exports = Object.assign({}, baseConfig, {
    plugins: [
        new webpack.ProvidePlugin({
            '_': 'lodash',
            Visibility: "visibilityjs",
            Cookies: "js-cookie",
            emojify: "emojify.js",
            io: "socket.io-client",
            key: "keymaster"
        }),
        new ExtractTextPlugin("[name].css"),
        new webpack.optimize.CommonsChunkPlugin({
            name: ["vendor", "public", "slide", "locale"],
            async: true,
            filename: '[name].js',
            minChunks: Infinity
        }),
        new webpack.DefinePlugin({
            'process.env': {
                'NODE_ENV': JSON.stringify('production')
            }
        }),
        new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: false
            },
            sourceMap: false
        })
    ]
});
