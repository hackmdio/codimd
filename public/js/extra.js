//get title
function getTitle(view) {
    var h1s = view.find("h1");
    var title = "";
    if (h1s.length > 0)  {
        title = h1s.first().text();
    } else {
        title = null;
    }
    return title;
}
//render title
function renderTitle(view) {
    var title = getTitle(view);
    if (title)  {
        title += ' - HackMD';
    } else {
        title = 'HackMD - Collaborative notes';
    }
    return title;
}
//render filename
function renderFilename(view) {
    var filename = getTitle(view);
    if (!filename)  {
        filename = 'Untitled';
    }
    return filename;
}

var viewAjaxCallback = null;

//dynamic event or object binding here
function finishView(view) {
    //youtube
    view.find(".youtube").click(function () {
        imgPlayiframe(this, '//www.youtube.com/embed/');
    });
    //vimeo
    view.find(".vimeo")
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
    view.find("code[data-gist-id]").each(function(key, value) {
        if($(value).children().length == 0)
            $(value).gist(viewAjaxCallback);
    });
    //emojify
    emojify.run(view[0]);
    //mathjax
    var mathjaxdivs = view.find('.mathjax').toArray();
    try {
        for (var i = 0; i < mathjaxdivs.length; i++) {
            MathJax.Hub.Queue(["Typeset", MathJax.Hub, mathjaxdivs[i].innerHTML]);
            MathJax.Hub.Queue(viewAjaxCallback);
            $(mathjaxdivs[i]).removeClass("mathjax");
        }
    } catch(err) {
    }
    //sequence diagram
    var sequence = view.find(".sequence-diagram");
    try {
        sequence.sequenceDiagram({
            theme: 'simple'
        });
        sequence.parent().parent().replaceWith(sequence);
        sequence.removeClass("sequence-diagram");
    } catch(err) {
        console.error(err);
    }
    //flowchart
    var flow = view.find(".flow-chart");
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
            $(value).removeClass("flow-chart");
        } catch(err) {
            console.error(err);
        }
    });
    //render title
    document.title = renderTitle(view);
}

//regex for blockquote
var spaceregex = /\s*/;
var notinhtmltagregex = /(?![^<]*>|[^<>]*<\/)/;
var coloregex = /\[color=([#|\(|\)|\s|\,|\w]*)\]/;
coloregex = new RegExp(coloregex.source + notinhtmltagregex.source, "g");
var nameregex = /\[name=([-|_|\s|\w]*)\]/;
var timeregex = /\[time=([:|,|+|-|\(|\)|\s|\w]*)\]/;
var nameandtimeregex = new RegExp(nameregex.source + spaceregex.source + timeregex.source + notinhtmltagregex.source, "g");
nameregex = new RegExp(nameregex.source + notinhtmltagregex.source, "g");
timeregex = new RegExp(timeregex.source + notinhtmltagregex.source, "g");

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
    var lis = result[0].getElementsByTagName('li');
    for (var i = 0; i < lis.length; i++) {
        var html = lis[i].innerHTML;
        if (/^\s*\[[x ]\]\s+/.test(html)) {
            lis[i].innerHTML = html.replace(/^\s*\[ \]\s*/, '<input type="checkbox" class="task-list-item-checkbox" disabled>')
                .replace(/^\s*\[x\]\s*/, '<input type="checkbox" class="task-list-item-checkbox" checked disabled>');
            lis[i].setAttribute('class', 'task-list-item');
        }
    }
    //blockquote
    var blockquote = result.find("blockquote");
    blockquote.each(function (key, value) {
        var html = $(value).html();
        html = html.replace(coloregex, '<span class="color" data-color="$1"></span>');
        html = html.replace(nameandtimeregex, '<small><i class="fa fa-user"></i> $1 <i class="fa fa-clock-o"></i> $2</small>');
        html = html.replace(nameregex, '<small><i class="fa fa-user"></i> $1</small>');
        html = html.replace(timeregex, '<small><i class="fa fa-clock-o"></i> $1</small>');
        $(value).html(html);
    });
    var blockquotecolor = result.find("blockquote .color");
    blockquotecolor.each(function (key, value) {
        $(value).closest("blockquote").css('border-left-color', $(value).attr('data-color'));
    });
    return result;
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
    anchor.className = "header-link";
    anchor.href = "#" + id;
    anchor.innerHTML = "<span class=\"sr-only\">Permalink</span><i class=\"fa fa-link\"></i>";
    anchor.title = "Permalink";
    return anchor;
};

var linkifyAnchors = function (level, containingElement) {
    var headers = containingElement.getElementsByTagName("h" + level);
    for (var h = 0; h < headers.length; h++) {
        var header = headers[h];

        if (typeof header.id == "undefined" || header.id == "") {
            var id = S(header.innerHTML.toLowerCase()).trim().stripTags().dasherize().s;
            header.id = encodeURIComponent(id);
        }
        header.appendChild(anchorForId(header.id));
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
    if(lang == 'sequence') {
        return '<div class="sequence-diagram">' + code + '</div>';
    } else if(lang == 'flow') {
        return '<div class="flow-chart">' + code + '</div>';
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
    linkify: true,
    typographer: true,
    highlight: highlightRender
});
//youtube
var youtubePlugin = new Plugin(
    // regexp to match
    /{%youtube\s*([\d\D]*?)\s*%}/,

    // this function will be called when something matches
    function (match, utils) {
        var videoid = match[1];
        if (!videoid) return;
        var div = $('<div class="youtube"></div>');
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
        var div = $('<div class="vimeo"></div>');
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
        return '<span class="mathjax">' + match[0] + '</span>';
    }
);
md.use(youtubePlugin);
md.use(vimeoPlugin);
md.use(gistPlugin);
md.use(mathjaxPlugin);