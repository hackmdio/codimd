var baseConfig = require('./webpackBaseConfig');
var webpack = require('webpack');
var ExtractTextPlugin = require("extract-text-webpack-plugin");
var path = require('path');
var HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = Object.assign({}, baseConfig, {
    plugins: [
        new webpack.ProvidePlugin({
            Visibility: "visibilityjs",
            Cookies: "js-cookie",
            emojify: "emojify.js",
            key: "keymaster",
            $: "jquery",
            jQuery: "jquery",
            "window.jQuery": "jquery",
            "moment": "moment",
            "Handlebars": "handlebars"
        }),
        new ExtractTextPlugin("[name].css"),
        new webpack.optimize.CommonsChunkPlugin({
            names: ["vendor", "public", "slide", "locale"],
            children: true,
            async: true,
            filename: '[name].js',
            minChunks: Infinity
        }),
        new HtmlWebpackPlugin({
            template: 'public/views/includes/header.ejs',
            chunks: ['vendor', 'index'],
            filename: path.join(__dirname, 'public/views/build/index-header.ejs'),
            inject: false
        }),
        new HtmlWebpackPlugin({
            template: 'public/views/includes/scripts.ejs',
            chunks: ['vendor', 'index'],
            filename: path.join(__dirname, 'public/views/build/index-scripts.ejs'),
            inject: false
        }),
        new HtmlWebpackPlugin({
            template: 'public/views/includes/header.ejs',
            chunks: ['vendor', 'locale'],
            filename: path.join(__dirname, 'public/views/build/cover-header.ejs'),
            inject: false
        }),
        new HtmlWebpackPlugin({
            template: 'public/views/includes/scripts.ejs',
            chunks: ['vendor', 'locale'],
            filename: path.join(__dirname, 'public/views/build/cover-scripts.ejs'),
            inject: false
        }),
        new HtmlWebpackPlugin({
            template: 'public/views/includes/header.ejs',
            chunks: ['vendor', 'public'],
            filename: path.join(__dirname, 'public/views/build/pretty-header.ejs'),
            inject: false
        }),
        new HtmlWebpackPlugin({
            template: 'public/views/includes/scripts.ejs',
            chunks: ['vendor', 'public'],
            filename: path.join(__dirname, 'public/views/build/pretty-scripts.ejs'),
            inject: false
        }),
        new HtmlWebpackPlugin({
            template: 'public/views/includes/header.ejs',
            chunks: ['vendor', 'slide'],
            filename: path.join(__dirname, 'public/views/build/slide-header.ejs'),
            inject: false
        }),
        new HtmlWebpackPlugin({
            template: 'public/views/includes/scripts.ejs',
            chunks: ['vendor', 'slide'],
            filename: path.join(__dirname, 'public/views/build/slide-scripts.ejs'),
            inject: false
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
            mangle: false,
            sourceMap: false
        })
    ],

    output: {
        path: path.join(__dirname, 'public/build'),
        publicPath: '/build/',
        filename: '[id].[name].[hash].js'
    },
});
