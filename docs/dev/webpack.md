# Webpack Docs
## `webpack.common.js`
This file contains all common definition for chunks and plugins, that are needed by the whole app.

**TODO:** Document which entry points are used for what.

## `webpack.htmlexport.js`
Separate config for the "save as html" feature.
Packs all CSS from `public/js/htmlExport.js` to `build/html.min.css`.
This file is then downloaded by client-side JS and used to create the HTML.
See `exportToHTML()` in `public/js/extra.js`.


## `webpack.dev.js`
The development config uses both common configs, enables development mode and enables "cheap" source maps (lines only).
If you need more detailed source maps while developing, you might want to use the `source-maps` option.
See https://webpack.js.org/configuration/devtool/ for details.

## `webpack.prod.js`
The production config uses both common configs and enables production mode.
This automatically enables various optimizations (e.g. UglifyJS). See https://webpack.js.org/concepts/mode/ for details.

For the global app config, the name of the emitted chunks is changed to include the content hash.
See https://webpack.js.org/guides/caching/ on why this is a good idea.
 
For the HTML export config, CSS minification is enabled.
