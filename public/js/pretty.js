var extra = require('./extra');
var md = extra.md;
var finishView = extra.finishView;
var autoLinkify = extra.autoLinkify;
var deduplicatedHeaderId = extra.deduplicatedHeaderId;
var renderTOC = extra.renderTOC;
var generateToc = extra.generateToc;
var smoothHashScroll = extra.smoothHashScroll;
var postProcess = extra.postProcess;
var updateLastChange = extra.updateLastChange;
var preventXSS = require('./render').preventXSS;

var markdown = $("#doc.markdown-body");
var text = $('<textarea/>').html(markdown.html()).text();
var lastMeta = md.meta;
md.meta = {};
var rendered = md.render(text);
if (md.meta.type && md.meta.type === 'slide') {
    var slideOptions = {
        separator: '^(\r\n?|\n)---(\r\n?|\n)$',
        verticalSeparator: '^(\r\n?|\n)----(\r\n?|\n)$'
    };
    var slides = RevealMarkdown.slidify(text, slideOptions);
    markdown.html(slides);
    RevealMarkdown.initialize();
    // prevent XSS
    markdown.html(preventXSS(markdown.html()));
    markdown.addClass('slides');
} else {
    if (lastMeta.type && lastMeta.type === 'slide') {
        refreshView();
        markdown.removeClass('slides');
    }
    // only render again when meta changed
    if (JSON.stringify(md.meta) != JSON.stringify(lastMeta)) {
        parseMeta(md, null, markdown, $('#ui-toc'), $('#ui-toc-affix'));
        rendered = md.render(text);
    }
    // prevent XSS
    rendered = preventXSS(rendered);
    var result = postProcess(rendered);
    markdown.html(result.html());
}
$(document.body).show();
finishView(markdown);
autoLinkify(markdown);
deduplicatedHeaderId(markdown);
renderTOC(markdown);
generateToc('ui-toc');
generateToc('ui-toc-affix');
smoothHashScroll();
createtime = lastchangeui.time.attr('data-createtime');
lastchangetime = lastchangeui.time.attr('data-updatetime');
updateLastChange();
var url = window.location.pathname;
$('.ui-edit').attr('href', url + '/edit');
var toc = $('.ui-toc');
var tocAffix = $('.ui-affix-toc');
var tocDropdown = $('.ui-toc-dropdown');
//toc
tocDropdown.click(function (e) {
    e.stopPropagation();
});

var enoughForAffixToc = true;

function generateScrollspy() {
    $(document.body).scrollspy({
        target: ''
    });
    $(document.body).scrollspy('refresh');
    if (enoughForAffixToc) {
        toc.hide();
        tocAffix.show();
    } else {
        tocAffix.hide();
        toc.show();
    }
    $(document.body).scroll();
}

function windowResize() {
    //toc right
    var paddingRight = parseFloat(markdown.css('padding-right'));
    var right = ($(window).width() - (markdown.offset().left + markdown.outerWidth() - paddingRight));
    toc.css('right', right + 'px');
    //affix toc left
    var newbool;
    var rightMargin = (markdown.parent().outerWidth() - markdown.outerWidth()) / 2;
    //for ipad or wider device
    if (rightMargin >= 133) {
        newbool = true;
        var affixLeftMargin = (tocAffix.outerWidth() - tocAffix.width()) / 2;
        var left = markdown.offset().left + markdown.outerWidth() - affixLeftMargin;
        tocAffix.css('left', left + 'px');
    } else {
        newbool = false;
    }
    if (newbool != enoughForAffixToc) {
        enoughForAffixToc = newbool;
        generateScrollspy();
    }
}
$(window).resize(function () {
    windowResize();
});
$(document).ready(function () {
    windowResize();
    generateScrollspy();
    //tooltip
    $('[data-toggle="tooltip"]').tooltip();
});

function scrollToTop() {
    $('body, html').stop(true, true).animate({
        scrollTop: 0
    }, 100, "linear");
}

function scrollToBottom() {
    $('body, html').stop(true, true).animate({
        scrollTop: $(document.body)[0].scrollHeight
    }, 100, "linear");
}

window.scrollToTop = scrollToTop;
window.scrollToBottom = scrollToBottom;

module.exports = {
  scrollToBottom: scrollToBottom,
  scrollToTop: scrollToTop
}
