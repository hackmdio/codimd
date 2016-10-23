var webpack = require('webpack');
var path = require('path');
var ExtractTextPlugin = require("extract-text-webpack-plugin");
var HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    plugins: [
        new webpack.ProvidePlugin({
            Visibility: "visibilityjs",
            Cookies: "js-cookie",
            key: "keymaster",
            $: "jquery",
            jQuery: "jquery",
            "window.jQuery": "jquery",
            "moment": "moment",
            "Handlebars": "handlebars"
        }),
        new ExtractTextPlugin("[name].css"),
        new webpack.optimize.CommonsChunkPlugin({
            names: ["cover", "index", "pretty", "slide", "vendor"],
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
            chunks: ['vendor', 'cover'],
            filename: path.join(__dirname, 'public/views/build/cover-header.ejs'),
            inject: false
        }),
        new HtmlWebpackPlugin({
            template: 'public/views/includes/scripts.ejs',
            chunks: ['vendor', 'cover'],
            filename: path.join(__dirname, 'public/views/build/cover-scripts.ejs'),
            inject: false
        }),
        new HtmlWebpackPlugin({
            template: 'public/views/includes/header.ejs',
            chunks: ['vendor', 'pretty'],
            filename: path.join(__dirname, 'public/views/build/pretty-header.ejs'),
            inject: false
        }),
        new HtmlWebpackPlugin({
            template: 'public/views/includes/scripts.ejs',
            chunks: ['vendor', 'pretty'],
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
        })
    ],

    entry: {
        cover: path.join(__dirname, 'public/js/cover.js'),
        index: path.join(__dirname, 'public/js/index.js'),
        pretty: path.join(__dirname, 'public/js/pretty.js'),
        slide: path.join(__dirname, 'public/js/slide.js'),
        vendor: [
            "imports?$=jquery!jquery-mousewheel",
            "expose?filterXSS!xss",
            "js-url",
            "expose?Spinner!spin.js",
            "script!Idle.Js",
            "expose?LZString!lz-string",
            "script!codemirror",
            "script!inlineAttachment",
            "script!jqueryTextcomplete",
            "script!codemirrorSpellChecker",
            "script!codemirrorInlineAttachment",
            "script!ot",
            "flowchart.js",
            "js-sequence-diagrams"
        ]
    },

    output: {
        path: path.join(__dirname, 'public/build'),
        publicPath: '/build/',
        filename: '[name].js'
    },

    resolve: {
        modulesDirectories: [
            path.resolve(__dirname, 'src'),
            path.resolve(__dirname, 'node_modules')
        ],
        extensions: ["", ".js"],
        alias: {
            codemirror: path.join(__dirname, 'public/vendor/codemirror/codemirror.min.js'),
            inlineAttachment: path.join(__dirname, 'public/vendor/inlineAttachment/inline-attachment.js'),
            jqueryTextcomplete: path.join(__dirname, 'public/vendor/jquery-textcomplete/jquery.textcomplete.js'),
            codemirrorSpellChecker: path.join(__dirname, 'public/vendor/codemirror-spell-checker/spell-checker.min.js'),
            codemirrorInlineAttachment: path.join(__dirname, 'public/vendor/inlineAttachment/codemirror.inline-attachment.js'),
            ot: path.join(__dirname, 'public/vendor/ot/ot.min.js')
        }
    },

    externals: {
        "viz.js": "Viz",
        "socket.io-client": "io",
        "lodash": "_",
        "jquery": "$",
        "moment": "moment",
        "handlebars": "Handlebars",
        "highlight.js": "hljs"
    },

    module: {
        loaders: [{
            test: /\.json$/,
            loader: 'json-loader'
        }, {
            test: /\.css$/,
            loader: ExtractTextPlugin.extract('style-loader', 'css-loader')
        }, {
            test: /\.scss$/,
            loader: ExtractTextPlugin.extract('style-loader', 'sass-loader')
        }, {
            test: /\.less$/,
            loader: ExtractTextPlugin.extract('style-loader', 'less-loader')
        }, {
            test: require.resolve("js-sequence-diagrams"),
            loader: "imports?Raphael=raphael"
        }, {
            test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
            loader: "file"
        }, {
            test: /\.(woff|woff2)$/,
            loader: "url?prefix=font/&limit=5000"
        }, {
            test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
            loader: "url?limit=10000&mimetype=application/octet-stream"
        }, {
            test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
            loader: "url?limit=10000&mimetype=image/svg+xml"
        }]
    },

    node: {
        fs: "empty"
    }
};
