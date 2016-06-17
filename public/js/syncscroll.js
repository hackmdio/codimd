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

var syncscroll = true;

var preventSyncScrollToEdit = false;
var preventSyncScrollToView = false;

var editScrollThrottle = 5;
var viewScrollThrottle = 5;
var buildMapThrottle = 100;

var viewScrolling = false;
var editScrolling = false;

ui.area.codemirrorScroll.on('scroll', _.throttle(syncScrollToView, editScrollThrottle));
ui.area.view.on('scroll', _.throttle(syncScrollToEdit, viewScrollThrottle));

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
function buildMapInner(callback) {
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

    if (loaded && callback) callback();
}

// sync view scroll progress to edit
var viewScrollingTimer = null;

function syncScrollToEdit(event, preventAnimate) {
    if (currentMode != modeType.both || !syncscroll) return;
    if (preventSyncScrollToEdit) {
        if (typeof preventSyncScrollToEdit === 'number') {
            preventSyncScrollToEdit--;
        } else {
            preventSyncScrollToEdit = false;
        }
        return;
    }
    if (!scrollMap || !lineHeightMap) {
        buildMap(function () {
            syncScrollToEdit(event, preventAnimate);
        });
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
    
    var posTo = 0;
    var topDiffPercent = 0;
    var posToNextDiff = 0;
    var scrollInfo = editor.getScrollInfo();
    var textHeight = editor.defaultTextHeight();
    var preLastLineHeight = scrollInfo.height - scrollInfo.clientHeight - textHeight;
    var preLastLineNo = Math.round(preLastLineHeight / textHeight);
    var preLastLinePos = scrollMap[preLastLineNo];
    
    if (scrollInfo.height > scrollInfo.clientHeight && scrollTop >= preLastLinePos) {
        posTo = preLastLineHeight;
        topDiffPercent = (scrollTop - preLastLinePos) / (viewBottom - preLastLinePos);
        posToNextDiff = textHeight * topDiffPercent;
        posTo += Math.ceil(posToNextDiff);
    } else {
        posTo = lineNo * textHeight;
        topDiffPercent = (scrollTop - scrollMap[lineNo]) / (scrollMap[lineNo + lineDiff] - scrollMap[lineNo]);
        posToNextDiff = textHeight * lineDiff * topDiffPercent;
        posTo += Math.ceil(posToNextDiff);
    }
    
    if (preventAnimate) {
        ui.area.codemirrorScroll.scrollTop(posTo);
    } else {
        var posDiff = Math.abs(scrollInfo.top - posTo);
        var duration = posDiff / 50;
        duration = duration >= 100 ? duration : 100;
        ui.area.codemirrorScroll.stop(true, true).animate({
            scrollTop: posTo
        }, duration, "linear");
    }
    
    viewScrolling = true;
    clearTimeout(viewScrollingTimer);
    viewScrollingTimer = setTimeout(viewScrollingTimeoutInner, duration * 1.5);
}

function viewScrollingTimeoutInner() {
    viewScrolling = false;
}

// sync edit scroll progress to view
var editScrollingTimer = null;

function syncScrollToView(event, preventAnimate) {
    if (currentMode != modeType.both || !syncscroll) return;
    if (preventSyncScrollToView) {
        if (typeof preventSyncScrollToView === 'number') {
            preventSyncScrollToView--;
        } else {
            preventSyncScrollToView = false;
        }
        return;
    }
    if (!scrollMap || !lineHeightMap) {
        buildMap(function () {
            syncScrollToView(event, preventAnimate);
        });
        return;
    }
    if (viewScrolling) return;
    
    var lineNo, posTo;
    var topDiffPercent, posToNextDiff;
    var scrollInfo = editor.getScrollInfo();
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
    
    if (preventAnimate) {
        ui.area.view.scrollTop(posTo);
    } else {
        var posDiff = Math.abs(ui.area.view.scrollTop() - posTo);
        var duration = posDiff / 50;
        duration = duration >= 100 ? duration : 100;
        ui.area.view.stop(true, true).animate({
            scrollTop: posTo
        }, duration, "linear");
    }
    
    editScrolling = true;
    clearTimeout(editScrollingTimer);
    editScrollingTimer = setTimeout(editScrollingTimeoutInner, duration * 1.5);
}

function editScrollingTimeoutInner() {
    editScrolling = false;
}