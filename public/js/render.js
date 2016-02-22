var whiteListTag = ['style', '!--', 'kbd'];
var whiteListAttr = ['id', 'class', 'style'];

var filterXSSOptions = {
    allowCommentTag: true,
    onIgnoreTag: function (tag, html, options) {
        // allow style in html
        if (whiteListTag.indexOf(tag) !== -1) {
            // do not filter its attributes
            return html;
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