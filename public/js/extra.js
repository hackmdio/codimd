require('prismjs/themes/prism.css');
require('prismjs/components/prism-wiki');
require('prismjs/components/prism-haskell');
require('prismjs/components/prism-go');
require('prismjs/components/prism-typescript');
require('prismjs/components/prism-jsx');

import Prism from 'prismjs';
import hljs from 'highlight.js';
import PDFObject from 'pdfobject';
import S from 'string';
import { saveAs } from 'file-saver';

require('./lib/common/login');
require('../vendor/md-toc');
var Viz = require("viz.js");

//auto update last change
window.createtime = null;
window.lastchangetime = null;
window.lastchangeui = {
    status: $(".ui-status-lastchange"),
    time: $(".ui-lastchange"),
    user: $(".ui-lastchangeuser"),
    nouser: $(".ui-no-lastchangeuser")
}

const ownerui = $(".ui-owner");

export function updateLastChange() {
    if (!lastchangeui) return;
    if (createtime) {
        if (createtime && !lastchangetime) {
            lastchangeui.status.text('created');
        } else {
            lastchangeui.status.text('changed');
        }
        const time = lastchangetime || createtime;
        lastchangeui.time.html(moment(time).fromNow());
        lastchangeui.time.attr('title', moment(time).format('llll'));
    }
}
setInterval(updateLastChange, 60000);

window.lastchangeuser = null;
window.lastchangeuserprofile = null;

export function updateLastChangeUser() {
    if (lastchangeui) {
      if (lastchangeuser && lastchangeuserprofile) {
          const icon = lastchangeui.user.children('i');
          icon.attr('title', lastchangeuserprofile.name).tooltip('fixTitle');
          if (lastchangeuserprofile.photo)
              icon.attr('style', `background-image:url(${lastchangeuserprofile.photo})`);
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

export function updateOwner() {
    if (ownerui) {
      if (owner && ownerprofile && owner !== lastchangeuser) {
          const icon = ownerui.children('i');
          icon.attr('title', ownerprofile.name).tooltip('fixTitle');
          const styleString = `background-image:url(${ownerprofile.photo})`;
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
    let title = "";
    if (md && md.meta && md.meta.title && (typeof md.meta.title == "string" || typeof md.meta.title == "number")) {
        title = md.meta.title;
    } else {
        const h1s = view.find("h1");
        if (h1s.length > 0) {
            title = h1s.first().text();
        } else {
            title = null;
        }
    }
    return title;
}

//render title
export function renderTitle(view) {
    let title = getTitle(view);
    if (title) {
        title += ' - HackMD';
    } else {
        title = 'HackMD - Collaborative markdown notes';
    }
    return title;
}

//render filename
export function renderFilename(view) {
    let filename = getTitle(view);
    if (!filename) {
        filename = 'Untitled';
    }
    return filename;
}

// render tags
export function renderTags(view) {
    const tags = [];
    const rawtags = [];
    if (md && md.meta && md.meta.tags && (typeof md.meta.tags == "string" || typeof md.meta.tags == "number")) {
        const metaTags = (`${md.meta.tags}`).split(',');
        for (var i = 0; i < metaTags.length; i++) {
            const text = metaTags[i].trim();
            if (text) rawtags.push(text);
        }
    } else {
        view.find('h6').each((key, value) => {
            if (/^tags/gmi.test($(value).text())) {
                const codes = $(value).find("code");
                for (let i = 0; i < codes.length; i++) {
                    const text = codes[i].innerHTML.trim();
                    if (text) rawtags.push(text);
                }
            }
        });
    }
    for (var i = 0; i < rawtags.length; i++) {
        let found = false;
        for (let j = 0; j < tags.length; j++) {
            if (tags[j] == rawtags[i]) {
                found = true;
                break;
            }
        }
        if (!found)
            tags.push(rawtags[i]);
    }
    return tags;
}

function slugifyWithUTF8(text) {
    let newText = S(text.toLowerCase()).trim().stripTags().dasherize().s;
    newText = newText.replace(/([\!\"\#\$\%\&\'\(\)\*\+\,\.\/\:\;\<\=\>\?\@\[\\\]\^\`\{\|\}\~])/g, '');
    return newText;
}

export function isValidURL(str) {
    const pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
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
export function parseMeta(md, edit, view, toc, tocAffix) {
    let lang = null;
    let dir = null;
    let breaks = true;
    if (md && md.meta) {
        const meta = md.meta;
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

window.viewAjaxCallback = null;

//regex for extra tags
const spaceregex = /\s*/;
const notinhtmltagregex = /(?![^<]*>|[^<>]*<\/)/;
let coloregex = /\[color=([#|\(|\)|\s|\,|\w]*?)\]/;
coloregex = new RegExp(coloregex.source + notinhtmltagregex.source, "g");
let nameregex = /\[name=(.*?)\]/;
let timeregex = /\[time=([:|,|+|-|\(|\)|\s|\w]*?)\]/;
const nameandtimeregex = new RegExp(nameregex.source + spaceregex.source + timeregex.source + notinhtmltagregex.source, "g");
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
export function finishView(view) {
    //todo list
    const lis = view.find('li.raw').removeClass("raw").sortByDepth().toArray();

    for (let li of lis) {
        let html = $(li).clone()[0].innerHTML;
        const p = $(li).children('p');
        if (p.length == 1) {
            html = p.html();
            li = p[0];
        }
        html = replaceExtraTags(html);
        li.innerHTML = html;
        let disabled = 'disabled';
        if(typeof editor !== 'undefined' && havePermission())
            disabled = '';
        if (/^\s*\[[x ]\]\s*/.test(html)) {
            li.innerHTML = html.replace(/^\s*\[ \]\s*/, `<input type="checkbox" class="task-list-item-checkbox "${disabled}><label></label>`)
                .replace(/^\s*\[x\]\s*/, `<input type="checkbox" class="task-list-item-checkbox" checked ${disabled}><label></label>`);
            li.setAttribute('class', 'task-list-item');
        }
        if (typeof editor !== 'undefined' && havePermission())
            $(li).find('input').change(toggleTodoEvent);
        //color tag in list will convert it to tag icon with color
        const tag_color = $(li).closest('ul').find(".color");
        tag_color.each((key, value) => {
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
        .each((key, value) => {
            $.ajax({
                type: 'GET',
                url: `//vimeo.com/api/v2/video/${$(value).attr('data-videoid')}.json`,
                jsonp: 'callback',
                dataType: 'jsonp',
                success(data) {
                    const thumbnail_src = data[0].thumbnail_large;
                    const image = `<img src="${thumbnail_src}" />`;
                    $(value).prepend(image);
                    if(viewAjaxCallback) viewAjaxCallback();
                }
            });
        });
    //gist
    view.find("code[data-gist-id]").each((key, value) => {
        if ($(value).children().length == 0)
            $(value).gist(viewAjaxCallback);
    });
    //sequence diagram
    const sequences = view.find("div.sequence-diagram.raw").removeClass("raw");
    sequences.each((key, value) => {
        try {
            var $value = $(value);
            const $ele = $(value).parent().parent();

            const sequence = $value;
            sequence.sequenceDiagram({
                theme: 'simple'
            });

            $ele.addClass('sequence-diagram');
            $value.children().unwrap().unwrap();
            const svg = $ele.find('> svg');
            svg[0].setAttribute('viewBox', `0 0 ${svg.attr('width')} ${svg.attr('height')}`);
            svg[0].setAttribute('preserveAspectRatio', 'xMidYMid meet');
        } catch (err) {
            $value.unwrap();
            $value.parent().append('<div class="alert alert-warning">' + err + '</div>');
            console.warn(err);
        }
    });
    //flowchart
    const flow = view.find("div.flow-chart.raw").removeClass("raw");
    flow.each((key, value) => {
        try {
            var $value = $(value);
            const $ele = $(value).parent().parent();

            const chart = flowchart.parse($value.text());
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
            $value.unwrap();
            $value.parent().append('<div class="alert alert-warning">' + err + '</div>');
            console.warn(err);
        }
    });
    //graphviz
    var graphvizs = view.find("div.graphviz.raw").removeClass("raw");
    graphvizs.each(function (key, value) {
        try {
            var $value = $(value);
            var $ele = $(value).parent().parent();

            var graphviz = Viz($value.text());
            if (!graphviz) throw Error('viz.js output empty graph');
            $value.html(graphviz);

            $ele.addClass('graphviz');
            $value.children().unwrap().unwrap();
        } catch (err) {
            $value.unwrap();
            $value.parent().append('<div class="alert alert-warning">' + err + '</div>');
            console.warn(err);
        }
    });
    //mermaid
    const mermaids = view.find("div.mermaid.raw").removeClass("raw");
    mermaids.each((key, value) => {
        try {
            var $value = $(value);
            const $ele = $(value).closest('pre');

            let mermaidError = null;
            mermaid.parseError = (err, hash) => {
                mermaidError = err;
            };

            if (mermaidAPI.parse($value.text())) {
                $ele.addClass('mermaid');
                $ele.html($value.text());
                mermaid.init(undefined, $ele);
            } else {
                throw new Error(mermaidError);
            }
        } catch (err) {
            $value.unwrap();
            $value.parent().append('<div class="alert alert-warning">' + err + '</div>');
            console.warn(err);
        }
    });
    //image href new window(emoji not included)
    const images = view.find("img.raw[src]").removeClass("raw");
    images.each((key, value) => {
        // if it's already wrapped by link, then ignore
        const $value = $(value);
        $value[0].onload = e => {
            if(viewAjaxCallback) viewAjaxCallback();
        };
    });
    //blockquote
    const blockquote = view.find("blockquote.raw").removeClass("raw");
    const blockquote_p = blockquote.find("p");
    blockquote_p.each((key, value) => {
        let html = $(value).html();
        html = replaceExtraTags(html);
        $(value).html(html);
    });
    //color tag in blockquote will change its left border color
    const blockquote_color = blockquote.find(".color");
    blockquote_color.each((key, value) => {
        $(value).closest("blockquote").css('border-left-color', $(value).attr('data-color'));
    });
    //slideshare
    view.find("div.slideshare.raw").removeClass("raw")
        .each((key, value) => {
            $.ajax({
                type: 'GET',
                url: `//www.slideshare.net/api/oembed/2?url=http://www.slideshare.net/${$(value).attr('data-slideshareid')}&format=json`,
                jsonp: 'callback',
                dataType: 'jsonp',
                success(data) {
                    const $html = $(data.html);
                    const iframe = $html.closest('iframe');
                    const caption = $html.closest('div');
                    const inner = $('<div class="inner"></div>').append(iframe);
                    const height = iframe.attr('height');
                    const width = iframe.attr('width');
                    const ratio = (height / width) * 100;
                    inner.css('padding-bottom', `${ratio}%`);
                    $(value).html(inner).append(caption);
                    if(viewAjaxCallback) viewAjaxCallback();
                }
            });
        });
    //speakerdeck
    view.find("div.speakerdeck.raw").removeClass("raw")
        .each((key, value) => {
            const url = `https://speakerdeck.com/oembed.json?url=https%3A%2F%2Fspeakerdeck.com%2F${encodeURIComponent($(value).attr('data-speakerdeckid'))}`;
            //use yql because speakerdeck not support jsonp
            $.ajax({
                url: 'https://query.yahooapis.com/v1/public/yql',
                data: {
                    q: `select * from json where url ='${url}'`,
                    format: "json"
                },
                dataType: "jsonp",
                success(data) {
                    if (!data.query || !data.query.results) return;
                    const json = data.query.results.json;
                    const html = json.html;
                    var ratio = json.height / json.width;
                    $(value).html(html);
                    const iframe = $(value).children('iframe');
                    const src = iframe.attr('src');
                    if (src.indexOf('//') == 0)
                        iframe.attr('src', `https:${src}`);
                    const inner = $('<div class="inner"></div>').append(iframe);
                    const height = iframe.attr('height');
                    const width = iframe.attr('width');
                    var ratio = (height / width) * 100;
                    inner.css('padding-bottom', `${ratio}%`);
                    $(value).html(inner);
                    if(viewAjaxCallback) viewAjaxCallback();
                }
            });
        });
    //pdf
    view.find("div.pdf.raw").removeClass("raw")
            .each(function (key, value) {
                const url = $(value).attr('data-pdfurl');
                const inner = $('<div></div>');
                $(this).append(inner);
                PDFObject.embed(url, inner, {
                    height: '400px'
                });
            });
    //syntax highlighting
    view.find("code.raw").removeClass("raw")
        .each((key, value) => {
            const langDiv = $(value);
            if (langDiv.length > 0) {
                const reallang = langDiv[0].className.replace(/hljs|wrap/g, '').trim();
                const codeDiv = langDiv.find('.code');
                let code = "";
                if (codeDiv.length > 0) code = codeDiv.html();
                else code = langDiv.html();
                if (!reallang) {
                    var result = {
                        value: code
                    };
                } else if (reallang == "haskell" || reallang == "go" || reallang == "typescript" || reallang == "jsx") {
                    code = S(code).unescapeHTML().s;
                    var result = {
                        value: Prism.highlight(code, Prism.languages[reallang])
                    };
                } else if (reallang == "tiddlywiki" || reallang == "mediawiki") {
                    code = S(code).unescapeHTML().s;
                    var result = {
                        value: Prism.highlight(code, Prism.languages.wiki)
                    };
                } else {
                    code = S(code).unescapeHTML().s;
                    const languages = hljs.listLanguages();
                    if (!languages.includes(reallang)) {
                        var result = hljs.highlightAuto(code);
                    } else {
                        var result = hljs.highlight(reallang, code);
                    }
                }
                if (codeDiv.length > 0) codeDiv.html(result.value);
                else langDiv.html(result.value);
            }
        });
    //mathjax
    const mathjaxdivs = view.find('span.mathjax.raw').removeClass("raw").toArray();
    try {
        if (mathjaxdivs.length > 1) {
            MathJax.Hub.Queue(["Typeset", MathJax.Hub, mathjaxdivs]);
            MathJax.Hub.Queue(viewAjaxCallback);
        } else if (mathjaxdivs.length > 0) {
            MathJax.Hub.Queue(["Typeset", MathJax.Hub, mathjaxdivs[0]]);
            MathJax.Hub.Queue(viewAjaxCallback);
        }
    } catch (err) {
        console.warn(err);
    }
    //render title
    document.title = renderTitle(view);
}

//only static transform should be here
export function postProcess(code) {
    const result = $(`<div>${code}</div>`);
    //link should open in new window or tab
    result.find('a:not([href^="#"]):not([target])').attr('target', '_blank');
	//update continue line numbers
	const linenumberdivs = result.find('.gutter.linenumber').toArray();
	for (let i = 0; i < linenumberdivs.length; i++) {
		if ($(linenumberdivs[i]).hasClass('continue')) {
			const startnumber = linenumberdivs[i - 1] ? parseInt($(linenumberdivs[i - 1]).find('> span').last().attr('data-linenumber')) : 0;
			$(linenumberdivs[i]).find('> span').each((key, value) => {
				$(value).attr('data-linenumber', startnumber + key + 1);
			});
		}
	}
    // show yaml meta paring error
    if (md.metaError) {
        var warning = result.find('div#meta-error');
        if (warning && warning.length > 0) {
            warning.text(md.metaError)
        } else {
            warning = $('<div id="meta-error" class="alert alert-warning">' + md.metaError + '</div>')
            result.prepend(warning);
        }
    }
    return result;
}
window.postProcess = postProcess;

function generateCleanHTML(view) {
    const src = view.clone();
    const eles = src.find('*');
    //remove syncscroll parts
    eles.removeClass('part');
    src.find('*[class=""]').removeAttr('class');
    eles.removeAttr('data-startline data-endline');
    src.find("a[href^='#'][smoothhashscroll]").removeAttr('smoothhashscroll');
    //remove gist content
    src.find("code[data-gist-id]").children().remove();
    //disable todo list
    src.find("input.task-list-item-checkbox").attr('disabled', '');
    //replace emoji image path
    src.find("img.emoji").each((key, value) => {
        let name = $(value).attr('alt');
        name = name.substr(1);
        name = name.slice(0, name.length - 1);
        $(value).attr('src', `https://www.tortue.me/emoji/${name}.png`);
    });
    //replace video to iframe
    src.find("div[data-videoid]").each((key, value) => {
        const id = $(value).attr('data-videoid');
        const style = $(value).attr('style');
        let url = null;
        if ($(value).hasClass('youtube')) {
            url = 'https://www.youtube.com/embed/';
        } else if ($(value).hasClass('vimeo')) {
            url = 'https://player.vimeo.com/video/';
        }
        if (url) {
            const iframe = $('<iframe frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>');
            iframe.attr('src', url + id);
            iframe.attr('style', style);
            $(value).html(iframe);
        }
    });
    return src;
}

export function exportToRawHTML(view) {
    const filename = `${renderFilename(ui.area.markdown)}.html`;
    const src = generateCleanHTML(view);
    $(src).find('a.anchor').remove();
    const html = src[0].outerHTML;
    const blob = new Blob([html], {
        type: "text/html;charset=utf-8"
    });
    saveAs(blob, filename, true);
}

//extract markdown body to html and compile to template
export function exportToHTML(view) {
    const title = renderTitle(ui.area.markdown);
    const filename = `${renderFilename(ui.area.markdown)}.html`;
    const src = generateCleanHTML(view);
    //generate toc
    const toc = $('#ui-toc').clone();
    toc.find('*').removeClass('active').find("a[href^='#'][smoothhashscroll]").removeAttr('smoothhashscroll');
    const tocAffix = $('#ui-toc-affix').clone();
    tocAffix.find('*').removeClass('active').find("a[href^='#'][smoothhashscroll]").removeAttr('smoothhashscroll');
    //generate html via template
    $.get(`${serverurl}/build/html.min.css`, css => {
        $.get(`${serverurl}/views/html.hbs`, data => {
            const template = Handlebars.compile(data);
            const context = {
                url: serverurl,
                title,
                css,
                html: src[0].outerHTML,
                'ui-toc': toc.html(),
                'ui-toc-affix': tocAffix.html(),
                lang: (md && md.meta && md.meta.lang) ? `lang="${md.meta.lang}"` : null,
                dir: (md && md.meta && md.meta.dir) ? `dir="${md.meta.dir}"` : null
            };
            const html = template(context);
            //        console.log(html);
            const blob = new Blob([html], {
                type: "text/html;charset=utf-8"
            });
            saveAs(blob, filename, true);
        });
    });
}

//jQuery sortByDepth
$.fn.sortByDepth = function () {
    const ar = this.map(function () {
            return {
                length: $(this).parents().length,
                elt: this
            }
        }).get();

    const result = [];
    let i = ar.length;
    ar.sort((a, b) => a.length - b.length);
    while (i--) {
        result.push(ar[i].elt);
    }
    return $(result);
};

function toggleTodoEvent(e) {
    const startline = $(this).closest('li').attr('data-startline') - 1;
    const line = editor.getLine(startline);
    const matches = line.match(/^[>\s]*[\-\+\*]\s\[([x ])\]/);
    if (matches && matches.length >= 2) {
        let checked = null;
        if (matches[1] == 'x')
            checked = true;
        else if (matches[1] == ' ')
            checked = false;
        const replacements = matches[0].match(/(^[>\s]*[\-\+\*]\s\[)([x ])(\])/);
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

let tocExpand = false;

function checkExpandToggle() {
    const toc = $('.ui-toc-dropdown .toc');
    const toggle = $('.expand-toggle');
    if (!tocExpand) {
        toc.removeClass('expand');
        toggle.text('Expand all');
    } else {
        toc.addClass('expand');
        toggle.text('Collapse all');
    }
}

//toc
export function generateToc(id) {
    const target = $(`#${id}`);
    target.html('');
    new Toc('doc', {
        'level': 3,
        'top': -1,
        'class': 'toc',
        'ulClass': 'nav',
        'targetId': id,
        'process': getHeaderContent
    });
    if (target.text() == 'undefined')
        target.html('');
    const tocMenu = $('<div class="toc-menu"></div');
    const toggle = $('<a class="expand-toggle" href="#">Expand all</a>');
    const backtotop = $('<a class="back-to-top" href="#">Back to top</a>');
    const gotobottom = $('<a class="go-to-bottom" href="#">Go to bottom</a>');
    checkExpandToggle();
    toggle.click(e => {
        e.preventDefault();
        e.stopPropagation();
        tocExpand = !tocExpand;
        checkExpandToggle();
    });
    backtotop.click(e => {
        e.preventDefault();
        e.stopPropagation();
        if (scrollToTop)
            scrollToTop();
        removeHash();
    });
    gotobottom.click(e => {
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
export function smoothHashScroll() {
    const hashElements = $("a[href^='#']:not([smoothhashscroll])").toArray();

    for (const element of hashElements) {
        const $element = $(element);
        const hash = element.hash;
        if (hash) {
            $element.on('click', function (e) {
                // store hash
                const hash = decodeURIComponent(this.hash);
                // escape special characters in jquery selector
                const $hash = $(hash.replace(/(:|\.|\[|\]|,)/g, "\\$1"));
                // return if no element been selected
                if ($hash.length <= 0) return;
                // prevent default anchor click behavior
                e.preventDefault();
                // animate
                $('body, html').stop(true, true).animate({
                    scrollTop: $hash.offset().top
                }, 100, "linear", () => {
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
    const iframe = $("<iframe frameborder='0' webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>");
    $(iframe).attr("src", `${src + $(element).attr("data-videoid")}?autoplay=1`);
    $(element).find('img').css('visibility', 'hidden');
    $(element).append(iframe);
}

const anchorForId = id => {
    const anchor = document.createElement("a");
    anchor.className = "anchor hidden-xs";
    anchor.href = `#${id}`;
    anchor.innerHTML = "<span class=\"octicon octicon-link\"></span>";
    anchor.title = id;
    return anchor;
};

const linkifyAnchors = (level, containingElement) => {
    const headers = containingElement.getElementsByTagName(`h${level}`);

    for (let i = 0, l = headers.length; i < l; i++) {
        let header = headers[i];
        if (header.getElementsByClassName("anchor").length == 0) {
            if (typeof header.id == "undefined" || header.id == "") {
                //to escape characters not allow in css and humanize
                const id = slugifyWithUTF8(getHeaderContent(header));
                header.id = id;
            }
            header.insertBefore(anchorForId(header.id), header.firstChild);
        }
    }
};

export function autoLinkify(view) {
    const contentBlock = view[0];
    if (!contentBlock) {
        return;
    }
    for (let level = 1; level <= 6; level++) {
        linkifyAnchors(level, contentBlock);
    }
}

function getHeaderContent(header) {
    const headerHTML = $(header).clone();
    headerHTML.find('.MathJax_Preview').remove();
    headerHTML.find('.MathJax').remove();
    return headerHTML[0].innerHTML;
}

export function deduplicatedHeaderId(view) {
    const headers = view.find(':header.raw').removeClass('raw').toArray();
    for (let i = 0; i < headers.length; i++) {
        const id = $(headers[i]).attr('id');
        if (!id) continue;
        const duplicatedHeaders = view.find(`:header[id="${id}"]`).toArray();
        for (let j = 0; j < duplicatedHeaders.length; j++) {
            if (duplicatedHeaders[j] != headers[i]) {
                const newId = id + j;
                const $duplicatedHeader = $(duplicatedHeaders[j]);
                $duplicatedHeader.attr('id', newId);
                const $headerLink = $duplicatedHeader.find('> .header-link');
                $headerLink.attr('href', `#${newId}`);
                $headerLink.attr('title', newId);
            }
        }
    }
}

export function renderTOC(view) {
    const tocs = view.find('.toc').toArray();
	for (let i = 0; i < tocs.length; i++) {
        const toc = $(tocs[i]);
        const id = `toc${i}`;
        toc.attr('id', id);
        const target = $(`#${id}`);
        target.html('');
        new Toc('doc', {
            'level': 3,
            'top': -1,
            'class': 'toc',
            'targetId': id,
            'process': getHeaderContent
        });
        if (target.text() == 'undefined')
            target.html('');
        target.replaceWith(target.html());
    }
}

export function scrollToHash() {
    const hash = location.hash;
    location.hash = "";
    location.hash = hash;
}

function highlightRender(code, lang) {
    if (!lang || /no(-?)highlight|plain|text/.test(lang))
        return;
    code = S(code).escapeHTML().s
    if (lang == 'sequence') {
        return `<div class="sequence-diagram raw">${code}</div>`;
    } else if (lang == 'flow') {
        return `<div class="flow-chart raw">${code}</div>`;
    } else if (lang == 'graphviz') {
        return `<div class="graphviz raw">${code}</div>`;
    } else if (lang == 'mermaid') {
        return `<div class="mermaid raw">${code}</div>`;
    }
    const result = {
        value: code
    };
	const showlinenumbers = /\=$|\=\d+$|\=\+$/.test(lang);
    if (showlinenumbers) {
		let startnumber = 1;
		const matches = lang.match(/\=(\d+)$/);
		if (matches)
			startnumber = parseInt(matches[1]);
        const lines = result.value.split('\n');
        const linenumbers = [];
        for (let i = 0; i < lines.length - 1; i++) {
            linenumbers[i] = `<span data-linenumber='${startnumber + i}'></span>`;
        }
		const continuelinenumber = /\=\+$/.test(lang);
        const linegutter = `<div class='gutter linenumber${continuelinenumber ? " continue" : ""}'>${linenumbers.join('\n')}</div>`;
        result.value = `<div class='wrapper'>${linegutter}<div class='code'>${result.value}</div></div>`;
    }
    return result.value;
}

import markdownit from 'markdown-it';
import markdownitContainer from 'markdown-it-container';

export let md = markdownit('default', {
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
md.use(require('markdown-it-mathjax')({
    beforeMath: '<span class="mathjax raw">',
    afterMath: '</span>',
    beforeInlineMath: '<span class="mathjax raw">\\(',
    afterInlineMath: '\\)</span>',
    beforeDisplayMath: '<span class="mathjax raw">\\[',
    afterDisplayMath: '\\]</span>'
}));
md.use(require('markdown-it-imsize'));

md.use(require('markdown-it-emoji'), {
    shortcuts: {}
});

emojify.setConfig({
    blacklist: {
        elements: ['script', 'textarea', 'a', 'pre', 'code', 'svg'],
        classes: ['no-emojify']
    },
    img_dir: `${serverurl}/build/emojify.js/dist/images/basic`,
    ignore_emoticons: true
});

md.renderer.rules.emoji = (token, idx) => emojify.replace(`:${token[idx].markup}:`);

function renderContainer(tokens, idx, options, env, self) {
    tokens[idx].attrJoin('role', 'alert');
    tokens[idx].attrJoin('class', 'alert');
    tokens[idx].attrJoin('class', `alert-${tokens[idx].info.trim()}`);
    return self.renderToken(...arguments);
}
md.use(markdownitContainer, 'success', { render: renderContainer });
md.use(markdownitContainer, 'info', { render: renderContainer });
md.use(markdownitContainer, 'warning', { render: renderContainer });
md.use(markdownitContainer, 'danger', { render: renderContainer });

md.renderer.rules.image = function (tokens, idx, options, env, self) {
    tokens[idx].attrJoin('class', 'raw');
    return self.renderToken(...arguments);
};
md.renderer.rules.list_item_open = function (tokens, idx, options, env, self) {
    tokens[idx].attrJoin('class', 'raw');
    return self.renderToken(...arguments);
};
md.renderer.rules.blockquote_open = function (tokens, idx, options, env, self) {
    tokens[idx].attrJoin('class', 'raw');
    return self.renderToken(...arguments);
};
md.renderer.rules.heading_open = function (tokens, idx, options, env, self) {
    tokens[idx].attrJoin('class', 'raw');
    return self.renderToken(...arguments);
};
md.renderer.rules.fence = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    const info = token.info ? md.utils.unescapeAll(token.info).trim() : '';
    let langName = '';
    let highlighted;

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
        return `${highlighted}\n`;
    }

    return  `<pre><code${self.renderAttrs(token)}>${highlighted}</code></pre>\n`;
};

/* Defined regex markdown it plugins */
import Plugin from 'markdown-it-regexp';

//youtube
const youtubePlugin = new Plugin(
    // regexp to match
    /{%youtube\s*([\d\D]*?)\s*%}/,

    (match, utils) => {
        const videoid = match[1];
        if (!videoid) return;
        const div = $('<div class="youtube raw"></div>');
        div.attr('data-videoid', videoid);
        const thumbnail_src = `//img.youtube.com/vi/${videoid}/hqdefault.jpg`;
        const image = `<img src="${thumbnail_src}" />`;
        div.append(image);
        const icon = '<i class="icon fa fa-youtube-play fa-5x"></i>';
        div.append(icon);
        return div[0].outerHTML;
    }
);
//vimeo
const vimeoPlugin = new Plugin(
    // regexp to match
    /{%vimeo\s*([\d\D]*?)\s*%}/,

    (match, utils) => {
        const videoid = match[1];
        if (!videoid) return;
        const div = $('<div class="vimeo raw"></div>');
        div.attr('data-videoid', videoid);
        const icon = '<i class="icon fa fa-vimeo-square fa-5x"></i>';
        div.append(icon);
        return div[0].outerHTML;
    }
);
//gist
const gistPlugin = new Plugin(
    // regexp to match
    /{%gist\s*([\d\D]*?)\s*%}/,

    (match, utils) => {
        const gistid = match[1];
        const code = `<code data-gist-id="${gistid}"/>`;
        return code;
    }
);
//TOC
const tocPlugin = new Plugin(
    // regexp to match
    /^\[TOC\]$/i,

    (match, utils) => '<div class="toc"></div>'
);
//slideshare
const slidesharePlugin = new Plugin(
    // regexp to match
    /{%slideshare\s*([\d\D]*?)\s*%}/,

    (match, utils) => {
        const slideshareid = match[1];
        const div = $('<div class="slideshare raw"></div>');
        div.attr('data-slideshareid', slideshareid);
        return div[0].outerHTML;
    }
);
//speakerdeck
const speakerdeckPlugin = new Plugin(
    // regexp to match
    /{%speakerdeck\s*([\d\D]*?)\s*%}/,

    (match, utils) => {
        const speakerdeckid = match[1];
        const div = $('<div class="speakerdeck raw"></div>');
        div.attr('data-speakerdeckid', speakerdeckid);
        return div[0].outerHTML;
    }
);
//pdf
const pdfPlugin = new Plugin(
    // regexp to match
    /{%pdf\s*([\d\D]*?)\s*%}/,

    (match, utils) => {
        const pdfurl = match[1];
        if (!isValidURL(pdfurl)) return match[0];
        const div = $('<div class="pdf raw"></div>');
        div.attr('data-pdfurl', pdfurl);
        return div[0].outerHTML;
    }
);

//yaml meta, from https://github.com/eugeneware/remarkable-meta
function get(state, line) {
    const pos = state.bMarks[line];
    const max = state.eMarks[line];
    return state.src.substr(pos, max - pos);
}

function meta(state, start, end, silent) {
    if (start !== 0 || state.blkIndent !== 0) return false;
    if (state.tShift[start] < 0) return false;
    if (!get(state, start).match(/^---$/)) return false;

    const data = [];
    for (var line = start + 1; line < end; line++) {
        const str = get(state, line);
        if (str.match(/^(\.{3}|-{3})$/)) break;
        if (state.tShift[line] < 0) break;
        data.push(str);
    }

    if (line >= end) return false;

    try {
        md.meta = jsyaml.safeLoad(data.join('\n')) || {};
        delete md.metaError;
    } catch(err) {
        md.metaError = err;
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

export default {
  md
};
