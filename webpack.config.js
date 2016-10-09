var webpack = require('webpack');
var path = require('path');
var ExtractTextPlugin = require("extract-text-webpack-plugin");

module.exports = {
    plugins: [
        new webpack.ProvidePlugin({
            '_': 'lodash',
            jquery: "jquery",
            jQuery: "jquery",
            $: "jquery",
            "window.jQuery": "jquery",
            Visibility: "visibilityjs",
            Cookies: "js-cookie",
            emojify: "emojify.js",
            io: "socket.io-client",
            LZString: "lz-string",
            key: "keymaster",
            Viz: "viz.js"
        }),
        new webpack.DefinePlugin({
            "require.specified": "require.resolve"
        })
    ],

    entry: {
        app: path.join(__dirname, 'public/js/app.js')
    },

    output: {
        path: path.join(__dirname, 'public/build/js'),
        filename: '[name].js'
    },

    resolve: {
        root: [
            path.resolve(__dirname, 'src'),
            path.resolve(__dirname, 'node_modules')
        ],
        extensions: ["", ".js"],
        alias: {
            'jquery-ui': 'jquery-ui/ui/widgets'
        }
    },

    module: {
        loaders: [{
            test: /\.json$/,
            loader: 'json-loader'
        }, {
            test: /\.css$/,
            loader: 'style-loader!css-loader'
        }, , {
            test: /\.scss$/,
            loaders: ['style', 'css', 'sass']
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
