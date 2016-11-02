var baseConfig = require('./webpackBaseConfig');
var ExtractTextPlugin = require("extract-text-webpack-plugin");

module.exports = Object.assign({}, baseConfig, {
    plugins: baseConfig.plugins.concat([
        new ExtractTextPlugin("[name].css")
    ])
});
