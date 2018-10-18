const webpack = require('webpack')
const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

// Fix possible nofile-issues
const fs = require('fs')
const gracefulFs = require('graceful-fs')
gracefulFs.gracefulify(fs)

module.exports = {
  name: 'app',
  plugins: [
    new webpack.ProvidePlugin({
      Visibility: 'visibilityjs',
      Cookies: 'js-cookie',
      key: 'keymaster',
      $: 'jquery',
      jQuery: 'jquery',
      'window.jQuery': 'jquery',
      'moment': 'moment',
      'Handlebars': 'handlebars'
    }),
    new HtmlWebpackPlugin({
      template: 'public/views/includes/header.ejs',
      chunks: ['font', 'index-styles', 'index'],
      filename: path.join(__dirname, 'public/views/build/index-header.ejs'),
      inject: false,
      chunksSortMode: 'manual'
    }),
    new HtmlWebpackPlugin({
      template: 'public/views/includes/header.ejs',
      chunks: ['font-pack', 'index-styles-pack', 'index-styles', 'index'],
      filename: path.join(__dirname, 'public/views/build/index-pack-header.ejs'),
      inject: false,
      chunksSortMode: 'manual'
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
      inject: false,
      chunksSortMode: 'manual'
    }),
    new HtmlWebpackPlugin({
      template: 'public/views/includes/header.ejs',
      chunks: ['font', 'cover'],
      filename: path.join(__dirname, 'public/views/build/cover-header.ejs'),
      inject: false,
      chunksSortMode: 'manual'
    }),
    new HtmlWebpackPlugin({
      template: 'public/views/includes/header.ejs',
      chunks: ['font-pack', 'cover-styles-pack', 'cover'],
      filename: path.join(__dirname, 'public/views/build/cover-pack-header.ejs'),
      inject: false,
      chunksSortMode: 'manual'
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
      inject: false,
      chunksSortMode: 'manual'
    }),
    new HtmlWebpackPlugin({
      template: 'public/views/includes/header.ejs',
      chunks: ['font', 'pretty-styles', 'pretty'],
      filename: path.join(__dirname, 'public/views/build/pretty-header.ejs'),
      inject: false,
      chunksSortMode: 'manual'
    }),
    new HtmlWebpackPlugin({
      template: 'public/views/includes/header.ejs',
      chunks: ['font-pack', 'pretty-styles-pack', 'pretty-styles', 'pretty'],
      filename: path.join(__dirname, 'public/views/build/pretty-pack-header.ejs'),
      inject: false,
      chunksSortMode: 'manual'
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
      inject: false,
      chunksSortMode: 'manual'
    }),
    new HtmlWebpackPlugin({
      template: 'public/views/includes/header.ejs',
      chunks: ['font', 'slide-styles', 'slide'],
      filename: path.join(__dirname, 'public/views/build/slide-header.ejs'),
      inject: false,
      chunksSortMode: 'manual'
    }),
    new HtmlWebpackPlugin({
      template: 'public/views/includes/header.ejs',
      chunks: ['font-pack', 'slide-styles-pack', 'slide-styles', 'slide'],
      filename: path.join(__dirname, 'public/views/build/slide-pack-header.ejs'),
      inject: false,
      chunksSortMode: 'manual'
    }),
    new HtmlWebpackPlugin({
      template: 'public/views/includes/scripts.ejs',
      chunks: ['slide'],
      filename: path.join(__dirname, 'public/views/build/slide-scripts.ejs'),
      inject: false
    }),
    new HtmlWebpackPlugin({
      template: 'public/views/includes/scripts.ejs',
      chunks: ['slide-pack'],
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
          glob: 'dist/**/*',
          dot: false
        },
        to: 'emojify.js/'
      },
      {
        context: path.join(__dirname, 'node_modules/reveal.js'),
        from: 'js',
        to: 'reveal.js/js'
      },
      {
        context: path.join(__dirname, 'node_modules/reveal.js'),
        from: 'css',
        to: 'reveal.js/css'
      },
      {
        context: path.join(__dirname, 'node_modules/reveal.js'),
        from: 'lib',
        to: 'reveal.js/lib'
      },
      {
        context: path.join(__dirname, 'node_modules/reveal.js'),
        from: 'plugin',
        to: 'reveal.js/plugin'
      }
    ]),
    new MiniCssExtractPlugin()
  ],

  entry: {
    font: path.join(__dirname, 'public/css/google-font.css'),
    'font-pack': path.join(__dirname, 'public/css/font.css'),
    common: [
      'expose-loader?jQuery!expose-loader?$!jquery',
      'velocity-animate',
      'imports-loader?$=jquery!jquery-mousewheel',
      'bootstrap'
    ],
    cover: [
      'babel-polyfill',
      path.join(__dirname, 'public/js/cover.js')
    ],
    'cover-styles-pack': [
      path.join(__dirname, 'node_modules/bootstrap/dist/css/bootstrap.min.css'),
      path.join(__dirname, 'node_modules/fork-awesome/css/fork-awesome.min.css'),
      path.join(__dirname, 'public/css/bootstrap-social.css'),
      path.join(__dirname, 'node_modules/select2/select2.css'),
      path.join(__dirname, 'node_modules/select2/select2-bootstrap.css')
    ],
    'cover-pack': [
      'babel-polyfill',
      'bootstrap-validator',
      'expose-loader?select2!select2',
      'expose-loader?moment!moment',
      'script-loader!js-url',
      path.join(__dirname, 'public/js/cover.js')
    ],
    index: [
      'babel-polyfill',
      'script-loader!jquery-ui-resizable',
      'script-loader!js-url',
      'expose-loader?filterXSS!xss',
      'script-loader!Idle.Js',
      'expose-loader?LZString!lz-string',
      'script-loader!codemirror',
      'script-loader!inlineAttachment',
      'script-loader!jqueryTextcomplete',
      'script-loader!codemirrorSpellChecker',
      'script-loader!codemirrorInlineAttachment',
      'script-loader!ot',
      'flowchart.js',
      'js-sequence-diagrams',
      'expose-loader?RevealMarkdown!reveal-markdown',
      path.join(__dirname, 'public/js/index.js')
    ],
    'index-styles': [
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
      path.join(__dirname, 'public/css/markdown.css'),
      path.join(__dirname, 'public/css/slide-preview.css')
    ],
    'index-styles-pack': [
      path.join(__dirname, 'node_modules/bootstrap/dist/css/bootstrap.min.css'),
      path.join(__dirname, 'node_modules/fork-awesome/css/fork-awesome.min.css'),
      path.join(__dirname, 'public/css/bootstrap-social.css'),
      path.join(__dirname, 'node_modules/ionicons/css/ionicons.min.css')
    ],
    'index-pack': [
      'babel-polyfill',
      'expose-loader?Spinner!spin.js',
      'script-loader!jquery-ui-resizable',
      'bootstrap-validator',
      'expose-loader?jsyaml!js-yaml',
      'script-loader!mermaid',
      'expose-loader?moment!moment',
      'script-loader!js-url',
      'script-loader!handlebars',
      'expose-loader?hljs!highlight.js',
      'expose-loader?emojify!emojify.js',
      'expose-loader?filterXSS!xss',
      'script-loader!Idle.Js',
      'script-loader!gist-embed',
      'expose-loader?LZString!lz-string',
      'script-loader!codemirror',
      'script-loader!inlineAttachment',
      'script-loader!jqueryTextcomplete',
      'script-loader!codemirrorSpellChecker',
      'script-loader!codemirrorInlineAttachment',
      'script-loader!ot',
      'flowchart.js',
      'js-sequence-diagrams',
      'expose-loader?Viz!viz.js',
      'script-loader!abcjs',
      'expose-loader?io!socket.io-client',
      'expose-loader?RevealMarkdown!reveal-markdown',
      path.join(__dirname, 'public/js/index.js')
    ],
    pretty: [
      'babel-polyfill',
      'expose-loader?filterXSS!xss',
      'flowchart.js',
      'js-sequence-diagrams',
      'expose-loader?RevealMarkdown!reveal-markdown',
      path.join(__dirname, 'public/js/pretty.js')
    ],
    'pretty-styles': [
      path.join(__dirname, 'public/css/github-extract.css'),
      path.join(__dirname, 'public/css/mermaid.css'),
      path.join(__dirname, 'public/css/markdown.css'),
      path.join(__dirname, 'public/css/slide-preview.css')
    ],
    'pretty-styles-pack': [
      path.join(__dirname, 'node_modules/bootstrap/dist/css/bootstrap.min.css'),
      path.join(__dirname, 'node_modules/fork-awesome/css/fork-awesome.min.css'),
      path.join(__dirname, 'node_modules/ionicons/css/ionicons.min.css')
    ],
    'pretty-pack': [
      'babel-polyfill',
      'expose-loader?jsyaml!js-yaml',
      'script-loader!mermaid',
      'expose-loader?moment!moment',
      'script-loader!handlebars',
      'expose-loader?hljs!highlight.js',
      'expose-loader?emojify!emojify.js',
      'expose-loader?filterXSS!xss',
      'script-loader!gist-embed',
      'flowchart.js',
      'js-sequence-diagrams',
      'expose-loader?Viz!viz.js',
      'script-loader!abcjs',
      'expose-loader?RevealMarkdown!reveal-markdown',
      path.join(__dirname, 'public/js/pretty.js')
    ],
    slide: [
      'babel-polyfill',
      'bootstrap-tooltip',
      'expose-loader?filterXSS!xss',
      'flowchart.js',
      'js-sequence-diagrams',
      'expose-loader?RevealMarkdown!reveal-markdown',
      path.join(__dirname, 'public/js/slide.js')
    ],
    'slide-styles': [
      path.join(__dirname, 'public/vendor/bootstrap/tooltip.min.css'),
      path.join(__dirname, 'public/css/github-extract.css'),
      path.join(__dirname, 'public/css/mermaid.css'),
      path.join(__dirname, 'public/css/markdown.css')
    ],
    'slide-styles-pack': [
      path.join(__dirname, 'node_modules/fork-awesome/css/fork-awesome.min.css'),
      path.join(__dirname, 'node_modules/ionicons/css/ionicons.min.css')
    ],
    'slide-pack': [
      'babel-polyfill',
      'expose-loader?jQuery!expose-loader?$!jquery',
      'velocity-animate',
      'imports-loader?$=jquery!jquery-mousewheel',
      'bootstrap-tooltip',
      'expose-loader?jsyaml!js-yaml',
      'script-loader!mermaid',
      'expose-loader?moment!moment',
      'script-loader!handlebars',
      'expose-loader?hljs!highlight.js',
      'expose-loader?emojify!emojify.js',
      'expose-loader?filterXSS!xss',
      'script-loader!gist-embed',
      'flowchart.js',
      'js-sequence-diagrams',
      'expose-loader?Viz!viz.js',
      'script-loader!abcjs',
      'headjs',
      'expose-loader?Reveal!reveal.js',
      'expose-loader?RevealMarkdown!reveal-markdown',
      path.join(__dirname, 'public/js/slide.js')
    ]
  },

  output: {
    path: path.join(__dirname, 'public/build'),
    publicPath: '/build/',
    filename: '[name].js'
  },

  resolve: {
    modules: ['node_modules'],
    extensions: ['.js'],
    alias: {
      codemirror: path.join(__dirname, 'node_modules/codemirror/codemirror.min.js'),
      inlineAttachment: path.join(__dirname, 'public/vendor/inlineAttachment/inline-attachment.js'),
      jqueryTextcomplete: path.join(__dirname, 'public/vendor/jquery-textcomplete/jquery.textcomplete.js'),
      codemirrorSpellChecker: path.join(__dirname, 'public/vendor/codemirror-spell-checker/spell-checker.min.js'),
      codemirrorInlineAttachment: path.join(__dirname, 'public/vendor/inlineAttachment/codemirror.inline-attachment.js'),
      ot: path.join(__dirname, 'public/vendor/ot/ot.min.js'),
      mermaid: path.join(__dirname, 'node_modules/mermaid/dist/mermaid.min.js'),
      handlebars: path.join(__dirname, 'node_modules/handlebars/dist/handlebars.min.js'),
      'jquery-ui-resizable': path.join(__dirname, 'public/vendor/jquery-ui/jquery-ui.min.js'),
      'gist-embed': path.join(__dirname, 'node_modules/gist-embed/gist-embed.min.js'),
      'bootstrap-tooltip': path.join(__dirname, 'public/vendor/bootstrap/tooltip.min.js'),
      'headjs': path.join(__dirname, 'node_modules/reveal.js/lib/js/head.min.js'),
      'reveal-markdown': path.join(__dirname, 'public/js/reveal-markdown.js'),
      abcjs: path.join(__dirname, 'public/vendor/abcjs_basic_3.1.1-min.js'),
      raphael: path.join(__dirname, 'node_modules/raphael/raphael.no-deps.js')
    }
  },

  externals: {
    'viz.js': 'Viz',
    'socket.io-client': 'io',
    'jquery': '$',
    'moment': 'moment',
    'handlebars': 'Handlebars',
    'highlight.js': 'hljs',
    'select2': 'select2'
  },

  module: {
    rules: [{
      test: /\.js$/,
      use: [{ loader: 'babel-loader' }],
      exclude: [/node_modules/, /public\/vendor/]
    }, {
      test: /\.css$/,
      use: [
        MiniCssExtractPlugin.loader,
        'css-loader'
      ]
    }, {
      test: /\.scss$/,
      use: [
        MiniCssExtractPlugin.loader,
        {
          loader: 'css-loader',
          options: {
            importLoaders: 1
          }
        },
        'sass-loader'
      ]
    }, {
      test: /\.less$/,
      use: [
        MiniCssExtractPlugin.loader,
        {
          loader: 'css-loader',
          options: {
            importLoaders: 1
          }
        },
        'less-loader'
      ]
    }, {
      test: require.resolve('js-sequence-diagrams'),
      use: [{
        loader: 'imports-loader',
        options: { _: 'lodash', Raphael: 'raphael', eve: 'eve' }
      }]
    }, {
      test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
      use: [{ loader: 'file-loader' }]
    }, {
      test: /\.html$/,
      use: [{ loader: 'string-loader' }]
    }, {
      test: /\.(woff|woff2)(\?v=\d+\.\d+\.\d+)?$/,
      use: [{
        loader: 'url-loader',
        options: { prefix: 'font/', limit: '5000' }
      }]
    }, {
      test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
      use: [{
        loader: 'url-loader',
        options: { limit: '5000', mimetype: 'application/octet-stream' }
      }]
    }, {
      test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
      use: [{
        loader: 'url-loader',
        options: { limit: '10000', mimetype: 'svg+xml' }
      }]
    }, {
      test: /\.png(\?v=\d+\.\d+\.\d+)?$/,
      use: [{
        loader: 'url-loader',
        options: { limit: '10000', mimetype: 'image/png' }
      }]
    }, {
      test: /\.gif(\?v=\d+\.\d+\.\d+)?$/,
      use: [{
        loader: 'url-loader',
        options: { limit: '10000', mimetype: 'image/gif' }
      }]
    }]
  },
  node: {
    fs: 'empty'
  },

  stats: {
    assets: false
  }
}
