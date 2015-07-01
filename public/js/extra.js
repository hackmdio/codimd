//auto update last change
var lastchangetime = null;
var lastchangeui = null;

function updateLastChange() {
    if (lastchangetime && lastchangeui) {
        lastchangeui.html('&nbsp;<i class="fa fa-clock-o"></i> change ' + moment(lastchangetime).fromNow());
        lastchangeui.attr('title', moment(lastchangetime).format('llll'));
    }
}
setInterval(updateLastChange, 60000);

//get title
function getTitle(view) {
    var h1s = view.find("h1");
    var title = "";
    if (h1s.length > 0) {
        title = h1s.first().text();
    } else {
        title = null;
    }
    return title;
}

//render title
function renderTitle(view) {
    var title = getTitle(view);
    if (title) {
        title += ' - HackMD';
    } else {
        title = 'HackMD - Collaborative notes';
    }
    return title;
}

//render filename
function renderFilename(view) {
    var filename = getTitle(view);
    if (!filename) {
        filename = 'Untitled';
    }
    return filename;
}

function slugifyWithUTF8(text) {
    var newText = S(text.toLowerCase()).trim().stripTags().dasherize().s;
    newText = newText.replace(/([\!\"\#\$\%\&\'\(\)\*\+\,\.\/\:\;\<\=\>\?\@\[\\\]\^\`\{\|\}\~])/g, '');
    return newText;
}

var viewAjaxCallback = null;

//regex for blockquote
var spaceregex = /\s*/;
var notinhtmltagregex = /(?![^<]*>|[^<>]*<\/)/;
var coloregex = /\[color=([#|\(|\)|\s|\,|\w]*?)\]/;
coloregex = new RegExp(coloregex.source + notinhtmltagregex.source, "g");
var nameregex = /\[name=(.*?)\]/;
var timeregex = /\[time=([:|,|+|-|\(|\)|\s|\w]*?)\]/;
var nameandtimeregex = new RegExp(nameregex.source + spaceregex.source + timeregex.source + notinhtmltagregex.source, "g");
nameregex = new RegExp(nameregex.source + notinhtmltagregex.source, "g");
timeregex = new RegExp(timeregex.source + notinhtmltagregex.source, "g");

//dynamic event or object binding here
function finishView(view) {
    //youtube
    view.find(".youtube.raw").removeClass("raw")
        .click(function () {
            imgPlayiframe(this, '//www.youtube.com/embed/');
        });
    //vimeo
    view.find(".vimeo.raw").removeClass("raw")
        .click(function () {
            imgPlayiframe(this, '//player.vimeo.com/video/');
        })
        .each(function (key, value) {
            $.ajax({
                type: 'GET',
                url: '//vimeo.com/api/v2/video/' + $(value).attr('videoid') + '.json',
                jsonp: 'callback',
                dataType: 'jsonp',
                success: function (data) {
                    var thumbnail_src = data[0].thumbnail_large;
                    $(value).css('background-image', 'url(' + thumbnail_src + ')');
                }
            });
        });
    //gist
    view.find("code[data-gist-id]").each(function (key, value) {
        if ($(value).children().length == 0)
            $(value).gist(viewAjaxCallback);
    });
    //emojify
    emojify.run(view[0]);
    //mathjax
    var mathjaxdivs = view.find('.mathjax.raw').removeClass("raw").toArray();
    try {
        for (var i = 0; i < mathjaxdivs.length; i++) {
            MathJax.Hub.Queue(["Typeset", MathJax.Hub, mathjaxdivs[i].innerHTML]);
            MathJax.Hub.Queue(viewAjaxCallback);
        }
    } catch (err) {}
    //sequence diagram
    var sequence = view.find(".sequence-diagram.raw").removeClass("raw");
    try {
        sequence.sequenceDiagram({
            theme: 'simple'
        });
        sequence.parent().parent().replaceWith(sequence);
    } catch (err) {
        console.error(err);
    }
    //flowchart
    var flow = view.find(".flow-chart.raw").removeClass("raw");
    flow.each(function (key, value) {
        try {
            var chart = flowchart.parse($(value).text());
            $(value).html('');
            chart.drawSVG(value, {
                'line-width': 2,
                'fill': 'none',
                'font-size': '16px',
                'font-family': "'Andale Mono', monospace"
            });
            $(value).parent().parent().replaceWith(value);
        } catch (err) {
            console.error(err);
        }
    });
    //image href new window(emoji not included)
    var images = view.find("p > img[src]:not([class])");
    images.each(function (key, value) {
        var src = $(value).attr('src');
        var a = $('<a>');
        if (src) {
            a.attr('href', src);
            a.attr('target', "_blank");
        }
        a.html($(value).clone());
        $(value).replaceWith(a);
    });
    //blockquote
    var blockquote = view.find("blockquote.raw").removeClass("raw");
    var blockquote_p = blockquote.find("p");
    blockquote_p.each(function (key, value) {
        var html = $(value).html();
        html = html.replace(coloregex, '<span class="color" data-color="$1"></span>');
        html = html.replace(nameandtimeregex, '<small><i class="fa fa-user"></i> $1 <i class="fa fa-clock-o"></i> $2</small>');
        html = html.replace(nameregex, '<small><i class="fa fa-user"></i> $1</small>');
        html = html.replace(timeregex, '<small><i class="fa fa-clock-o"></i> $1</small>');
        $(value).html(html);
    });
    var blockquote_color = blockquote.find(".color");
    blockquote_color.each(function (key, value) {
        $(value).closest("blockquote").css('border-left-color', $(value).attr('data-color'));
    });
    //render title
    document.title = renderTitle(view);
}

//only static transform should be here
function postProcess(code) {
    var result = $('<div>' + code + '</div>');
    //prevent XSS
    result.find("script").replaceWith(function () {
        return "<noscript>" + $(this).html() + "</noscript>"
    });
    result.find("iframe").replaceWith(function () {
        return "<noiframe>" + $(this).html() + "</noiframe>"
    });
    //todo list
    var lis = result.find('li.raw').removeClass("raw").sortByDepth().toArray();
    for (var i = 0; i < lis.length; i++) {
        var li = lis[i];
        var html = $(li).clone()[0].innerHTML;
        var p = $(li).children('p');
        if (p.length == 1) {
            html = p.html();
            li = p[0];
        }
        if (/^\s*\[[x ]\]\s*/.test(html)) {
            li.innerHTML = html.replace(/^\s*\[ \]\s*/, '<input type="checkbox" class="task-list-item-checkbox" disabled><label></label>')
                .replace(/^\s*\[x\]\s*/, '<input type="checkbox" class="task-list-item-checkbox" checked disabled><label></label>');
            lis[i].setAttribute('class', 'task-list-item');
        }
    }
    return result;
}

//jQuery sortByDepth
$.fn.sortByDepth = function () {
    var ar = this.map(function () {
            return {
                length: $(this).parents().length,
                elt: this
            }
        }).get(),
        result = [],
        i = ar.length;
    ar.sort(function (a, b) {
        return a.length - b.length;
    });
    while (i--) {
        result.push(ar[i].elt);
    }
    return $(result);
};

//remove hash
function removeHash() {
    history.pushState("", document.title, window.location.pathname + window.location.search);
}

//toc
function generateToc(id) {
    var target = $('#' + id);
    target.html('');
    new Toc('doc', {
        'level': 3,
        'top': -1,
        'class': 'toc',
        'targetId': id
    });
    if(target.text() == 'undefined')
        target.html('');
    var backtotop = $('<a class="back-to-top" href="#">Back to top</a>');
    var gotobottom = $('<a class="go-to-bottom" href="#">Go to bottom</a>');
    backtotop.click(function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (scrollToTop)
            scrollToTop();
        removeHash();
    });
    gotobottom.click(function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (scrollToBottom)
            scrollToBottom();
        removeHash();
    });
    target.append(backtotop).append(gotobottom);
}

//smooth all hash trigger scrolling
function smoothHashScroll() {
    var hashElements = $("a[href^='#']:not([smoothhashscroll])").toArray();
    for (var i = 0; i < hashElements.length; i++) {
        var element = hashElements[i];
        var $element = $(element);
        var hash = element.hash;
        if (hash) {
            $element.on('click', function (e) {
                // store hash
                var hash = this.hash;
                if ($(hash).length <= 0) return;
                // prevent default anchor click behavior
                e.preventDefault();
                // animate
                $('html, body').animate({
                    scrollTop: $(hash).offset().top
                }, 100, "linear", function () {
                    // when done, add hash to url
                    // (default click behaviour)
                    window.location.hash = hash;
                });
            });
            $element.attr('smoothhashscroll', '');
        }
    }
}

function setSizebyAttr(element, target) {
    var width = $(element).attr("width") ? $(element).attr("width") : '100%';
    var height = $(element).attr("height") ? $(element).attr("height") : '360px';
    $(target).width(width);
    $(target).height(height);
}

function imgPlayiframe(element, src) {
    if (!$(element).attr("videoid")) return;
    var iframe = $("<iframe frameborder='0' webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>");
    $(iframe).attr("src", src + $(element).attr("videoid") + '?autoplay=1');
    setSizebyAttr(element, iframe);
    $(element).html(iframe);
}

var anchorForId = function (id) {
    var anchor = document.createElement("a");
    anchor.className = "header-link hidden-xs";
    anchor.href = "#" + id;
    anchor.innerHTML = "<span class=\"sr-only\"></span><i class=\"fa fa-link\"></i>";
    anchor.title = id;
    return anchor;
};

var linkifyAnchors = function (level, containingElement) {
    var headers = containingElement.getElementsByTagName("h" + level);
    for (var h = 0; h < headers.length; h++) {
        var header = headers[h];
        if (header.getElementsByClassName("header-link").length == 0) {
            if (typeof header.id == "undefined" || header.id == "") {
                //to escape characters not allow in css and humanize
                var id = slugifyWithUTF8(header.innerHTML);
                header.id = id;
            }
            header.appendChild(anchorForId(header.id));
        }
    }
};

function autoLinkify(view) {
    var contentBlock = view[0];
    if (!contentBlock) {
        return;
    }
    for (var level = 1; level <= 6; level++) {
        linkifyAnchors(level, contentBlock);
    }
};

function scrollToHash() {
    var hash = location.hash;
    location.hash = "";
    location.hash = hash;
}

function highlightRender(code, lang) {
    if (!lang || /no(-?)highlight|plain|text/.test(lang))
        return;
    if (lang == 'sequence') {
        return '<div class="sequence-diagram raw">' + code + '</div>';
    } else if (lang == 'flow') {
        return '<div class="flow-chart raw">' + code + '</div>';
    }
    var reallang = lang.replace('=', '');
    var languages = hljs.listLanguages();
    if (languages.indexOf(reallang) == -1) {
        var result = hljs.highlightAuto(code);
    } else {
        var result = hljs.highlight(reallang, code);
    }
    if (/\=$/.test(lang)) {
        var lines = result.value.split('\n');
        var linenumbers = [];
        for (var i = 0; i < lines.length - 1; i++) {
            linenumbers[i] = "<div class='linenumber'>" + (i + 1) + "</div>";
        }
        var linegutter = "<div class='gutter'>" + linenumbers.join('\n') + "</div>";
        result.value = "<div class='wrapper'>" + linegutter + "<div class='code'>" + result.value + "</div></div>";
    }
    return result.value;
}

emojify.setConfig({
    img_dir: '/vendor/emojify/images',
    ignore_emoticons: true
});

var md = new Remarkable('full', {
    html: true,
    breaks: true,
    langPrefix: "",
    linkify: true,
    typographer: true,
    highlight: highlightRender
});
md.renderer.rules.list_item_open = function (/* tokens, idx, options, env */) {
  return '<li class="raw">';
};
md.renderer.rules.blockquote_open = function (tokens, idx /*, options, env */ ) {
    return '<blockquote class="raw">\n';
};
md.renderer.rules.hardbreak = function (tokens, idx, options /*, env */ ) {
    return md.options.xhtmlOut ? '<br /><br />' : '<br><br>';
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
        langClass = ' class="' + langPrefix + langName.replace('=', '') + ' hljs"';
    }

    if (options.highlight) {
        highlighted = options.highlight(token.content, langName) || Remarkable.utils.escapeHtml(token.content);
    } else {
        highlighted = Remarkable.utils.escapeHtml(token.content);
    }

    return '<pre><code' + langClass + '>' + highlighted + '</code></pre>' + md.renderer.getBreak(tokens, idx);
};
//youtube
var youtubePlugin = new Plugin(
    // regexp to match
    /{%youtube\s*([\d\D]*?)\s*%}/,

    // this function will be called when something matches
    function (match, utils) {
        var videoid = match[1];
        if (!videoid) return;
        var div = $('<div class="youtube raw"></div>');
        setSizebyAttr(div, div);
        div.attr('videoid', videoid);
        var icon = '<i class="icon fa fa-youtube-play fa-5x"></i>';
        div.append(icon);
        var thumbnail_src = '//img.youtube.com/vi/' + videoid + '/hqdefault.jpg';
        div.css('background-image', 'url(' + thumbnail_src + ')');
        return div[0].outerHTML;
    }
);
//vimeo
var vimeoPlugin = new Plugin(
    // regexp to match
    /{%vimeo\s*([\d\D]*?)\s*%}/,

    // this function will be called when something matches
    function (match, utils) {
        var videoid = match[1];
        if (!videoid) return;
        var div = $('<div class="vimeo raw"></div>');
        setSizebyAttr(div, div);
        div.attr('videoid', videoid);
        var icon = '<i class="icon fa fa-vimeo-square fa-5x"></i>';
        div.append(icon);
        return div[0].outerHTML;
    }
);
//gist
var gistPlugin = new Plugin(
    // regexp to match
    /{%gist\s*([\d\D]*?)\s*%}/,

    // this function will be called when something matches
    function (match, utils) {
        var gistid = match[1];
        var code = '<code data-gist-id="' + gistid + '"/>';
        return code;
    }
);
//mathjax
var mathjaxPlugin = new Plugin(
    // regexp to match
    /^\$\$\n([\d\D]*?)\n\$\$$|\$([\d\D]*?)\$/,

    // this function will be called when something matches
    function (match, utils) {
        //var code = $(match).text();
        return '<span class="mathjax raw">' + match[0] + '</span>';
    }
);
md.use(youtubePlugin);
md.use(vimeoPlugin);
md.use(gistPlugin);
md.use(mathjaxPlugin);