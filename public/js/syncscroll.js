//
// Inject line numbers for sync scroll. Notes:
//
// - We track only headings and paragraphs on first level. That's enougth.
// - Footnotes content causes jumps. Level limit filter it automatically.
//
md.renderer.rules.blockquote_open = function (tokens, idx /*, options, env */ ) {
    if (tokens[idx].lines && tokens[idx].level === 0) {
        var startline = tokens[idx].lines[0] + 1;
        var endline = tokens[idx].lines[1];
        return '<blockquote class="part" data-startline="' + startline + '" data-endline="' + endline + '">\n';
    }
    return '<blockquote>\n';
};

md.renderer.rules.table_open = function (tokens, idx /*, options, env */ ) {
    if (tokens[idx].lines && tokens[idx].level === 0) {
        var startline = tokens[idx].lines[0] + 1;
        var endline = tokens[idx].lines[1];
        return '<table class="part" data-startline="' + startline + '" data-endline="' + endline + '">\n';
    }
    return '<table>\n';
};

md.renderer.rules.bullet_list_open = function (tokens, idx /*, options, env */ ) {
    if (tokens[idx].lines && tokens[idx].level === 0) {
        var startline = tokens[idx].lines[0] + 1;
        var endline = tokens[idx].lines[1];
        return '<ul class="part" data-startline="' + startline + '" data-endline="' + endline + '">\n';
    }
    return '<ul>\n';
};

md.renderer.rules.ordered_list_open = function (tokens, idx /*, options, env */ ) {
    var token = tokens[idx];
    if (tokens[idx].lines && tokens[idx].level === 0) {
        var startline = tokens[idx].lines[0] + 1;
        var endline = tokens[idx].lines[1];
        return '<ol class="part" data-startline="' + startline + '" data-endline="' + endline + '"' + (token.order > 1 ? ' start="' + token.order + '"' : '') + '>\n';
    }
    return '<ol' + (token.order > 1 ? ' start="' + token.order + '"' : '') + '>\n';
};

md.renderer.rules.link_open = function (tokens, idx /*, options, env */ ) {
    var title = tokens[idx].title ? (' title="' + Remarkable.utils.escapeHtml(Remarkable.utils.replaceEntities(tokens[idx].title)) + '"') : '';
    if (tokens[idx].lines && tokens[idx].level === 0) {
        var startline = tokens[idx].lines[0] + 1;
        var endline = tokens[idx].lines[1];
        return '<a class="part" data-startline="' + startline + '" data-endline="' + endline + '" href="' + Remarkable.utils.escapeHtml(tokens[idx].href) + '"' + title + '>';
    }
    return '<a href="' + Remarkable.utils.escapeHtml(tokens[idx].href) + '"' + title + '>';
};

md.renderer.rules.paragraph_open = function (tokens, idx) {
    if (tokens[idx].lines && tokens[idx].level === 0) {
        var startline = tokens[idx].lines[0] + 1;
        var endline = tokens[idx].lines[1];
        return '<p class="part" data-startline="' + startline + '" data-endline="' + endline + '">';
    }
    return '';
};

md.renderer.rules.heading_open = function (tokens, idx) {
    if (tokens[idx].lines && tokens[idx].level === 0) {
        var startline = tokens[idx].lines[0] + 1;
        var endline = tokens[idx].lines[1];
        return '<h' + tokens[idx].hLevel + ' class="part" data-startline="' + startline + '" data-endline="' + endline + '">';
    }
    return '<h' + tokens[idx].hLevel + '>';
};

md.renderer.rules.image = function (tokens, idx, options /*, env */ ) {
    var src = ' src="' + Remarkable.utils.escapeHtml(tokens[idx].src) + '"';
    var title = tokens[idx].title ? (' title="' + Remarkable.utils.escapeHtml(Remarkable.utils.replaceEntities(tokens[idx].title)) + '"') : '';
    var alt = ' alt="' + (tokens[idx].alt ? Remarkable.utils.escapeHtml(Remarkable.utils.replaceEntities(tokens[idx].alt)) : '') + '"';
    var suffix = options.xhtmlOut ? ' /' : '';
    var image = $('<img' + src + alt + title + suffix + '>');
    image[0].onload = function (e) {
        if (viewAjaxCallback)
            viewAjaxCallback();
    };
    return image[0].outerHTML;
};

md.renderer.rules.fence = function (tokens, idx, options, env, self) {
    var token = tokens[idx];
    var langClass = '';
    var langPrefix = options.langPrefix;
    var langName = '',
        fenceName;
    var highlighted;

    if (token.params) {

        //
        // ```foo bar
        //
        // Try custom renderer "foo" first. That will simplify overwrite
        // for diagrams, latex, and any other fenced block with custom look
        //

        fenceName = token.params.split(/\s+/g)[0];

        if (Remarkable.utils.has(self.rules.fence_custom, fenceName)) {
            return self.rules.fence_custom[fenceName](tokens, idx, options, env, self);
        }

        langName = Remarkable.utils.escapeHtml(Remarkable.utils.replaceEntities(Remarkable.utils.unescapeMd(fenceName)));
        langClass = ' class="' + langPrefix + langName + '"';
    }

    if (options.highlight) {
        highlighted = options.highlight(token.content, langName) || Remarkable.utils.escapeHtml(token.content);
    } else {
        highlighted = Remarkable.utils.escapeHtml(token.content);
    }

    if (tokens[idx].lines && tokens[idx].level === 0) {
        var startline = tokens[idx].lines[0] + 1;
        var endline = tokens[idx].lines[1];
        return '<pre class="part" data-startline="' + startline + '" data-endline="' + endline + '"><code' + langClass + '>' + highlighted + '</code></pre>' + md.renderer.getBreak(tokens, idx);
    }

    return '<pre><code' + langClass + '>' + highlighted + '</code></pre>' + md.renderer.getBreak(tokens, idx);
};

md.renderer.rules.code = function (tokens, idx /*, options, env */ ) {
    if (tokens[idx].block) {
        if (tokens[idx].lines && tokens[idx].level === 0) {
            var startline = tokens[idx].lines[0] + 1;
            var endline = tokens[idx].lines[1];
            return '<pre class="part" data-startline="' + startline + '" data-endline="' + endline + '"><code>' + Remarkable.utils.escapeHtml(tokens[idx].content) + '</code></pre>' + md.renderer.getBreak(tokens, idx);
        }

        return '<pre><code>' + Remarkable.utils.escapeHtml(tokens[idx].content) + '</code></pre>' + md.renderer.getBreak(tokens, idx);
    }

    if (tokens[idx].lines && tokens[idx].level === 0) {
        var startline = tokens[idx].lines[0] + 1;
        var endline = tokens[idx].lines[1];
        return '<code class="part" data-startline="' + startline + '" data-endline="' + endline + '">' + Remarkable.utils.escapeHtml(tokens[idx].content) + '</code>';
    }

    return '<code>' + Remarkable.utils.escapeHtml(tokens[idx].content) + '</code>';
};

var viewScrolling = false;
var viewScrollingDelay = 200;
var viewScrollingTimer = null;

editor.on('scroll', syncScrollToView);
ui.area.view.on('scroll', function () {
    viewScrolling = true;
    clearTimeout(viewScrollingTimer);
    viewScrollingTimer = setTimeout(function () {
        viewScrolling = false;
    }, viewScrollingDelay);
});
//editor.on('scroll', _.debounce(syncScrollToView, syncScrollDelay));
//ui.area.view.on('scroll', _.debounce(syncScrollToEdit, 50));

var scrollMap, lineHeightMap;

viewAjaxCallback = clearMap;

function clearMap() {
    scrollMap = null;
    lineHeightMap = null;
}

// Build offsets for each line (lines can be wrapped)
// That's a bit dirty to process each line everytime, but ok for demo.
// Optimizations are required only for big texts.
function buildMap() {
    var i, offset, nonEmptyList, pos, a, b, _lineHeightMap, linesCount,
        acc, sourceLikeDiv, textarea = ui.area.codemirror,
        wrap = $('.CodeMirror-wrap pre'),
        _scrollMap;

    sourceLikeDiv = $('<div />').css({
        position: 'absolute',
        visibility: 'hidden',
        height: 'auto',
        width: wrap.width(),
        padding: wrap.css('padding'),
        margin: wrap.css('margin'),
        'font-size': textarea.css('font-size'),
        'font-family': textarea.css('font-family'),
        'line-height': textarea.css('line-height'),
        'word-wrap': wrap.css('word-wrap'),
        'white-space': wrap.css('white-space'),
        'word-break': wrap.css('word-break')
    }).appendTo('body');

    offset = ui.area.view.scrollTop() - ui.area.view.offset().top;
    _scrollMap = [];
    nonEmptyList = [];
    _lineHeightMap = [];

    acc = 0;
    editor.getValue().split('\n').forEach(function (str) {
        var h, lh;

        _lineHeightMap.push(acc);

        if (str.length === 0) {
            acc++;
            return;
        }

        sourceLikeDiv.text(str);
        h = parseFloat(sourceLikeDiv.css('height'));
        lh = parseFloat(sourceLikeDiv.css('line-height'));
        acc += Math.round(h / lh);
    });
    sourceLikeDiv.remove();
    _lineHeightMap.push(acc);
    linesCount = acc;

    for (i = 0; i < linesCount; i++) {
        _scrollMap.push(-1);
    }

    nonEmptyList.push(0);
    _scrollMap[0] = 0;

    ui.area.markdown.find('.part').each(function (n, el) {
        var $el = $(el),
            t = $el.data('startline') - 1;
        if (t === '') {
            return;
        }
        t = _lineHeightMap[t];
        if (t !== 0) {
            nonEmptyList.push(t);
        }
        _scrollMap[t] = Math.round($el.offset().top + offset);
    });

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

function syncScrollToView(_lineNo) {
    var lineNo, posTo;
    var scrollInfo = editor.getScrollInfo();
    if (!scrollMap || !lineHeightMap) {
        buildMap();
    }
    if (typeof _lineNo != "number") {
        var topDiffPercent, posToNextDiff;
        var textHeight = editor.defaultTextHeight();
        lineNo = Math.floor(scrollInfo.top / textHeight);
        var lineCount = editor.lineCount();
        var lastLineHeight = editor.getLineHandle(lineCount - 1).height;
        //if reach last line, then scroll to end
        if (scrollInfo.top + scrollInfo.clientHeight >= scrollInfo.height - lastLineHeight) {
            posTo = ui.area.view[0].scrollHeight - ui.area.view.height();
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
    var posDiff = Math.abs(ui.area.view.scrollTop() - posTo);
    if (posDiff > scrollInfo.clientHeight / 5) {
        var duration = posDiff / 50;
        ui.area.view.stop(true).animate({
            scrollTop: posTo
        }, duration >= 50 ? duration : 100, "linear");
    } else {
        ui.area.view.stop(true).scrollTop(posTo);
    }
}