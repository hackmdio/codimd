var hljs = require('highlight.js');
var PDFObject = require('pdfobject');
var S = require('string');
var saveAs = require('file-saver').saveAs;
require('../vendor/md-toc');

//auto update last change
window.createtime = null;
window.lastchangetime = null;
window.lastchangeui = {
    status: $(".ui-status-lastchange"),
    time: $(".ui-lastchange"),
    user: $(".ui-lastchangeuser"),
    nouser: $(".ui-no-lastchangeuser")
}
var ownerui = $(".ui-owner");

function updateLastChange() {
    if (!lastchangeui) return;
    if (createtime) {
        if (createtime && !lastchangetime) {
            lastchangeui.status.text('created');
        } else {
            lastchangeui.status.text('changed');
        }
        var time = lastchangetime || createtime;
        lastchangeui.time.html(moment(time).fromNow());
        lastchangeui.time.attr('title', moment(time).format('llll'));
    }
}
setInterval(updateLastChange, 60000);

window.lastchangeuser = null;
window.lastchangeuserprofile = null;
function updateLastChangeUser() {
    if (lastchangeui) {
      if (lastchangeuser && lastchangeuserprofile) {
          var icon = lastchangeui.user.children('i');
          icon.attr('title', lastchangeuserprofile.name).tooltip('fixTitle');
          if (lastchangeuserprofile.photo)
              icon.attr('style', 'background-image:url(' + lastchangeuserprofile.photo + ')');
          lastchangeui.user.show();
          lastchangeui.nouser.hide();
      } else {
          lastchangeui.user.hide();
          lastchangeui.nouser.show();
      }
    }
}

window.owner = null;
window.ownerprofile = null;
function updateOwner() {
    if (ownerui) {
      if (owner && ownerprofile && owner !== lastchangeuser) {
          var icon = ownerui.children('i');
          icon.attr('title', ownerprofile.name).tooltip('fixTitle');
          var styleString = 'background-image:url(' + ownerprofile.photo + ')';
          if (ownerprofile.photo && icon.attr('style') !== styleString)
              icon.attr('style', styleString);
          ownerui.show();
      } else {
          ownerui.hide();
      }
    }
}

//get title
function getTitle(view) {
    var title = "";
    if (md && md.meta && md.meta.title && (typeof md.meta.title == "string" || typeof md.meta.title == "number")) {
        title = md.meta.title;
    } else {
        var h1s = view.find("h1");
        if (h1s.length > 0) {
            title = h1s.first().text();
        } else {
            title = null;
        }
    }
    return title;
}

//render title
function renderTitle(view) {
    var title = getTitle(view);
    if (title) {
        title += ' - HackMD';
    } else {
        title = 'HackMD - Collaborative markdown notes';
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

function isValidURL(str) {
    var pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
        '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
    if (!pattern.test(str)) {
        return false;
    } else {
        return true;
    }
}

//parse meta
function parseMeta(md, edit, view, toc, tocAffix) {
    var lang = null;
    var dir = null;
    var breaks = true;
    if (md && md.meta) {
        var meta = md.meta;
        lang = meta.lang;
        dir = meta.dir;
        breaks = meta.breaks;
    }
    //text language
    if (lang && typeof lang == "string") {
        view.attr('lang', lang);
        toc.attr('lang', lang);
        tocAffix.attr('lang', lang);
        if (edit)
            edit.attr('lang', lang);
    } else {
        view.removeAttr('lang');
        toc.removeAttr('lang');
        tocAffix.removeAttr('lang');
        if (edit)
            edit.removeAttr('lang', lang);
    }
    //text direction
    if (dir && typeof dir == "string") {
        view.attr('dir', dir);
        toc.attr('dir', dir);
        tocAffix.attr('dir', dir);
    } else {
        view.removeAttr('dir');
        toc.removeAttr('dir');
        tocAffix.removeAttr('dir');
    }
    //breaks
    if (typeof breaks === 'boolean' && !breaks) {
        md.options.breaks = false;
    } else {
        md.options.breaks = true;
    }
}

var viewAjaxCallback = null;

//regex for extra tags
var spaceregex = /\s*/;
var notinhtmltagregex = /(?![^<]*>|[^<>]*<\/)/;
var coloregex = /\[color=([#|\(|\)|\s|\,|\w]*?)\]/;
coloregex = new RegExp(coloregex.source + notinhtmltagregex.source, "g");
var nameregex = /\[name=(.*?)\]/;
var timeregex = /\[time=([:|,|+|-|\(|\)|\s|\w]*?)\]/;
var nameandtimeregex = new RegExp(nameregex.source + spaceregex.source + timeregex.source + notinhtmltagregex.source, "g");
nameregex = new RegExp(nameregex.source + notinhtmltagregex.source, "g");
timeregex = new RegExp(timeregex.source + notinhtmltagregex.source, "g");

function replaceExtraTags(html) {
    html = html.replace(coloregex, '<span class="color" data-color="$1"></span>');
    html = html.replace(nameandtimeregex, '<small><i class="fa fa-user"></i> $1 <i class="fa fa-clock-o"></i> $2</small>');
    html = html.replace(nameregex, '<small><i class="fa fa-user"></i> $1</small>');
    html = html.replace(timeregex, '<small><i class="fa fa-clock-o"></i> $1</small>');
    return html;
}

if (typeof mermaid !== 'undefined' && mermaid) mermaid.startOnLoad = false;

//dynamic event or object binding here
function finishView(view) {
    //todo list
    var lis = view.find('li.raw').removeClass("raw").sortByDepth().toArray();
    for (var i = 0; i < lis.length; i++) {
        var li = lis[i];
        var html = $(li).clone()[0].innerHTML;
        var p = $(li).children('p');
        if (p.length == 1) {
            html = p.html();
            li = p[0];
        }
        html = replaceExtraTags(html);
        li.innerHTML = html;
        var disabled = 'disabled';
        if(typeof editor !== 'undefined' && havePermission())
            disabled = '';
        if (/^\s*\[[x ]\]\s*/.test(html)) {
            li.innerHTML = html.replace(/^\s*\[ \]\s*/, '<input type="checkbox" class="task-list-item-checkbox "' + disabled + '><label></label>')
                .replace(/^\s*\[x\]\s*/, '<input type="checkbox" class="task-list-item-checkbox" checked ' + disabled + '><label></label>');
            lis[i].setAttribute('class', 'task-list-item');
        }
        if (typeof editor !== 'undefined' && havePermission())
            $(li).find('input').change(toggleTodoEvent);
        //color tag in list will convert it to tag icon with color
        var tag_color = $(li).closest('ul').find(".color");
        tag_color.each(function (key, value) {
            $(value).addClass('fa fa-tag').css('color', $(value).attr('data-color'));
        });
    }
    //youtube
    view.find("div.youtube.raw").removeClass("raw")
        .click(function () {
            imgPlayiframe(this, '//www.youtube.com/embed/');
        });
    //vimeo
    view.find("div.vimeo.raw").removeClass("raw")
        .click(function () {
            imgPlayiframe(this, '//player.vimeo.com/video/');
        })
        .each(function (key, value) {
            $.ajax({
                type: 'GET',
                url: '//vimeo.com/api/v2/video/' + $(value).attr('data-videoid') + '.json',
                jsonp: 'callback',
                dataType: 'jsonp',
                success: function (data) {
                    var thumbnail_src = data[0].thumbnail_large;
                    var image = '<img src="' + thumbnail_src + '" />';
                    $(value).prepend(image);
                    if(viewAjaxCallback) viewAjaxCallback();
                }
            });
        });
    //gist
    view.find("code[data-gist-id]").each(function (key, value) {
        if ($(value).children().length == 0)
            $(value).gist(viewAjaxCallback);
    });
    //mathjax
    var mathjaxdivs = view.find('span.mathjax.raw').removeClass("raw").toArray();
    try {
        if (mathjaxdivs.length > 1) {
            MathJax.Hub.Queue(["Typeset", MathJax.Hub, mathjaxdivs]);
            MathJax.Hub.Queue(viewAjaxCallback);
        } else if (mathjaxdivs.length > 0) {
            MathJax.Hub.Queue(["Typeset", MathJax.Hub, mathjaxdivs[0]]);
            MathJax.Hub.Queue(viewAjaxCallback);
        }
    } catch (err) {}
    //sequence diagram
    var sequences = view.find("div.sequence-diagram.raw").removeClass("raw");
    sequences.each(function (key, value) {
        try {
            var $value = $(value);
            var $ele = $(value).parent().parent();

            var sequence = $value;
            sequence.sequenceDiagram({
                theme: 'simple'
            });

            $ele.addClass('sequence-diagram');
            $value.children().unwrap().unwrap();
            var svg = $ele.find('> svg');
            svg[0].setAttribute('viewBox', '0 0 ' + svg.attr('width') + ' ' + svg.attr('height'));
            svg[0].setAttribute('preserveAspectRatio', 'xMidYMid meet');
        } catch (err) {
            console.warn(err);
        }
    });
    //flowchart
    var flow = view.find("div.flow-chart.raw").removeClass("raw");
    flow.each(function (key, value) {
        try {
            var $value = $(value);
            var $ele = $(value).parent().parent();

            var chart = flowchart.parse($value.text());
            $value.html('');
            chart.drawSVG(value, {
                'line-width': 2,
                'fill': 'none',
                'font-size': '16px',
                'font-family': "'Andale Mono', monospace"
            });

            $ele.addClass('flow-chart');
            $value.children().unwrap().unwrap();
        } catch (err) {
            console.warn(err);
        }
    });
    //graphviz
    var Viz = require("viz.js");
    var graphvizs = view.find("div.graphviz.raw").removeClass("raw");
    graphvizs.each(function (key, value) {
        try {
            var $value = $(value);
            var $ele = $(value).parent().parent();

            var graphviz = Viz($value.text());
            $value.html(graphviz);

            $ele.addClass('graphviz');
            $value.children().unwrap().unwrap();
        } catch (err) {
            console.warn(err);
        }
    });
    //mermaid
    var mermaids = view.find("div.mermaid.raw").removeClass("raw");
    mermaids.each(function (key, value) {
        try {
            var $value = $(value);
            var $ele = $(value).closest('pre');

            var mermaidError = null;
            mermaid.parseError = function (err, hash) {
                mermaidError = err;
            };

            if (mermaidAPI.parse($value.text())) {
                $ele.addClass('mermaid');
                $ele.html($value.text());
                mermaid.init(undefined, $ele);
            } else {
                console.warn(mermaidError);
            }
        } catch (err) {
            console.warn(err);
        }
    });
    //image href new window(emoji not included)
    var images = view.find("img.raw[src]").removeClass("raw");
    images.each(function (key, value) {
        // if it's already wrapped by link, then ignore
        var $value = $(value);
        $value[0].onload = function (e) {
            if(viewAjaxCallback) viewAjaxCallback();
        };
    });
    //blockquote
    var blockquote = view.find("blockquote.raw").removeClass("raw");
    var blockquote_p = blockquote.find("p");
    blockquote_p.each(function (key, value) {
        var html = $(value).html();
        html = replaceExtraTags(html);
        $(value).html(html);
    });
    //color tag in blockquote will change its left border color
    var blockquote_color = blockquote.find(".color");
    blockquote_color.each(function (key, value) {
        $(value).closest("blockquote").css('border-left-color', $(value).attr('data-color'));
    });
    //slideshare
    view.find("div.slideshare.raw").removeClass("raw")
        .each(function (key, value) {
            $.ajax({
                type: 'GET',
                url: '//www.slideshare.net/api/oembed/2?url=http://www.slideshare.net/' + $(value).attr('data-slideshareid') + '&format=json',
                jsonp: 'callback',
                dataType: 'jsonp',
                success: function (data) {
                    var $html = $(data.html);
                    var iframe = $html.closest('iframe');
                    var caption = $html.closest('div');
                    var inner = $('<div class="inner"></div>').append(iframe);
                    var height = iframe.attr('height');
                    var width = iframe.attr('width');
                    var ratio = (height / width) * 100;
                    inner.css('padding-bottom', ratio + '%');
                    $(value).html(inner).append(caption);
                    if(viewAjaxCallback) viewAjaxCallback();
                }
            });
        });
    //speakerdeck
    view.find("div.speakerdeck.raw").removeClass("raw")
        .each(function (key, value) {
            var url = 'https://speakerdeck.com/oembed.json?url=https%3A%2F%2Fspeakerdeck.com%2F' + encodeURIComponent($(value).attr('data-speakerdeckid'));
            //use yql because speakerdeck not support jsonp
            $.ajax({
                url: 'https://query.yahooapis.com/v1/public/yql',
                data: {
                    q: "select * from json where url ='" + url + "'",
                    format: "json"
                },
                dataType: "jsonp",
                success: function (data) {
                    if (!data.query || !data.query.results) return;
                    var json = data.query.results.json;
                    var html = json.html;
                    var ratio = json.height / json.width;
                    $(value).html(html);
                    var iframe = $(value).children('iframe');
                    var src = iframe.attr('src');
                    if (src.indexOf('//') == 0)
                        iframe.attr('src', 'https:' + src);
                    var inner = $('<div class="inner"></div>').append(iframe);
                    var height = iframe.attr('height');
                    var width = iframe.attr('width');
                    var ratio = (height / width) * 100;
                    inner.css('padding-bottom', ratio + '%');
                    $(value).html(inner);
                    if(viewAjaxCallback) viewAjaxCallback();
                }
            });
        });
    //pdf
    view.find("div.pdf.raw").removeClass("raw")
            .each(function (key, value) {
                var url = $(value).attr('data-pdfurl');
                var inner = $('<div></div>');
                $(this).append(inner);
                PDFObject.embed(url, inner, {
                    height: '400px'
                });
            });
    //syntax highlighting
    view.find("code.raw").removeClass("raw")
        .each(function (key, value) {
            var langDiv = $(value);
            if (langDiv.length > 0) {
                var reallang = langDiv[0].className.replace(/hljs|wrap/g, '').trim();
                var codeDiv = langDiv.find('.code');
                var code = "";
                if (codeDiv.length > 0) code = codeDiv.html();
                else code = langDiv.html();
                code = md.utils.unescapeAll(code);
                if (!reallang) {
                    var result = {
                        value: md.utils.escapeHtml(code)
                    };
                } else if (reallang == "tiddlywiki" || reallang == "mediawiki") {
                    var result = {
                        value: Prism.highlight(code, Prism.languages.wiki)
                    };
                } else {
                    var languages = hljs.listLanguages();
                    if (languages.indexOf(reallang) == -1) {
                        var result = hljs.highlightAuto(code);
                    } else {
                        var result = hljs.highlight(reallang, code);
                    }
                }
                if (codeDiv.length > 0) codeDiv.html(result.value);
                else langDiv.html(result.value);
            }
        });
    //render title
    document.title = renderTitle(view);
}

//only static transform should be here
function postProcess(code) {
    var result = $('<div>' + code + '</div>');
    //link should open in new window or tab
    result.find('a:not([href^="#"]):not([target])').attr('target', '_blank');
	//update continue line numbers
	var linenumberdivs = result.find('.gutter.linenumber').toArray();
	for (var i = 0; i < linenumberdivs.length; i++) {
		if ($(linenumberdivs[i]).hasClass('continue')) {
			var startnumber = linenumberdivs[i - 1] ? parseInt($(linenumberdivs[i - 1]).find('> span').last().attr('data-linenumber')) : 0;
			$(linenumberdivs[i]).find('> span').each(function(key, value) {
				$(value).attr('data-linenumber', startnumber + key + 1);
			});
		}
	}
    return result;
}
window.postProcess = postProcess;

function generateCleanHTML(view) {
    var src = view.clone();
    var eles = src.find('*');
    //remove syncscroll parts
    eles.removeClass('part');
    src.find('*[class=""]').removeAttr('class');
    eles.removeAttr('data-startline data-endline');
    eles.find("a[href^='#'][smoothhashscroll]").removeAttr('smoothhashscroll');
    //remove gist content
    src.find("code[data-gist-id]").children().remove();
    //disable todo list
    src.find("input.task-list-item-checkbox").attr('disabled', '');
    //replace emoji image path
    src.find("img.emoji").each(function (key, value) {
        var name = $(value).attr('alt');
        name = name.substr(1);
        name = name.slice(0, name.length - 1);
        $(value).attr('src', 'https://www.tortue.me/emoji/' + name + '.png');
    });
    //replace video to iframe
    src.find("div[data-videoid]").each(function (key, value) {
        var id = $(value).attr('data-videoid');
        var style = $(value).attr('style');
        var url = null;
        if ($(value).hasClass('youtube')) {
            url = 'https://www.youtube.com/embed/';
        } else if ($(value).hasClass('vimeo')) {
            url = 'https://player.vimeo.com/video/';
        }
        if (url) {
            var iframe = $('<iframe frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>');
            iframe.attr('src', url + id);
            iframe.attr('style', style);
            $(value).html(iframe);
        }
    });
    return src;
}

function exportToRawHTML(view) {
    var filename = renderFilename(ui.area.markdown) + '.html';
    var src = generateCleanHTML(view);
    $(src).find('a.anchor').remove();
    var html = src[0].outerHTML;
    var blob = new Blob([html], {
        type: "text/html;charset=utf-8"
    });
    saveAs(blob, filename);
}

var common = require('./common.js');
//extract markdown body to html and compile to template
function exportToHTML(view) {
    var title = renderTitle(ui.area.markdown);
    var filename = renderFilename(ui.area.markdown) + '.html';
    var src = generateCleanHTML(view);
    //generate toc
    var toc = $('#ui-toc').clone();
    toc.find('*').removeClass('active');
    var tocAffix = $('#ui-toc-affix').clone();
    tocAffix.find('*').removeClass('active');
    //generate html via template
    $.get(serverurl + '/css/html.min.css', function (css) {
        $.get(serverurl + '/views/html.hbs', function (data) {
            var template = Handlebars.compile(data);
            var context = {
                url: serverurl,
                title: title,
                css: css,
                html: src[0].outerHTML,
                'ui-toc': toc.html(),
                'ui-toc-affix': tocAffix.html(),
                lang: (md && md.meta && md.meta.lang) ? 'lang="' + md.meta.lang + '"' : null,
                dir: (md && md.meta && md.meta.dir) ? 'dir="' + md.meta.dir + '"' : null
            };
            var html = template(context);
            //        console.log(html);
            var blob = new Blob([html], {
                type: "text/html;charset=utf-8"
            });
            saveAs(blob, filename);
        });
    });
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

function toggleTodoEvent(e) {
    var startline = $(this).closest('li').attr('data-startline') - 1;
    var line = editor.getLine(startline);
    var matches = line.match(/^[>\s]*[\-\+\*]\s\[([x ])\]/);
    if (matches && matches.length >= 2) {
        var checked = null;
        if (matches[1] == 'x')
            checked = true;
        else if (matches[1] == ' ')
            checked = false;
        var replacements = matches[0].match(/(^[>\s]*[\-\+\*]\s\[)([x ])(\])/);
        editor.replaceRange(checked ? ' ' : 'x', {
            line: startline,
            ch: replacements[1].length
        }, {
            line: startline,
            ch: replacements[1].length + 1
        }, '+input');
    }
}

//remove hash
function removeHash() {
    history.pushState("", document.title, window.location.pathname + window.location.search);
}

var tocExpand = false;

function checkExpandToggle() {
    var toc = $('.ui-toc-dropdown .toc');
    var toggle = $('.expand-toggle');
    if (!tocExpand) {
        toc.removeClass('expand');
        toggle.text('Expand all');
    } else {
        toc.addClass('expand');
        toggle.text('Collapse all');
    }
}

//toc
function generateToc(id) {
    var target = $('#' + id);
    target.html('');
    new Toc('doc', {
        'level': 3,
        'top': -1,
        'class': 'toc',
        'ulClass': 'nav',
        'targetId': id
    });
    if (target.text() == 'undefined')
        target.html('');
    var tocMenu = $('<div class="toc-menu"></div');
    var toggle = $('<a class="expand-toggle" href="#">Expand all</a>');
    var backtotop = $('<a class="back-to-top" href="#">Back to top</a>');
    var gotobottom = $('<a class="go-to-bottom" href="#">Go to bottom</a>');
    checkExpandToggle();
    toggle.click(function (e) {
        e.preventDefault();
        e.stopPropagation();
        tocExpand = !tocExpand;
        checkExpandToggle();
    });
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
    tocMenu.append(toggle).append(backtotop).append(gotobottom);
    target.append(tocMenu);
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
                var hash = decodeURIComponent(this.hash);
                // escape special characters in jquery selector
                var $hash = $(hash.replace(/(:|\.|\[|\]|,)/g, "\\$1"));
                // return if no element been selected
                if ($hash.length <= 0) return;
                // prevent default anchor click behavior
                e.preventDefault();
                // animate
                $('body, html').stop(true, true).animate({
                    scrollTop: $hash.offset().top
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

function imgPlayiframe(element, src) {
    if (!$(element).attr("data-videoid")) return;
    var iframe = $("<iframe frameborder='0' webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>");
    $(iframe).attr("src", src + $(element).attr("data-videoid") + '?autoplay=1');
    $(element).find('img').css('visibility', 'hidden');
    $(element).append(iframe);
}

var anchorForId = function (id) {
    var anchor = document.createElement("a");
    anchor.className = "anchor hidden-xs";
    anchor.href = "#" + id;
    anchor.innerHTML = "<span class=\"octicon octicon-link\"></span>";
    anchor.title = id;
    return anchor;
};

var linkifyAnchors = function (level, containingElement) {
    var headers = containingElement.getElementsByTagName("h" + level);
    for (var h = 0; h < headers.length; h++) {
        var header = headers[h];
        if (header.getElementsByClassName("anchor").length == 0) {
            if (typeof header.id == "undefined" || header.id == "") {
                //to escape characters not allow in css and humanize
                var id = slugifyWithUTF8(header.innerHTML);
                header.id = id;
            }
            header.insertBefore(anchorForId(header.id), header.firstChild);
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
}

function deduplicatedHeaderId(view) {
    var headers = view.find(':header.raw').removeClass('raw').toArray();
    for (var i = 0; i < headers.length; i++) {
        var id = $(headers[i]).attr('id');
        if (!id) continue;
        var duplicatedHeaders = view.find(':header[id="' + id + '"]').toArray();
        for (var j = 0; j < duplicatedHeaders.length; j++) {
            if (duplicatedHeaders[j] != headers[i]) {
                var newId = id + j;
                var $duplicatedHeader = $(duplicatedHeaders[j]);
                $duplicatedHeader.attr('id', newId);
                var $headerLink = $duplicatedHeader.find('> .header-link');
                $headerLink.attr('href', '#' + newId);
                $headerLink.attr('title', newId);
            }
        }
    }
}

function renderTOC(view) {
    var tocs = view.find('.toc').toArray();
	for (var i = 0; i < tocs.length; i++) {
        var toc = $(tocs[i]);
        var id = 'toc' + i;
        toc.attr('id', id);
        var target = $('#' + id);
        target.html('');
        new Toc('doc', {
            'level': 3,
            'top': -1,
            'class': 'toc',
            'targetId': id
        });
        if (target.text() == 'undefined')
            target.html('');
        target.replaceWith(target.html());
    }
}

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
    } else if (lang == 'graphviz') {
        return '<div class="graphviz raw">' + code + '</div>';
    } else if (lang == 'mermaid') {
        return '<div class="mermaid raw">' + code + '</div>';
    }
    var result = {
        value: code
    };
	var showlinenumbers = /\=$|\=\d+$|\=\+$/.test(lang);
    if (showlinenumbers) {
		var startnumber = 1;
		var matches = lang.match(/\=(\d+)$/);
		if (matches)
			startnumber = parseInt(matches[1]);
        var lines = result.value.split('\n');
        var linenumbers = [];
        for (var i = 0; i < lines.length - 1; i++) {
            linenumbers[i] = "<span data-linenumber='" + (startnumber + i) + "'></span>";
        }
		var continuelinenumber = /\=\+$/.test(lang);
        var linegutter = "<div class='gutter linenumber" + (continuelinenumber ? " continue" : "") + "'>" + linenumbers.join('\n') + "</div>";
        result.value = "<div class='wrapper'>" + linegutter + "<div class='code'>" + result.value + "</div></div>";
    }
    return result.value;
}

var markdownit = require('markdown-it');
var markdownitContainer = require('markdown-it-container');

var md = markdownit('default', {
    html: true,
    breaks: true,
    langPrefix: "",
    linkify: true,
    typographer: true,
    highlight: highlightRender
});
window.md = md;

md.use(require('markdown-it-abbr'));
md.use(require('markdown-it-footnote'));
md.use(require('markdown-it-deflist'));
md.use(require('markdown-it-mark'));
md.use(require('markdown-it-ins'));
md.use(require('markdown-it-sub'));
md.use(require('markdown-it-sup'));
md.use(require('../vendor/markdown-it-mathjax'));
md.use(require('markdown-it-imsize'));

md.use(require('markdown-it-emoji'), {
    shortcuts: false
});

var emojify = require('emojify.js');

emojify.setConfig({
    blacklist: {
        elements: ['script', 'textarea', 'a', 'pre', 'code', 'svg'],
        classes: ['no-emojify']
    },
    img_dir: serverurl + '/vendor/emojify.js/dist/images/basic',
    ignore_emoticons: true
});

md.renderer.rules.emoji = function(token, idx) {
    return emojify.replace(':' + token[idx].markup + ':');
};

function renderContainer(tokens, idx, options, env, self) {
    tokens[idx].attrJoin('role', 'alert');
    tokens[idx].attrJoin('class', 'alert');
    tokens[idx].attrJoin('class', 'alert-' + tokens[idx].info.trim());
    return self.renderToken.apply(self, arguments);
}
md.use(markdownitContainer, 'success', { render: renderContainer });
md.use(markdownitContainer, 'info', { render: renderContainer });
md.use(markdownitContainer, 'warning', { render: renderContainer });
md.use(markdownitContainer, 'danger', { render: renderContainer });

md.renderer.rules.image = function (tokens, idx, options, env, self) {
    tokens[idx].attrJoin('class', 'raw');
    return self.renderToken.apply(self, arguments);
};
md.renderer.rules.list_item_open = function (tokens, idx, options, env, self) {
    tokens[idx].attrJoin('class', 'raw');
    return self.renderToken.apply(self, arguments);
};
md.renderer.rules.blockquote_open = function (tokens, idx, options, env, self) {
    tokens[idx].attrJoin('class', 'raw');
    return self.renderToken.apply(self, arguments);
};
md.renderer.rules.heading_open = function (tokens, idx, options, env, self) {
    tokens[idx].attrJoin('class', 'raw');
    return self.renderToken.apply(self, arguments);
};
md.renderer.rules.fence = function (tokens, idx, options, env, self) {
    var token = tokens[idx],
      info = token.info ? md.utils.unescapeAll(token.info).trim() : '',
      langName = '',
      highlighted;

    if (info) {
        langName = info.split(/\s+/g)[0];
        if (/\!$/.test(info)) token.attrJoin('class', 'wrap');
        token.attrJoin('class', options.langPrefix + langName.replace(/\=$|\=\d+$|\=\+$|\!$|\=\!$/, ''));
        token.attrJoin('class', 'hljs');
        token.attrJoin('class', 'raw');
    }

    if (options.highlight) {
        highlighted = options.highlight(token.content, langName) || md.utils.escapeHtml(token.content);
    } else {
        highlighted = md.utils.escapeHtml(token.content);
    }

    if (highlighted.indexOf('<pre') === 0) {
        return highlighted + '\n';
    }

    return  '<pre><code' + self.renderAttrs(token) + '>'
        + highlighted
        + '</code></pre>\n';
};

/* Defined regex markdown it plugins */
require('script!../vendor/markdown-it-regexp');

//youtube
var youtubePlugin = new Plugin(
    // regexp to match
    /{%youtube\s*([\d\D]*?)\s*%}/,

    // this function will be called when something matches
    function (match, utils) {
        var videoid = match[1];
        if (!videoid) return;
        var div = $('<div class="youtube raw"></div>');
        div.attr('data-videoid', videoid);
        var thumbnail_src = '//img.youtube.com/vi/' + videoid + '/hqdefault.jpg';
        var image = '<img src="' + thumbnail_src + '" />';
        div.append(image);
        var icon = '<i class="icon fa fa-youtube-play fa-5x"></i>';
        div.append(icon);
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
        div.attr('data-videoid', videoid);
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
//TOC
var tocPlugin = new Plugin(
    // regexp to match
    /^\[TOC\]$/,

    // this function will be called when something matches
    function (match, utils) {
        return '<div class="toc"></div>';
    }
);
//slideshare
var slidesharePlugin = new Plugin(
    // regexp to match
    /{%slideshare\s*([\d\D]*?)\s*%}/,

    // this function will be called when something matches
    function (match, utils) {
        var slideshareid = match[1];
        var div = $('<div class="slideshare raw"></div>');
        div.attr('data-slideshareid', slideshareid);
        return div[0].outerHTML;
    }
);
//speakerdeck
var speakerdeckPlugin = new Plugin(
    // regexp to match
    /{%speakerdeck\s*([\d\D]*?)\s*%}/,

    // this function will be called when something matches
    function (match, utils) {
        var speakerdeckid = match[1];
        var div = $('<div class="speakerdeck raw"></div>');
        div.attr('data-speakerdeckid', speakerdeckid);
        return div[0].outerHTML;
    }
);
//pdf
var pdfPlugin = new Plugin(
    // regexp to match
    /{%pdf\s*([\d\D]*?)\s*%}/,

    // this function will be called when something matches
    function (match, utils) {
        var pdfurl = match[1];
        if (!isValidURL(pdfurl)) return match[0];
        var div = $('<div class="pdf raw"></div>');
        div.attr('data-pdfurl', pdfurl);
        return div[0].outerHTML;
    }
);

//yaml meta, from https://github.com/eugeneware/remarkable-meta
function get(state, line) {
    var pos = state.bMarks[line];
    var max = state.eMarks[line];
    return state.src.substr(pos, max - pos);
}

function meta(state, start, end, silent) {
    if (start !== 0 || state.blkIndent !== 0) return false;
    if (state.tShift[start] < 0) return false;
    if (!get(state, start).match(/^---$/)) return false;

    var data = [];
    for (var line = start + 1; line < end; line++) {
        var str = get(state, line);
        if (str.match(/^(\.{3}|-{3})$/)) break;
        if (state.tShift[line] < 0) break;
        data.push(str);
    }

    if (line >= end) return false;

    try {
        md.meta = jsyaml.safeLoad(data.join('\n')) || {};
    } catch(err) {
        console.warn(err);
        return false;
    }

    state.line = line + 1;

    return true;
}

function metaPlugin(md) {
    md.meta = md.meta || {};
    md.block.ruler.before('code', 'meta', meta, {
        alt: []
    });
}

md.use(metaPlugin);
md.use(youtubePlugin);
md.use(vimeoPlugin);
md.use(gistPlugin);
md.use(tocPlugin);
md.use(slidesharePlugin);
md.use(speakerdeckPlugin);
md.use(pdfPlugin);

module.exports = {
  md: md,
  updateLastChange: updateLastChange,
  postProcess: postProcess,
  finishView: finishView,
  autoLinkify: autoLinkify,
  deduplicatedHeaderId: deduplicatedHeaderId,
  renderTOC: renderTOC,
  renderTitle: renderTitle,
  renderFilename: renderFilename,
  generateToc: generateToc,
  smoothHashScroll: smoothHashScroll,
  scrollToHash: scrollToHash,
  updateLastChangeUser: updateLastChangeUser,
  updateOwner: updateOwner,
  parseMeta: parseMeta,
  exportToHTML: exportToHTML,
  exportToRawHTML: exportToRawHTML
};
