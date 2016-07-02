var body = $(".slides").html();
$(".slides").html(S(body).unescapeHTML().s);

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

// options from URL query string
var queryOptions = Reveal.getQueryHash() || {};

var options = extend(defaultOptions, queryOptions);
Reveal.initialize(options);

viewAjaxCallback = function () {
    Reveal.layout();
};

function renderSlide() {
    var title = document.title;
    finishView($(event.currentSlide));
    document.title = title;
    Reveal.layout();
}

Reveal.addEventListener('ready', renderSlide);
Reveal.addEventListener('slidechanged', renderSlide);