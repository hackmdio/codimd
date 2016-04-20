var whiteListTag = ['style', '!--', 'kbd'];
var whiteListAttr = ['id', 'class', 'style'];

var filterXSSOptions = {
    allowCommentTag: true,
    escapeHtml: function (html) {
        // to allow html comment in multiple lines
        return html.replace(/<(.*?)>/g, '&lt;$1&gt;');
    },
    onIgnoreTag: function (tag, html, options) {
        // allow style in html
        if (whiteListTag.indexOf(tag) !== -1) {
            // do not filter its attributes
            return html;
        }
    },
    onTagAttr: function (tag, name, value, isWhiteAttr) {
        // allow href starts with '.' or '/'
        if (isWhiteAttr && name === 'href' && (value.indexOf('.') == 0 || value.indexOf('/') == 0)) {
            return name + '="' + filterXSS.escapeAttrValue(value) + '"';
        }
    },
    onIgnoreTagAttr: function (tag, name, value, isWhiteAttr) {
        // allow attr start with 'data-' or in the whiteListAttr
        if (name.substr(0, 5) === 'data-' || whiteListAttr.indexOf(name) !== -1) {
            // escape its value using built-in escapeAttrValue function
            return name + '="' + filterXSS.escapeAttrValue(value) + '"';
        }
        // allow ol specify start number
        if (tag === 'ol' && name === 'start') {
            return name + '="' + filterXSS.escapeAttrValue(value) + '"';
        }
    }
};

function preventXSS(html) {
    return filterXSS(html, filterXSSOptions);
}