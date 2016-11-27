var webpack = require('webpack');
var path = require('path');
var ExtractTextPlugin = require("extract-text-webpack-plugin");
var HtmlWebpackPlugin = require('html-webpack-plugin');
var CopyWebpackPlugin = require('copy-webpack-plugin');
var WebpackShellPlugin = require('webpack-shell-plugin');

module.exports = {
    plugins: [
        new WebpackShellPlugin({
            onBuildStart: ['cd node_modules/codemirror && npm install && ./release.sh']
        }),
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
        new webpack.optimize.OccurrenceOrderPlugin(true),
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
        new HtmlWebpackPlugin({
            template: 'public/views/includes/header.ejs',
            chunks: ['font', 'pretty-styles', 'pretty'],
            filename: path.join(__dirname, 'public/views/build/pretty-header.ejs'),
            inject: false
        }),
        new HtmlWebpackPlugin({
            template: 'public/views/includes/header.ejs',
            chunks: ['font-pack', 'pretty-styles-pack', 'pretty-styles', 'pretty'],
            filename: path.join(__dirname, 'public/views/build/pretty-pack-header.ejs'),
            inject: false
        }),
        new HtmlWebpackPlugin({
            template: 'public/views/includes/scripts.ejs',
            chunks: ['pretty'],
            filename: path.join(__dirname, 'public/views/build/pretty-scripts.ejs'),
            inject: false
        }),
        new HtmlWebpackPlugin({
            template: 'public/views/includes/scripts.ejs',
            chunks: ['common', 'pretty-pack'],
            filename: path.join(__dirname, 'public/views/build/pretty-pack-scripts.ejs'),
            inject: false
        }),
        new HtmlWebpackPlugin({
            template: 'public/views/includes/header.ejs',
            chunks: ['font', 'slide-styles', 'slide'],
            filename: path.join(__dirname, 'public/views/build/slide-header.ejs'),
            inject: false
        }),
        new HtmlWebpackPlugin({
            template: 'public/views/includes/header.ejs',
            chunks: ['font-pack', 'slide-styles-pack', 'slide-styles', 'slide'],
            filename: path.join(__dirname, 'public/views/build/slide-pack-header.ejs'),
            inject: false
        }),
        new HtmlWebpackPlugin({
            template: 'public/views/includes/scripts.ejs',
            chunks: ['slide'],
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
        font: path.join(__dirname, 'public/css/google-font.css'),
        "font-pack": path.join(__dirname, 'public/css/font.css'),
        common: [
            "expose?jQuery!expose?$!jquery",
            "velocity-animate",
            "imports?$=jquery!jquery-mousewheel",
            "bootstrap"
        ],
        cover: [
            path.join(__dirname, 'public/js/cover.js')
        ],
        "cover-styles-pack": [
            path.join(__dirname, 'node_modules/bootstrap/dist/css/bootstrap.min.css'),
            path.join(__dirname, 'node_modules/font-awesome/css/font-awesome.min.css'),
            path.join(__dirname, 'public/css/bootstrap-social.css'),
            path.join(__dirname, 'node_modules/select2/select2.css'),
            path.join(__dirname, 'node_modules/select2/select2-bootstrap.css'),
        ],
        "cover-pack": [
            "script!listPagnation",
            "expose?select2!select2",
            "expose?moment!moment",
            "js-url",
            path.join(__dirname, 'public/js/cover.js')
        ],
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
            path.join(__dirname, 'public/vendor/codemirror-spell-checker/spell-checker.min.css'),
            path.join(__dirname, 'node_modules/codemirror/lib/codemirror.css'),
            path.join(__dirname, 'node_modules/codemirror/addon/fold/foldgutter.css'),
            path.join(__dirname, 'node_modules/codemirror/addon/display/fullscreen.css'),
            path.join(__dirname, 'node_modules/codemirror/addon/dialog/dialog.css'),
            path.join(__dirname, 'node_modules/codemirror/addon/scroll/simplescrollbars.css'),
            path.join(__dirname, 'node_modules/codemirror/addon/search/matchesonscrollbar.css'),
            path.join(__dirname, 'node_modules/codemirror/theme/monokai.css'),
            path.join(__dirname, 'node_modules/codemirror/theme/one-dark.css'),
            path.join(__dirname, 'node_modules/codemirror/mode/tiddlywiki/tiddlywiki.css'),
            path.join(__dirname, 'node_modules/codemirror/mode/mediawiki/mediawiki.css'),
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
        pretty: [
            "expose?filterXSS!xss",
            "flowchart.js",
            "js-sequence-diagrams",
            path.join(__dirname, 'public/js/reveal-markdown.js'),
            path.join(__dirname, 'public/js/pretty.js')
        ],
        "pretty-styles": [
            path.join(__dirname, 'public/css/github-extract.css'),
            path.join(__dirname, 'public/css/mermaid.css'),
            path.join(__dirname, 'public/css/markdown.css')
        ],
        "pretty-styles-pack": [
            path.join(__dirname, 'node_modules/bootstrap/dist/css/bootstrap.min.css'),
            path.join(__dirname, 'node_modules/font-awesome/css/font-awesome.min.css'),
            path.join(__dirname, 'node_modules/ionicons/css/ionicons.min.css'),
            path.join(__dirname, 'node_modules/octicons/octicons/octicons.css')
        ],
        "pretty-pack": [
            "expose?jsyaml!js-yaml",
            "script!mermaid",
            "expose?moment!moment",
            "script!handlebars",
            "expose?hljs!highlight.js",
            "expose?emojify!emojify.js",
            "expose?filterXSS!xss",
            "script!gist-embed",
            "flowchart.js",
            "js-sequence-diagrams",
            "expose?Viz!viz.js",
            path.join(__dirname, 'public/js/reveal-markdown.js'),
            path.join(__dirname, 'public/js/pretty.js')
        ],
        slide: [
            "expose?filterXSS!xss",
            "flowchart.js",
            "js-sequence-diagrams",
            path.join(__dirname, 'public/js/reveal-markdown.js'),
            path.join(__dirname, 'public/js/slide.js')
        ],
        "slide-styles": [
            path.join(__dirname, 'public/css/github-extract.css'),
            path.join(__dirname, 'public/css/mermaid.css'),
            path.join(__dirname, 'public/css/markdown.css')
        ],
        "slide-styles-pack": [
            path.join(__dirname, 'node_modules/font-awesome/css/font-awesome.min.css'),
            path.join(__dirname, 'node_modules/ionicons/css/ionicons.min.css'),
            path.join(__dirname, 'node_modules/octicons/octicons/octicons.css'),
            path.join(__dirname, 'public/vendor/bootstrap/tooltip.min.css')
        ],
        "slide-pack": [
            "expose?jsyaml!js-yaml",
            "script!mermaid",
            "expose?moment!moment",
            "script!handlebars",
            "expose?hljs!highlight.js",
            "expose?emojify!emojify.js",
            "expose?filterXSS!xss",
            "script!gist-embed",
            "flowchart.js",
            "js-sequence-diagrams",
            "expose?Viz!viz.js",
            "headjs",
            "expose?Reveal!reveal.js",
            path.join(__dirname, 'public/js/reveal-markdown.js'),
            path.join(__dirname, 'public/js/slide.js')
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
            codemirror: path.join(__dirname, 'node_modules/codemirror/codemirror.min.js'),
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
            "bootstrap-tooltip": path.join(__dirname, 'public/vendor/bootstrap/tooltip.min.js'),
            "headjs": path.join(__dirname, 'node_modules/reveal.js/lib/js/head.min.js')
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
            test: /\.(woff|woff2)(\?v=\d+\.\d+\.\d+)?$/,
            loader: "url?prefix=font/&limit=5000"
        }, {
            test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
            loader: "url?limit=10000&mimetype=application/octet-stream"
        }, {
            test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
            loader: "url?limit=10000&mimetype=image/svg+xml"
        }, {
            test: /\.png(\?v=\d+\.\d+\.\d+)?$/,
            loader: "url?limit=10000&mimetype=image/png"
        }, {
            test: /\.gif(\?v=\d+\.\d+\.\d+)?$/,
            loader: "url?limit=10000&mimetype=image/gif"
        }]
    },

    node: {
        fs: "empty"
    }
};
