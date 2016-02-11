function preventXSS(html) {
    var options = {
        allowCommentTag: true,
        onIgnoreTagAttr: function (tag, name, value, isWhiteAttr) {
            // allow attr start with 'data-' or equal 'id' and 'class'
            if (name.substr(0, 5) === 'data-' || name === 'id' || name === 'class') {
                // escape its value using built-in escapeAttrValue function
                return name + '="' + filterXSS.escapeAttrValue(value) + '"';
            }
        }
    };
    return filterXSS(html, options);
}