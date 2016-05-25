// Inject line numbers for sync scroll.

function addPart(tokens, idx) {
    if (tokens[idx].map && tokens[idx].level === 0) {
        var startline = tokens[idx].map[0] + 1;
        var endline = tokens[idx].map[1];
        tokens[idx].attrJoin('class', 'part');
        tokens[idx].attrJoin('data-startline', startline);
        tokens[idx].attrJoin('data-endline', endline);
    }
}

md.renderer.rules.blockquote_open = function (tokens, idx, options, env, self) {
    tokens[idx].attrJoin('class', 'raw');
    addPart(tokens, idx);
    return self.renderToken.apply(self, arguments);
};
md.renderer.rules.table_open = function (tokens, idx, options, env, self) {
    addPart(tokens, idx);
    return self.renderToken.apply(self, arguments);
};
md.renderer.rules.bullet_list_open = function (tokens, idx, options, env, self) {
    addPart(tokens, idx);
    return self.renderToken.apply(self, arguments);
};
md.renderer.rules.list_item_open = function (tokens, idx, options, env, self) {
    tokens[idx].attrJoin('class', 'raw');
    if (tokens[idx].map) {
        var startline = tokens[idx].map[0] + 1;
        var endline = tokens[idx].map[1];
        tokens[idx].attrJoin('class', 'part');
        tokens[idx].attrJoin('data-startline', startline);
        tokens[idx].attrJoin('data-endline', endline);
    }
    return self.renderToken.apply(self, arguments);
};
md.renderer.rules.ordered_list_open = function (tokens, idx, options, env, self) {
    addPart(tokens, idx);
    return self.renderToken.apply(self, arguments);
};
md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
    addPart(tokens, idx);
    return self.renderToken.apply(self, arguments);
};
md.renderer.rules.paragraph_open = function (tokens, idx, options, env, self) {
    addPart(tokens, idx);
    return self.renderToken.apply(self, arguments);
};
md.renderer.rules.heading_open = function (tokens, idx, options, env, self) {
    tokens[idx].attrJoin('class', 'raw');
    addPart(tokens, idx);
    return self.renderToken.apply(self, arguments);
};
md.renderer.rules.fence = function (tokens, idx, options, env, self) {
    var token = tokens[idx],
      info = token.info ? md.utils.unescapeAll(token.info).trim() : '',
      langName = '',
      highlighted;

    if (info) {
        langName = info.split(/\s+/g)[0];
        token.attrJoin('class', options.langPrefix + langName.replace(/\=$|\=\d+$|\=\+$/, ''));
        token.attrJoin('class', 'hljs');
    }

    if (options.highlight) {
        highlighted = options.highlight(token.content, langName) || md.utils.escapeHtml(token.content);
    } else {
        highlighted = md.utils.escapeHtml(token.content);
    }

    if (highlighted.indexOf('<pre') === 0) {
        return highlighted + '\n';
    }
    
    if (tokens[idx].map && tokens[idx].level === 0) {
        var startline = tokens[idx].map[0] + 1;
        var endline = tokens[idx].map[1];
        return '<pre class="part" data-startline="' + startline + '" data-endline="' + endline + '"><code' + self.renderAttrs(token) + '>'
        + highlighted
        + '</code></pre>\n';
    }

    return '<pre><code' + self.renderAttrs(token) + '>'
        + highlighted
        + '</code></pre>\n';
};
md.renderer.rules.code_block = function (tokens, idx, options, env, self) {
    if (tokens[idx].map && tokens[idx].level === 0) {
        var startline = tokens[idx].map[0] + 1;
        var endline = tokens[idx].map[1];
        return '<pre class="part" data-startline="' + startline + '" data-endline="' + endline + '"><code>' + md.utils.escapeHtml(tokens[idx].content) + '</code></pre>\n';
    }
    return '<pre><code>' + md.utils.escapeHtml(tokens[idx].content) + '</code></pre>\n';
};
function renderContainer(tokens, idx, options, env, self) {
    tokens[idx].attrJoin('role', 'alert');
    tokens[idx].attrJoin('class', 'alert');
    tokens[idx].attrJoin('class', 'alert-' + tokens[idx].info.trim());
    addPart(tokens, idx);
    return self.renderToken.apply(self, arguments);
}
md.use(window.markdownitContainer, 'success', { render: renderContainer });
md.use(window.markdownitContainer, 'info', { render: renderContainer });
md.use(window.markdownitContainer, 'warning', { render: renderContainer });
md.use(window.markdownitContainer, 'danger', { render: renderContainer });

var preventSyncScroll = false;

var editScrollThrottle = 1;
var viewScrollThrottle = 20;
var buildMapThrottle = 100;

var viewScrolling = false;
var viewScrollingDelay = 200;
var viewScrollingTimer = null;

var editScrolling = false;
var editScrollingDelay = 100;
var editScrollingTimer = null;

if (editor.getOption('scrollbarStyle') === 'native') {
    ui.area.codemirrorScroll.on('scroll', _.throttle(syncScrollToView, editScrollThrottle));
} else {
    editor.on('scroll', _.throttle(syncScrollToView, editScrollThrottle));
}
ui.area.view.on('scroll', _.throttle(syncScrollToEdit, viewScrollThrottle));

var preventViewScroll = false;

function syncScrollToEdit(e) {
    if (currentMode != modeType.both) return;
    if (preventViewScroll) {
        if (typeof preventViewScroll === 'number') {
            preventViewScroll--;
        } else {
            preventViewScroll = false;
        }
        return;
    }
    if (!scrollMap || !lineHeightMap) {
        buildMap(true);
        return;
    }
    if (editScrolling) return;
    var scrollTop = ui.area.view[0].scrollTop;
    var lineIndex = 0;
    for (var i = 0, l = scrollMap.length; i < l; i++) {
        if (scrollMap[i] > scrollTop) {
            break;
        } else {
            lineIndex = i;
        }
    }
    var lineNo = 0;
    var lineDiff = 0;
    for (var i = 0, l = lineHeightMap.length; i < l; i++) {
        if (lineHeightMap[i] > lineIndex) {
            break;
        } else {
            lineNo = lineHeightMap[i];
            lineDiff = lineHeightMap[i + 1] - lineNo;
        }
    }
    
    var scrollInfo = editor.getScrollInfo();
    var textHeight = editor.defaultTextHeight();
    var posTo = 0;
    var topDiffPercent = 0;
    var posToNextDiff = 0;
    var preLastLineHeight = scrollInfo.height - scrollInfo.clientHeight - textHeight;
    var preLastLineNo = Math.round(preLastLineHeight / textHeight);
    
    if (scrollInfo.height > scrollInfo.clientHeight && lineNo >= preLastLineNo) {
        posTo = preLastLineHeight;
        topDiffPercent = (scrollTop - scrollMap[preLastLineNo]) / (viewBottom - scrollMap[preLastLineNo]);
        posToNextDiff = Math.ceil(textHeight * topDiffPercent);
    } else {
        posTo = lineNo * textHeight;
        topDiffPercent = (scrollTop - scrollMap[lineNo]) / (scrollMap[lineNo + lineDiff] - scrollMap[lineNo]);
        posToNextDiff = Math.ceil(textHeight * lineDiff * topDiffPercent);
    }
    
    editor.scrollTo(0, posTo + posToNextDiff);
    preventSyncScroll = true;
    
    viewScrolling = true;
    clearTimeout(viewScrollingTimer);
    viewScrollingTimer = setTimeout(function () {
        viewScrolling = false;
    }, viewScrollingDelay);
}

var scrollMap, lineHeightMap, viewTop, viewBottom;

viewAjaxCallback = clearMap;

function clearMap() {
    scrollMap = null;
    lineHeightMap = null;
    viewTop = null;
    viewBottom = null;
}

var buildMap = _.throttle(buildMapInner, buildMapThrottle);

// Build offsets for each line (lines can be wrapped)
// That's a bit dirty to process each line everytime, but ok for demo.
// Optimizations are required only for big texts.
function buildMapInner(syncBack) {
    var i, offset, nonEmptyList, pos, a, b, _lineHeightMap, linesCount,
        acc, _scrollMap;

    offset = ui.area.view.scrollTop() - ui.area.view.offset().top;
    _scrollMap = [];
    nonEmptyList = [];
    _lineHeightMap = [];
    viewTop = 0;
    viewBottom = ui.area.view[0].scrollHeight - ui.area.view.height();

    acc = 0;
    var lines = editor.getValue().split('\n');
    var lineHeight = editor.defaultTextHeight();
    for (i = 0; i < lines.length; i++) {
        var str = lines[i];

        _lineHeightMap.push(acc);

        if (str.length === 0) {
            acc++;
            continue;
        }

        var h = editor.heightAtLine(i + 1) - editor.heightAtLine(i);
        acc += Math.round(h / lineHeight);
    }
    _lineHeightMap.push(acc);
    linesCount = acc;

    for (i = 0; i < linesCount; i++) {
        _scrollMap.push(-1);
    }

    nonEmptyList.push(0);
    // make the first line go top
    _scrollMap[0] = viewTop;

    var parts = ui.area.markdown.find('.part').toArray();
    for (i = 0; i < parts.length; i++) {
        var $el = $(parts[i]),
            t = $el.attr('data-startline') - 1;
        if (t === '') {
            return;
        }
        t = _lineHeightMap[t];
        if (t !== 0 && t !== nonEmptyList[nonEmptyList.length - 1]) {
            nonEmptyList.push(t);
        }
        _scrollMap[t] = Math.round($el.offset().top + offset - 10);
    }

    nonEmptyList.push(linesCount);
    _scrollMap[linesCount] = ui.area.view[0].scrollHeight;

    pos = 0;
    for (i = 1; i < linesCount; i++) {
        if (_scrollMap[i] !== -1) {
            pos++;
            continue;
        }

        a = nonEmptyList[pos];
        b = nonEmptyList[pos + 1];
        _scrollMap[i] = Math.round((_scrollMap[b] * (i - a) + _scrollMap[a] * (b - i)) / (b - a));
    }

    _scrollMap[0] = 0;

    scrollMap = _scrollMap;
    lineHeightMap = _lineHeightMap;

    if (loaded && syncBack)
        syncScrollToView();
}

function getPartByEditorLineNo(lineNo) {
    var part = null;
    ui.area.markdown.find('.part').each(function (n, el) {
        if (part) return;
        var $el = $(el),
            t = $el.data('startline') - 1,
            f = $el.data('endline') - 1;
        if (t === '' || f === '') {
            return;
        }
        if (lineNo >= t && lineNo <= f) {
            part = $el;
        }
    });
    if (part)
        return {
            startline: part.data('startline') - 1,
            endline: part.data('endline') - 1,
            linediff: Math.abs(part.data('endline') - part.data('startline')) + 1,
            element: part
        };
    else
        return null;
}

function getEditorLineNoByTop(top) {
    for (var i = 0; i < lineHeightMap.length; i++)
        if (lineHeightMap[i] * editor.defaultTextHeight() > top)
            return i;
    return null;
}

function syncScrollToView(event, _lineNo) {
    if (currentMode != modeType.both) return;
    if (preventSyncScroll) {
        if (typeof preventSyncScroll === 'number') {
            preventSyncScroll--;
        } else {
            preventSyncScroll = false;
        }
        return;
    }
    var lineNo, posTo;
    var scrollInfo = editor.getScrollInfo();
    if (!scrollMap || !lineHeightMap) {
        buildMap(true);
        return;
    }
    if (!_lineNo) {
        var topDiffPercent, posToNextDiff;
        var textHeight = editor.defaultTextHeight();
        lineNo = Math.floor(scrollInfo.top / textHeight);
        // if reach the last line, will start lerp to the bottom
        var diffToBottom = (scrollInfo.top + scrollInfo.clientHeight) - (scrollInfo.height - textHeight);
        if (scrollInfo.height > scrollInfo.clientHeight && diffToBottom > 0) {
            topDiffPercent = diffToBottom / textHeight;
            posTo = scrollMap[lineNo + 1];
            posToNextDiff = (viewBottom - posTo) * topDiffPercent;
            posTo += Math.floor(posToNextDiff);
        } else {
            topDiffPercent = (scrollInfo.top % textHeight) / textHeight;
            posTo = scrollMap[lineNo];
            posToNextDiff = (scrollMap[lineNo + 1] - posTo) * topDiffPercent;
            posTo += Math.floor(posToNextDiff);
        }
    } else {
        if (viewScrolling) return;
        posTo = scrollMap[lineHeightMap[_lineNo]];
    }
    ui.area.view.stop(true, true).scrollTop(posTo);
    preventViewScroll = true;
    
    editScrolling = true;
    clearTimeout(editScrollingTimer);
    editScrollingTimer = setTimeout(function () {
        editScrolling = false;
    }, editScrollingDelay);
}