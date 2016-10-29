// allow some attributes
var whiteListAttr = ['id', 'class', 'style'];
// allow link starts with '.', '/' and custom protocol with '://'
var linkRegex = /^([\w|-]+:\/\/)|^([\.|\/])+/;
// allow data uri, from https://gist.github.com/bgrins/6194623
var dataUriRegex = /^\s*data:([a-z]+\/[a-z0-9-+.]+(;[a-z-]+=[a-z0-9-]+)?)?(;base64)?,([a-z0-9!$&',()*+;=\-._~:@\/?%\s]*)\s*$/i;
// custom white list
var whiteList = filterXSS.whiteList;
// allow ol specify start number
whiteList['ol'] = ['start'];
// allow style tag
whiteList['style'] = [];
// allow kbd tag
whiteList['kbd'] = [];
// allow ifram tag with some safe attributes
whiteList['iframe'] = ['allowfullscreen', 'name', 'referrerpolicy', 'sandbox', 'src', 'srcdoc', 'width', 'height'];
// allow summary tag
whiteList['summary'] = [];

var filterXSSOptions = {
    allowCommentTag: true,
    whiteList: whiteList,
    escapeHtml: function (html) {
        // allow html comment in multiple lines
        return html.replace(/<(.*?)>/g, '&lt;$1&gt;');
    },
    onIgnoreTag: function (tag, html, options) {
        // allow comment tag
        if (tag == "!--") {
            // do not filter its attributes
            return html;
        }
    },
    onTagAttr: function (tag, name, value, isWhiteAttr) {
        // allow href and src that match linkRegex
        if (isWhiteAttr && (name === 'href' || name === 'src') && linkRegex.test(value)) {
            return name + '="' + filterXSS.escapeAttrValue(value) + '"';
        }
        // allow data uri in img src
        if (isWhiteAttr && (tag == "img" && name === 'src') && dataUriRegex.test(value)) {
            return name + '="' + filterXSS.escapeAttrValue(value) + '"';
        }
    },
    onIgnoreTagAttr: function (tag, name, value, isWhiteAttr) {
        // allow attr start with 'data-' or in the whiteListAttr
        if (name.substr(0, 5) === 'data-' || whiteListAttr.indexOf(name) !== -1) {
            // escape its value using built-in escapeAttrValue function
            return name + '="' + filterXSS.escapeAttrValue(value) + '"';
        }
    }
};

function preventXSS(html) {
    return filterXSS(html, filterXSSOptions);
}
window.preventXSS = preventXSS;

module.exports = {
  preventXSS: preventXSS
}
