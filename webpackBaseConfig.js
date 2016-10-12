var webpack = require('webpack');
var path = require('path');
var ExtractTextPlugin = require("extract-text-webpack-plugin");

module.exports = {
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
        })
    ],

    entry: {
        index: path.join(__dirname, 'public/js/index.js'),
        public: path.join(__dirname, 'public/js/public.js'),
        slide: path.join(__dirname, 'public/js/slide.js'),
        locale: path.join(__dirname, 'public/js/locale.js'),
        vendor: [
            "expose?$!expose?jQuery!jquery",
            "jquery-mousewheel",
            "jquery-scrollspy/jquery-scrollspy",
            "jquery-ui/ui/widgets/resizable",
            "jquery-ui/ui/widgets/tooltip",
            "jquery-ui/ui/widgets/controlgroup",
            "jquery-ui/ui/widgets/autocomplete",
            "expose?LZString!lz-string",
            "expose?filterXSS!xss",
            "js-url",
            "bootstrap",
            "expose?Spinner!spin.js",
            "script!Idle.Js",
            "expose?Viz!viz.js",
            "expose?ListPagination!list.pagination.js/dist/list.pagination.js",
            path.join(__dirname, 'public/vendor/codemirror/codemirror.min.js'),
            path.join(__dirname, 'public/vendor/select2/select2.min.js'),
            path.join(__dirname, 'public/vendor/inlineAttachment/inline-attachment.js'),
            path.join(__dirname, 'public/vendor/jquery-textcomplete/jquery-textcomplete.js'),
            path.join(__dirname, 'public/vendor/codemirror-spell-checker/spell-checker.min.js'),
            path.join(__dirname, 'public/vendor/inlineAttachment/codemirror.inline-attachment.js'),
            path.join(__dirname, 'public/vendor/ot/ot.min.js')
        ]
    },

    output: {
        path: path.join(__dirname, 'public/build'),
        publicPath: '/build/',
        filename: '[name].js'
    },

    resolve: {
        root: [
            path.resolve(__dirname, 'src'),
            path.resolve(__dirname, 'node_modules')
        ],
        extensions: ["", ".js"]
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
        }, {
            test: /\.js/,
            loader: "script-loader",
            include: [
                path.join(__dirname, 'public/vendor/codemirror/codemirror.min.js'),
                path.join(__dirname, 'public/vendor/inlineAttachment/inline-attachment.js'),
                path.join(__dirname, 'public/vendor/jquery-textcomplete/jquery-textcomplete.js'),
                path.join(__dirname, 'public/vendor/select2/select2.min.js'),
                path.join(__dirname, 'public/vendor/inlineAttachment/codemirror.inline-attachment.js'),
                path.join(__dirname, 'public/vendor/codemirror-spell-checker/spell-checker.min.js'),
                path.join(__dirname, 'public/vendor/ot/ot.min.js')
            ]
        }]
    },

    node: {
        fs: "empty"
    }
};
