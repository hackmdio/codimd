var webpack = require('webpack');
var path = require('path');
var ExtractTextPlugin = require("extract-text-webpack-plugin");
var HtmlWebpackPlugin = require('html-webpack-plugin');
var CopyWebpackPlugin = require('copy-webpack-plugin');

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
        new webpack.optimize.CommonsChunkPlugin({
            names: ["cover", "index", "pretty", "slide", "vendor"],
            children: true,
            async: true,
            filename: '[name].js',
            minChunks: Infinity
        }),
        new HtmlWebpackPlugin({
            template: 'public/views/includes/header.ejs',
            chunks: ['font', 'index-styles', 'index'],
            filename: path.join(__dirname, 'public/views/build/index-header.ejs'),
            inject: false
        }),
        new HtmlWebpackPlugin({
            template: 'public/views/includes/header.ejs',
            chunks: ['font-pack', 'index-styles-pack', 'index-styles', 'index'],
            filename: path.join(__dirname, 'public/views/build/index-pack-header.ejs'),
            inject: false
        }),
        new HtmlWebpackPlugin({
            template: 'public/views/includes/scripts.ejs',
            chunks: ['index'],
            filename: path.join(__dirname, 'public/views/build/index-scripts.ejs'),
            inject: false
        }),
        new HtmlWebpackPlugin({
            template: 'public/views/includes/scripts.ejs',
            chunks: ['common', 'index-pack'],
            filename: path.join(__dirname, 'public/views/build/index-pack-scripts.ejs'),
            inject: false
        }),
        new HtmlWebpackPlugin({
            template: 'public/views/includes/header.ejs',
            chunks: ['font', 'cover'],
            filename: path.join(__dirname, 'public/views/build/cover-header.ejs'),
            inject: false
        }),
        new HtmlWebpackPlugin({
            template: 'public/views/includes/header.ejs',
            chunks: ['font-pack', 'cover-styles-pack', 'cover'],
            filename: path.join(__dirname, 'public/views/build/cover-pack-header.ejs'),
            inject: false
        }),
        new HtmlWebpackPlugin({
            template: 'public/views/includes/scripts.ejs',
            chunks: ['cover'],
            filename: path.join(__dirname, 'public/views/build/cover-scripts.ejs'),
            inject: false
        }),
        new HtmlWebpackPlugin({
            template: 'public/views/includes/scripts.ejs',
            chunks: ['common', 'cover-pack'],
            filename: path.join(__dirname, 'public/views/build/cover-pack-scripts.ejs'),
            inject: false
        }),
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
        }),
        new HtmlWebpackPlugin({
            template: 'public/views/includes/scripts.ejs',
            chunks: ['common', 'slide-pack'],
            filename: path.join(__dirname, 'public/views/build/slide-pack-scripts.ejs'),
            inject: false
        }),
        new CopyWebpackPlugin([
            {
                context: path.join(__dirname, 'node_modules/mathjax'),
                from: {
                    glob: '**/*',
                    dot: false
                },
                to: 'MathJax/'
            },
            {
                context: path.join(__dirname, 'node_modules/emojify.js'),
                from: {
                    glob: '**/*',
                    dot: false
                },
                to: 'emojify.js/'
            }
        ])
    ],

    entry: {
        pretty: path.join(__dirname, 'public/js/pretty.js'),
        slide: path.join(__dirname, 'public/js/slide.js'),
        font: path.join(__dirname, 'public/css/google-font.css'),
        "font-pack": path.join(__dirname, 'public/css/font.css'),
        common: [
            "expose?jQuery!expose?$!jquery",
            "velocity-animate",
            "imports?$=jquery!jquery-mousewheel",
            "bootstrap"
        ],
            "js-url",
        index: [
            "script!jquery-ui-resizable",
            "js-url",
            "expose?filterXSS!xss",
            "script!Idle.Js",
            "expose?LZString!lz-string",
            "script!codemirror",
            "script!inlineAttachment",
            "script!jqueryTextcomplete",
            "script!codemirrorSpellChecker",
            "script!codemirrorInlineAttachment",
            "script!ot",
            "flowchart.js",
            "js-sequence-diagrams",
            path.join(__dirname, 'public/js/google-drive-upload.js'),
            path.join(__dirname, 'public/js/google-drive-picker.js'),
            path.join(__dirname, 'public/js/reveal-markdown.js'),
            path.join(__dirname, 'public/js/index.js')
        ],
        "index-styles": [
            path.join(__dirname, 'public/vendor/jquery-ui/jquery-ui.min.css'),
            path.join(__dirname, 'public/vendor/codemirror/lib/codemirror.css'),
            path.join(__dirname, 'public/vendor/codemirror-spell-checker/spell-checker.min.css'),
            path.join(__dirname, 'public/vendor/codemirror/addon/fold/foldgutter.css'),
            path.join(__dirname, 'public/vendor/codemirror/addon/display/fullscreen.css'),
            path.join(__dirname, 'public/vendor/codemirror/addon/dialog/dialog.css'),
            path.join(__dirname, 'public/vendor/codemirror/addon/scroll/simplescrollbars.css'),
            path.join(__dirname, 'public/vendor/codemirror/addon/search/matchesonscrollbar.css'),
            path.join(__dirname, 'public/vendor/codemirror/theme/monokai.css'),
            path.join(__dirname, 'public/vendor/codemirror/theme/one-dark.css'),
            path.join(__dirname, 'public/vendor/codemirror/mode/tiddlywiki/tiddlywiki.css'),
            path.join(__dirname, 'public/vendor/codemirror/mode/mediawiki/mediawiki.css'),
            path.join(__dirname, 'public/css/github-extract.css'),
            path.join(__dirname, 'public/vendor/showup/showup.css'),
            path.join(__dirname, 'public/css/mermaid.css'),
            path.join(__dirname, 'public/css/markdown.css')
        ],
        "index-styles-pack": [
            path.join(__dirname, 'node_modules/bootstrap/dist/css/bootstrap.min.css'),
            path.join(__dirname, 'node_modules/font-awesome/css/font-awesome.min.css'),
            path.join(__dirname, 'public/css/bootstrap-social.css'),
            path.join(__dirname, 'node_modules/ionicons/css/ionicons.min.css'),
            path.join(__dirname, 'node_modules/octicons/octicons/octicons.css')
        ],
        "index-pack": [
            "expose?Spinner!spin.js",
            "script!jquery-ui-resizable",
            "script!codemirror",
            "expose?jsyaml!js-yaml",
            "script!mermaid",
            "expose?moment!moment",
            "js-url",
            "script!handlebars",
            "expose?hljs!highlight.js",
            "expose?emojify!emojify.js",
            "expose?filterXSS!xss",
            "script!Idle.Js",
            "script!gist-embed",
            "expose?LZString!lz-string",
            "script!codemirror",
            "script!inlineAttachment",
            "script!jqueryTextcomplete",
            "script!codemirrorSpellChecker",
            "script!codemirrorInlineAttachment",
            "script!ot",
            "flowchart.js",
            "js-sequence-diagrams",
            "expose?Viz!viz.js",
            "expose?io!socket.io-client",
            path.join(__dirname, 'public/js/google-drive-upload.js'),
            path.join(__dirname, 'public/js/google-drive-picker.js'),
            path.join(__dirname, 'public/js/reveal-markdown.js'),
            path.join(__dirname, 'public/js/index.js')
        ],
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
            ot: path.join(__dirname, 'public/vendor/ot/ot.min.js'),
            listPagnation: path.join(__dirname, 'node_modules/list.pagination.js/dist/list.pagination.min.js'),
            mermaid: path.join(__dirname, 'node_modules/mermaid/dist/mermaid.min.js'),
            handlebars: path.join(__dirname, 'node_modules/handlebars/dist/handlebars.min.js'),
            "jquery-ui-resizable": path.join(__dirname, 'public/vendor/jquery-ui/jquery-ui.min.js'),
            "gist-embed": path.join(__dirname, 'node_modules/gist-embed/gist-embed.min.js'),
        }
    },

    externals: {
        "viz.js": "Viz",
        "socket.io-client": "io",
        "lodash": "_",
        "jquery": "$",
        "moment": "moment",
        "handlebars": "Handlebars",
        "highlight.js": "hljs",
        "select2": "select2"
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
