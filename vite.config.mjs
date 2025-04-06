import { defineConfig } from 'vite'
import legacy from '@vitejs/plugin-legacy'
import copy from 'rollup-plugin-copy'
import EnvironmentPlugin from 'vite-plugin-environment'
import string from 'vite-plugin-string' // Import string plugin
import viteCommonjs from 'vite-plugin-commonjs' // Import commonjs plugin
import inject from '@rollup/plugin-inject'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    viteCommonjs(), // Add commonjs plugin usage
    legacy({
      targets: ['defaults', 'not IE 11'] // Similar target as babel-preset-env might use
    }),
    inject({
      // Inject global variables for legacy builds
      $: 'jquery',
      jQuery: 'jquery',
      key: 'keymaster',
      'window.key': 'keymaster',
      CodeMirror: '@hackmd/codemirror',
      moment: 'moment',
      // Add exclude for HTML files to prevent inject plugin from processing them
      exclude: ['**/*.html', '**/*.css']
    }),
    // string({
    //   include: '**/*.html'
    // }),
    copy({
      targets: [
        {
          src: path.join(__dirname, 'node_modules/mathjax'),
          dest: path.join(__dirname, 'public/build/MathJax')
        },
        {
          src: path.join(__dirname, 'node_modules/@hackmd/emojify.js/dist'),
          dest: path.join(__dirname, 'public/build/emojify.js')
        },
        {
          src: path.join(__dirname, 'node_modules/reveal.js/js'),
          dest: path.join(__dirname, 'public/build/reveal.js/js')
        },
        {
          src: path.join(__dirname, 'node_modules/reveal.js/css'),
          dest: path.join(__dirname, 'public/build/reveal.js/css')
        },
        {
          src: path.join(__dirname, 'node_modules/reveal.js/lib'),
          dest: path.join(__dirname, 'public/build/reveal.js/lib')
        },
        {
          src: path.join(__dirname, 'node_modules/reveal.js/plugin'),
          dest: path.join(__dirname, 'public/build/reveal.js/plugin')
        },
        {
          src: path.join(__dirname, 'node_modules/dictionary-de/*'),
          dest: path.join(__dirname, 'public/build/dictionary-de')
        },
        {
          src: path.join(__dirname, 'node_modules/dictionary-de-at/*'),
          dest: path.join(__dirname, 'public/build/dictionary-de-at')
        },
        {
          src: path.join(__dirname, 'node_modules/dictionary-de-ch/*'),
          dest: path.join(__dirname, 'public/build/dictionary-de-ch')
        },
        {
          src: path.join(__dirname, 'node_modules/dictionary-en-gb/*'),
          dest: path.join(__dirname, 'public/build/dictionary-en-gb')
        },
        {
          src: path.join(__dirname, 'node_modules/leaflet/dist'),
          dest: path.join(__dirname, 'public/build/leaflet')
        },
        // {
        //   src: path.join(__dirname, 'node_modules/fork-awesome/fonts/*'),
        //   dest: path.join(__dirname, 'public/build/fork-awesome/fonts')
        // },
        // {
        //   src: path.join(__dirname, 'node_modules/fork-awesome/css/*'),
        //   dest: path.join(__dirname, 'public/build/fork-awesome/css')
        // }
      ],
      hook: 'writeBundle' // Run copy after bundle is written
    }),
    // Placeholder for environment variables if needed later
    EnvironmentPlugin('all')
  ],
  resolve: {
    alias: {
      // CSS import aliases
      '@css': path.resolve(__dirname, 'public/css'),
      '@vendor': path.resolve(__dirname, 'public/vendor'),
      // Replicating webpack aliases
      // codemirror alias removed as it's now imported via ES modules
      inlineAttachment: path.join(__dirname, 'public/vendor/inlineAttachment/inline-attachment.js'),
      jqueryTextcomplete: path.join(__dirname, 'public/vendor/jquery-textcomplete/jquery.textcomplete.js'),
      codemirrorInlineAttachment: path.join(__dirname, 'public/vendor/inlineAttachment/codemirror.inline-attachment.js'),
      // ot: path.join(__dirname, 'public/vendor/ot/ot.min.js'),
      mermaid: path.join(__dirname, 'node_modules/mermaid/dist/mermaid.min.js'),
      handlebars: path.join(__dirname, 'node_modules/handlebars/dist/handlebars.min.js'),
      'jquery-ui-resizable': path.join(__dirname, 'public/vendor/jquery-ui/jquery-ui.min.js'),
      'gist-embed': path.join(__dirname, 'node_modules/gist-embed/gist-embed.min.js'),
      'bootstrap-tooltip': path.join(__dirname, 'public/vendor/bootstrap/tooltip.min.js'),
      'reveal-markdown': path.join(__dirname, 'public/js/reveal-markdown.js'),
      abcjs: path.join(__dirname, 'public/vendor/abcjs_basic_3.1.1-min.js'),
      raphael: path.join(__dirname, 'node_modules/raphael/raphael.min.js'),
      'js-sequence-diagrams': path.join(__dirname, 'node_modules/@hackmd/js-sequence-diagrams/build/main.js'),
      vega: path.join(__dirname, 'node_modules/vega/build/vega.min.js'),
      'vega-lite': path.join(__dirname, 'node_modules/vega-lite/build/vega-lite.min.js'),
      'vega-embed': path.join(__dirname, 'node_modules/vega-embed/build/vega-embed.min.js'),
      'emojify.js': path.join(__dirname, 'node_modules/@hackmd/emojify.js/dist/js/emojify-browser.min.js'),
      'markdown-it': path.join(__dirname, 'node_modules/markdown-it/dist/markdown-it.js'),
      'viz.js': path.join(__dirname, 'node_modules/viz.js/viz.js'),
      'viz.render.js': path.join(__dirname, 'node_modules/viz.js/full.render.js'),
      markdownlint: path.join(__dirname, 'node_modules/markdownlint/demo/markdownlint-browser.js'),
      // Add project source alias
      '@': path.resolve(__dirname, './public/js')
    }
  },
  build: {
    outDir: path.join(__dirname, 'public/build'),
    emptyOutDir: true, // Clean the output directory before building
    manifest: true, // Generate manifest.json
    rollupOptions: {
      moduleContext: (id) => {
        const modules = ['pdfobject', 'jquery-mousewheel']

        if (modules.some(module => id.includes(module))) {
          return 'window' // Set context for specific modules
        }
        return undefined
      },
      input: {
        // Define JS entry points
        index: path.resolve(__dirname, 'public/js/index.js'),
        cover: path.resolve(__dirname, 'public/js/cover.js'),
        pretty: path.resolve(__dirname, 'public/js/pretty.js'),
        slide: path.resolve(__dirname, 'public/js/slide.js')
      },
      external: [/\.html$/]
    }
  },
  // Define global constants like webpack DefinePlugin (if needed)
  define: {
    // Example: 'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    __dirname: '""', // Define __dirname as empty string for browser compatibility
    global: 'globalThis', // Explicitly define global for Vite
    // ot: {} // Define ot as empty object for browser compatibility
  },
  root: __dirname,
  base: process.env.NODE_ENV === 'production' ? '/build' : '/.vite/',
  publicDir: false, // Let Vite handle all assets through middleware
  appType: 'custom',
  optimizeDeps: {
    include: [
      'turndown',
      'file-saver',
      'randomcolor',
      'store',
      'highlight.js',
      'validator/lib/isURL',
      'lodash',
      'wurl',
      'list.js',
      '@hackmd/idle-js',
      'spin.js'
    ]
  },
  server: {
    middlewareMode: true,
    ws: true,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      path: '/.vite/hmr' // Specify a custom HMR path
    },
    fs: {
      strict: true, // Only serve explicitly allowed files
      allow: [
        path.resolve(__dirname),
        path.resolve(__dirname, 'node_modules')
      ]
    }
  }
})
