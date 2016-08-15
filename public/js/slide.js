var body = $(".slides").html();
$(".slides").html(S(body).unescapeHTML().s);

createtime = lastchangeui.time.attr('data-createtime');
lastchangetime = lastchangeui.time.attr('data-updatetime');
updateLastChange();
var url = window.location.pathname;
$('.ui-edit').attr('href', url + '/edit');

$(document).ready(function () {
    //tooltip
    $('[data-toggle="tooltip"]').tooltip();
});

function extend() {
    var target = {};
    for (var i = 0; i < arguments.length; i++) {
        var source = arguments[i];
        for (var key in source) {
            if (source.hasOwnProperty(key)) {
                target[key] = source[key];
            }
        }
    }
    return target;
}

// Optional libraries used to extend on reveal.js
var deps = [{
    src: serverurl + '/vendor/reveal.js/lib/js/classList.js',
    condition: function() {
        return !document.body.classList;
    }
}, {
    src: serverurl + '/js/reveal-markdown.js',
    condition: function() {
        return !!document.querySelector('[data-markdown]');
    }
}, {
    src: serverurl + '/vendor/reveal.js/plugin/notes/notes.js',
    async: true,
    condition: function() {
        return !!document.body.classList;
    }
}];

// default options to init reveal.js
var defaultOptions = {
    controls: true,
    progress: true,
    slideNumber: true,
    history: true,
    center: true,
    transition: 'none',
    dependencies: deps
};

// options from yaml meta
var meta = JSON.parse($("#meta").text());
var options = meta.slideOptions || {};

var view = $('.reveal');

//text language
if (meta.lang && typeof meta.lang == "string") {
    view.attr('lang', meta.lang);
} else {
    view.removeAttr('lang');
}
//text direction
if (meta.dir && typeof meta.dir == "string" && meta.dir == "rtl") {
    options.rtl = true;
} else {
    options.rtl = false;
}
//breaks
if (typeof meta.breaks === 'boolean' && !meta.breaks) {
    md.options.breaks = false;
} else {
    md.options.breaks = true;
}

// options from URL query string
var queryOptions = Reveal.getQueryHash() || {};

var options = extend(defaultOptions, options, queryOptions);
Reveal.initialize(options);

viewAjaxCallback = function () {
    Reveal.layout();
};

function renderSlide(event) {
    var markdown = $(event.currentSlide);
    if (!markdown.attr('data-rendered')) {
        var title = document.title;
        finishView(markdown);
        markdown.attr('data-rendered', 'true');
        document.title = title;
        Reveal.layout();
    }
}

Reveal.addEventListener('ready', function (event) {
    renderSlide(event);
    var markdown = $(event.currentSlide);
    // force browser redraw
    setTimeout(function () {
        markdown.hide().show(0);
    }, 0);
});
Reveal.addEventListener('slidechanged', renderSlide);

var isMacLike = navigator.platform.match(/(Mac|iPhone|iPod|iPad)/i) ? true : false;

if (!isMacLike) $('.container').addClass('hidescrollbar');
