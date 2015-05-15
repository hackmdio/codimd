//constant vars
//settings
var debug = true;
var version = '0.2.8';
var doneTypingDelay = 400;
var finishChangeDelay = 400;
var cursorActivityDelay = 50;
var cursorAnimatePeriod = 100;
var modeType = {
    edit: {},
    view: {},
    both: {}
}
var statusType = {
    connected: {
        msg: "CONNECTED",
        label: "label-warning",
        fa: "fa-wifi"
    },
    online: {
        msg: "ONLINE: ",
        label: "label-primary",
        fa: "fa-users"
    },
    offline: {
        msg: "OFFLINE",
        label: "label-danger",
        fa: "fa-plug"
    }
}
var defaultMode = modeType.both;

//global vars
var loaded = false;
var isDirty = false;
var editShown = false;
var visibleXS = false;
var visibleSM = false;
var visibleMD = false;
var visibleLG = false;
var isTouchDevice = 'ontouchstart' in document.documentElement;
var currentMode = defaultMode;
var currentStatus = statusType.offline;
var lastInfo = {
    needRestore: false,
    cursor: null,
    scroll: null,
    edit: {
        scroll: {
            left: null,
            top: null
        },
        cursor: {
            line: null,
            ch: null
        }
    },
    view: {
        scroll: {
            left: null,
            top: null
        }
    },
    history: null
};

//editor settings
var textit = document.getElementById("textit");
if (!textit) throw new Error("There was no textit area!");
var editor = CodeMirror.fromTextArea(textit, {
    mode: 'gfm',
    keyMap: "sublime",
    viewportMargin: 20,
    styleActiveLine: true,
    lineNumbers: true,
    lineWrapping: true,
    showCursorWhenSelecting: true,
    theme: "monokai",
    autofocus: true,
    inputStyle: "textarea",
    scrollbarStyle: "overlay",
    matchBrackets: true,
    autoCloseBrackets: true,
    matchTags: {
        bothTags: true
    },
    autoCloseTags: true,
    foldGutter: true,
    gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
    extraKeys: {
        "Enter": "newlineAndIndentContinueMarkdownList"
    },
    readOnly: true
});
inlineAttachment.editors.codemirror4.attach(editor);

//ui vars
var ui = {
    spinner: $(".ui-spinner"),
    content: $(".ui-content"),
    toolbar: {
        shortStatus: $(".ui-short-status"),
        status: $(".ui-status"),
        new: $(".ui-new"),
        pretty: $(".ui-pretty"),
        download: {
            markdown: $(".ui-download-markdown")
        },
        save: {
            dropbox: $(".ui-save-dropbox")
        },
        import: {
            dropbox: $(".ui-import-dropbox"),
            clipboard: $(".ui-import-clipboard")
        },
        mode: $(".ui-mode"),
        edit: $(".ui-edit"),
        view: $(".ui-view"),
        both: $(".ui-both")
    },
    area: {
        edit: $(".ui-edit-area"),
        view: $(".ui-view-area"),
        codemirror: $(".ui-edit-area .CodeMirror"),
        markdown: $(".ui-view-area .markdown-body")
    }
};

//page actions
var opts = {
    lines: 11, // The number of lines to draw
    length: 20, // The length of each line
    width: 2, // The line thickness
    radius: 30, // The radius of the inner circle
    corners: 0, // Corner roundness (0..1)
    rotate: 0, // The rotation offset
    direction: 1, // 1: clockwise, -1: counterclockwise
    color: '#000', // #rgb or #rrggbb or array of colors
    speed: 1.1, // Rounds per second
    trail: 60, // Afterglow percentage
    shadow: false, // Whether to render a shadow
    hwaccel: true, // Whether to use hardware acceleration
    className: 'spinner', // The CSS class to assign to the spinner
    zIndex: 2e9, // The z-index (defaults to 2000000000)
    top: '50%', // Top position relative to parent
    left: '50%' // Left position relative to parent
};
var spinner = new Spinner(opts).spin(ui.spinner[0]);
//when page ready
$(document).ready(function () {
    checkResponsive();
    changeMode(currentMode);
    /* we need this only on touch devices */
    if (isTouchDevice) {
        /* cache dom references */
        var $body = jQuery('body');

        /* bind events */
        $(document)
            .on('focus', 'textarea, input', function () {
                $body.addClass('fixfixed');
            })
            .on('blur', 'textarea, input', function () {
                $body.removeClass('fixfixed');
            });
    }
});
//when page resize
var windowResizeDelay = 200;
var windowResizeTimer = null;
$(window).resize(function () {
    clearTimeout(windowResizeTimer);
    windowResizeTimer = setTimeout(function () {
        windowResize();
    }, windowResizeDelay);
});
function windowResize() {
    checkResponsive();
    clearMap();
    syncScrollToView();
}
//768-792px have a gap
function checkResponsive() {
    visibleXS = $(".visible-xs").is(":visible");
    visibleSM = $(".visible-sm").is(":visible");
    visibleMD = $(".visible-md").is(":visible");
    visibleLG = $(".visible-lg").is(":visible");
    if (visibleXS && currentMode == modeType.both)
        if (editor.hasFocus())
            changeMode(modeType.edit);
        else
            changeMode(modeType.view);
    if (visibleXS)
        $('.CodeMirror').css('height', 'auto');
    else
        $('.CodeMirror').css('height', '');
}

function showStatus(type, num) {
    currentStatus = type;
    var shortStatus = ui.toolbar.shortStatus;
    var status = ui.toolbar.status;
    var label = $('<span class="label"></span>');
    var fa = $('<i class="fa"></i>');
    var msg = "";
    var shortMsg = "";

    shortStatus.html("");
    status.html("");

    switch (currentStatus) {
    case statusType.connected:
        label.addClass(statusType.connected.label);
        fa.addClass(statusType.connected.fa);
        msg = statusType.connected.msg;
        break;
    case statusType.online:
        label.addClass(statusType.online.label);
        fa.addClass(statusType.online.fa);
        shortMsg = " " + num;
        msg = statusType.online.msg + num;
        break;
    case statusType.offline:
        label.addClass(statusType.offline.label);
        fa.addClass(statusType.offline.fa);
        msg = statusType.offline.msg;
        break;
    }

    label.append(fa);
    var shortLabel = label.clone();

    shortLabel.append(" " + shortMsg);
    shortStatus.append(shortLabel);

    label.append(" " + msg);
    status.append(label);
}

function toggleMode() {
    switch (currentMode) {
    case modeType.edit:
        changeMode(modeType.view);
        break;
    case modeType.view:
        changeMode(modeType.edit);
        break;
    case modeType.both:
        changeMode(modeType.view);
        break;
    }
}

function changeMode(type) {
    saveInfo();
    if (type)
        currentMode = type;
    var responsiveClass = "col-lg-6 col-md-6 col-sm-6";
    var scrollClass = "ui-scrollable";
    ui.area.codemirror.removeClass(scrollClass);
    ui.area.edit.removeClass(responsiveClass);
    ui.area.view.removeClass(scrollClass);
    ui.area.view.removeClass(responsiveClass);
    switch (currentMode) {
    case modeType.edit:
        ui.area.edit.show();
        ui.area.view.hide();
        if (!editShown) {
            editor.refresh();
            editShown = true;
        }
        break;
    case modeType.view:
        ui.area.edit.hide();
        ui.area.view.show();
        break;
    case modeType.both:
        ui.area.codemirror.addClass(scrollClass);
        ui.area.edit.addClass(responsiveClass).show();
        ui.area.view.addClass(scrollClass);
        ui.area.view.addClass(responsiveClass).show();
        break;
    }
    if (currentMode != modeType.view && visibleLG) {
        editor.focus();
        editor.refresh();
    } else {
        editor.getInputField().blur();
    }
    if (changeMode != modeType.edit)
        updateView();
    restoreInfo();

    ui.toolbar.both.removeClass("active");
    ui.toolbar.edit.removeClass("active");
    ui.toolbar.view.removeClass("active");
    var modeIcon = ui.toolbar.mode.find('i');
    modeIcon.removeClass('fa-toggle-on').removeClass('fa-toggle-off');
    if (ui.area.edit.is(":visible") && ui.area.view.is(":visible")) { //both
        ui.toolbar.both.addClass("active");
        modeIcon.addClass('fa-eye');
    } else if (ui.area.edit.is(":visible")) { //edit
        ui.toolbar.edit.addClass("active");
        modeIcon.addClass('fa-toggle-off');
    } else if (ui.area.view.is(":visible")) { //view
        ui.toolbar.view.addClass("active");
        modeIcon.addClass('fa-toggle-on');
    }
}

//button actions
var noteId = window.location.pathname.split('/')[1];
var url = window.location.origin + '/' + noteId;
//pretty
ui.toolbar.pretty.attr("href", url + "/pretty");
//download
//markdown
ui.toolbar.download.markdown.click(function () {
    var filename = renderFilename(ui.area.markdown) + '.md';
    var markdown = editor.getValue();
    var blob = new Blob([markdown], {
        type: "text/markdown;charset=utf-8"
    });
    saveAs(blob, filename);
});
//save to dropbox
ui.toolbar.save.dropbox.click(function () {
    var filename = renderFilename(ui.area.markdown) + '.md';
    var options = {
        files: [
            {
                'url': url + "/download",
                'filename': filename
            }
        ]
    };
    Dropbox.save(options);
});
//import from dropbox
ui.toolbar.import.dropbox.click(function () {
    var options = {
        success: function (files) {
            ui.spinner.show();
            var url = files[0].link;
            importFromUrl(url);
        },
        linkType: "direct",
        multiselect: false,
        extensions: ['.md', '.html']
    };
    Dropbox.choose(options);
});
//import from clipboard
ui.toolbar.import.clipboard.click(function () {
    //na
});
//fix for wrong autofocus
$('#clipboardModal').on('shown.bs.modal', function () {
    $('#clipboardModal').blur();
});
$("#clipboardModalClear").click(function () {
    $("#clipboardModalContent").html('');
});
$("#clipboardModalConfirm").click(function () {
    var data = $("#clipboardModalContent").html();
    if (data) {
        parseToEditor(data);
        $('#clipboardModal').modal('hide');
        $("#clipboardModalContent").html('');
    }
});

function parseToEditor(data) {
    var parsed = toMarkdown(data);
    if (parsed)
        editor.replaceRange(parsed, {
            line: 0,
            ch: 0
        }, {
            line: editor.lastLine(),
            ch: editor.lastLine().length
        }, '+input');
}

function importFromUrl(url) {
    //console.log(url);
    if (url == null) return;
    if (!isValidURL(url)) {
        alert('Not valid URL :(');
        return;
    }
    $.ajax({
        method: "GET",
        url: url,
        success: function (data) {
            parseToEditor(data);
        },
        error: function () {
            alert('Import failed :(');
        },
        complete: function () {
            ui.spinner.hide();
        }
    });
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
    //mode
ui.toolbar.mode.click(function () {
    toggleMode();
});
//edit
ui.toolbar.edit.click(function () {
    changeMode(modeType.edit);
});
//view
ui.toolbar.view.click(function () {
    changeMode(modeType.view);
});
//both
ui.toolbar.both.click(function () {
    changeMode(modeType.both);
});

//socket.io actions
var socket = io.connect();
socket.on('info', function (data) {
    console.error(data);
    location.href = "./404.html";
});
socket.on('disconnect', function (data) {
    showStatus(statusType.offline);
    if (loaded) {
        saveInfo();
        lastInfo.history = editor.getHistory();
    }
    if (!editor.getOption('readOnly'))
        editor.setOption('readOnly', true);
});
socket.on('connect', function (data) {
    showStatus(statusType.connected);
    socket.emit('version');
});
socket.on('version', function (data) {
    if (data != version)
        location.reload(true);
});
socket.on('refresh', function (data) {
    saveInfo();

    var body = data.body;
    body = LZString.decompressFromBase64(body);
    if (body)
        editor.setValue(body);
    else
        editor.setValue("");

    if (!loaded) {
        editor.clearHistory();
        ui.spinner.hide();
        ui.content.fadeIn();
        changeMode();
        loaded = true;
    } else {
        if (LZString.compressToBase64(editor.getValue()) !== data.body)
            editor.clearHistory();
        else {
            if (lastInfo.history)
                editor.setHistory(lastInfo.history);
        }
        lastInfo.history = null;
    }

    updateView();

    if (editor.getOption('readOnly'))
        editor.setOption('readOnly', false);

    restoreInfo();
});
socket.on('change', function (data) {
    data = LZString.decompressFromBase64(data);
    data = JSON.parse(data);
    editor.replaceRange(data.text, data.from, data.to, "ignoreHistory");
    isDirty = true;
    clearTimeout(finishChangeTimer);
    finishChangeTimer = setTimeout(finishChange, finishChangeDelay);
});
socket.on('online users', function (data) {
    if (debug)
        console.debug(data);
    showStatus(statusType.online, data.count);
    $('.other-cursors').children().each(function (key, value) {
        var found = false;
        for (var i = 0; i < data.users.length; i++) {
            var user = data.users[i];
            if ($(this).attr('id') == user.id)
                found = true;
        }
        if (!found)
            $(this).remove();
    });
    for (var i = 0; i < data.users.length; i++) {
        var user = data.users[i];
        if (user.id != socket.id)
            buildCursor(user.id, user.color, user.cursor);
    }
});
socket.on('cursor focus', function (data) {
    if (debug)
        console.debug(data);
    var cursor = $('#' + data.id);
    if (cursor.length > 0) {
        cursor.fadeIn();
    } else {
        if (data.id != socket.id)
            buildCursor(data.id, data.color, data.cursor);
    }
});
socket.on('cursor activity', function (data) {
    if (debug)
        console.debug(data);
    if (data.id != socket.id)
        buildCursor(data.id, data.color, data.cursor);
});
socket.on('cursor blur', function (data) {
    if (debug)
        console.debug(data);
    var cursor = $('#' + data.id);
    if (cursor.length > 0) {
        cursor.fadeOut();
    }
});

function emitUserStatus() {
    checkIfAuth(
        function (data) {
            socket.emit('user status', {
                login: true
            });
        },
        function () {
            socket.emit('user status', {
                login: false
            });
        }
    );
}

function buildCursor(id, color, pos) {
    if (!pos) return;
    if ($('.other-cursors').length <= 0) {
        $("<div class='other-cursors'>").insertAfter('.CodeMirror-cursors');
    }
    if ($('#' + id).length <= 0) {
        var cursor = $('<div id="' + id + '" class="other-cursor">&nbsp;</div>');
        //console.debug(pos);
        cursor.attr('data-line', pos.line);
        cursor.attr('data-ch', pos.ch);
        var coord = editor.charCoords(pos, 'windows');
        cursor[0].style.left = coord.left + 'px';
        cursor[0].style.top = coord.top + 'px';
        cursor[0].style.height = '18px';
        cursor[0].style.borderLeft = '2px solid ' + color;
        $('.other-cursors').append(cursor);
        cursor.hide().fadeIn();
    } else {
        var cursor = $('#' + id);
        cursor.attr('data-line', pos.line);
        cursor.attr('data-ch', pos.ch);
        var coord = editor.charCoords(pos, 'windows');
        cursor.stop(true).css('opacity', 1).animate({
            "left": coord.left,
            "top": coord.top
        }, cursorAnimatePeriod);
        //cursor[0].style.left = coord.left + 'px';
        //cursor[0].style.top = coord.top + 'px';
        cursor[0].style.height = '18px';
        cursor[0].style.borderLeft = '2px solid ' + color;
    }
}

//editor actions
editor.on('beforeChange', function (cm, change) {
    if (debug)
        console.debug(change);
});
editor.on('change', function (i, op) {
    if (debug)
        console.debug(op);
    if (op.origin != 'setValue' && op.origin != 'ignoreHistory') {
        socket.emit('change', LZString.compressToBase64(JSON.stringify(op)));
    }
    isDirty = true;
    clearTimeout(doneTypingTimer);
    doneTypingTimer = setTimeout(doneTyping, doneTypingDelay);
});
editor.on('focus', function (cm) {
    socket.emit('cursor focus', editor.getCursor());
});
var cursorActivityTimer = null;
editor.on('cursorActivity', function (cm) {
    clearTimeout(cursorActivityTimer);
    cursorActivityTimer = setTimeout(cursorActivity, cursorActivityDelay);
});

function cursorActivity() {
    socket.emit('cursor activity', editor.getCursor());
}
editor.on('blur', function (cm) {
    socket.emit('cursor blur');
});

function saveInfo() {
    var left = $(document.body).scrollLeft();
    var top = $(document.body).scrollTop();
    switch (currentMode) {
    case modeType.edit:
        //lastInfo.edit.scroll.left = left;
        //lastInfo.edit.scroll.top = top;
        lastInfo.edit.scroll = editor.getScrollInfo();
        break;
    case modeType.view:
        lastInfo.view.scroll.left = left;
        lastInfo.view.scroll.top = top;
        break;
    case modeType.both:
        lastInfo.edit.scroll = editor.getScrollInfo();
        lastInfo.view.scroll.left = ui.area.view.scrollLeft();
        lastInfo.view.scroll.top = ui.area.view.scrollTop();
        break;
    }
    lastInfo.edit.cursor = editor.getCursor();
    lastInfo.needRestore = true;
}

function restoreInfo() {
    if (lastInfo.needRestore) {
        var line = lastInfo.edit.cursor.line;
        var ch = lastInfo.edit.cursor.ch;
        editor.setCursor(line, ch);

        switch (currentMode) {
        case modeType.edit:
            //$(document.body).scrollLeft(lastInfo.edit.scroll.left);
            //$(document.body).scrollTop(lastInfo.edit.scroll.top);
            var left = lastInfo.edit.scroll.left;
            var top = lastInfo.edit.scroll.top;
            editor.scrollIntoView();
            editor.scrollTo(left, top);
            break;
        case modeType.view:
            $(document.body).scrollLeft(lastInfo.view.scroll.left);
            $(document.body).scrollTop(lastInfo.view.scroll.top);
            break;
        case modeType.both:
            var left = lastInfo.edit.scroll.left;
            var top = lastInfo.edit.scroll.top;
            editor.scrollIntoView();
            editor.scrollTo(left, top);
            ui.area.view.scrollLeft(lastInfo.view.scroll.left);
            ui.area.view.scrollTop(lastInfo.view.scroll.top);
            break;
        }

        lastInfo.needRestore = false;
    }
}

//view actions
var doneTypingTimer = null;
var finishChangeTimer = null;
var input = editor.getInputField();
//user is "finished typing," do something
function doneTyping() {
    updateView();
    var value = editor.getValue();
    socket.emit('refresh', LZString.compressToBase64(value));
}

function finishChange() {
    updateView();
}

var lastResult = null;

function updateView() {
    if (currentMode == modeType.edit || !isDirty) return;
    var value = editor.getValue();
    var result = postProcess(md.render(value)).children().toArray();
    //ui.area.markdown.html(result);
    //finishView(ui.area.markdown);
    partialUpdate(result, lastResult, ui.area.markdown.children().toArray());
    lastResult = $(result).clone(true);
    finishView(ui.area.view);
    writeHistory(ui.area.markdown);
    isDirty = false;
    emitUserStatus();
    clearMap();
}

function partialUpdate(src, tar, des) {
    if (!src || src.length == 0 || !tar || tar.length == 0 || !des || des.length == 0) {
        ui.area.markdown.html(src);
        return;
    }
    if (src.length == tar.length) { //same length
        for (var i = 0; i < src.length; i++) {
            copyAttribute(src[i], des[i], 'data-startline');
            copyAttribute(src[i], des[i], 'data-endline');
            var rawSrc = cloneAndRemoveDataAttr(src[i]);
            var rawTar = cloneAndRemoveDataAttr(tar[i]);
            if (rawSrc.outerHTML != rawTar.outerHTML) {
                //console.log(rawSrc);
                //console.log(rawTar);
                $(des[i]).replaceWith(src[i]);
            }
        }
    } else { //diff length
        var start = 0;
        var end = 0;
        //find diff start position
        for (var i = 0; i < tar.length; i++) {
            copyAttribute(src[i], des[i], 'data-startline');
            copyAttribute(src[i], des[i], 'data-endline');
            var rawSrc = cloneAndRemoveDataAttr(src[i]);
            var rawTar = cloneAndRemoveDataAttr(tar[i]);
            if (!rawSrc || !rawTar || rawSrc.outerHTML != rawTar.outerHTML) {
                start = i;
                break;
            }
        }
        //find diff end position
        var srcEnd = 0;
        var tarEnd = 0;
        for (var i = 0; i < src.length; i++) {
            copyAttribute(src[i], des[i], 'data-startline');
            copyAttribute(src[i], des[i], 'data-endline');
            var rawSrc = cloneAndRemoveDataAttr(src[i]);
            var rawTar = cloneAndRemoveDataAttr(tar[i]);
            if (!rawSrc || !rawTar || rawSrc.outerHTML != rawTar.outerHTML) {
                start = i;
                break;
            }
        }
        //tar end
        for (var i = 1; i <= tar.length + 1; i++) {
            var srcLength = src.length;
            var tarLength = tar.length;
            copyAttribute(src[srcLength - i], des[srcLength - i], 'data-startline');
            copyAttribute(src[srcLength - i], des[srcLength - i], 'data-endline');
            var rawSrc = cloneAndRemoveDataAttr(src[srcLength - i]);
            var rawTar = cloneAndRemoveDataAttr(tar[tarLength - i]);
            if (!rawSrc || !rawTar || rawSrc.outerHTML != rawTar.outerHTML) {
                tarEnd = tar.length - i;
                break;
            }
        }
        //src end
        for (var i = 1; i <= src.length + 1; i++) {
            var srcLength = src.length;
            var tarLength = tar.length;
            copyAttribute(src[srcLength - i], des[srcLength - i], 'data-startline');
            copyAttribute(src[srcLength - i], des[srcLength - i], 'data-endline');
            var rawSrc = cloneAndRemoveDataAttr(src[srcLength - i]);
            var rawTar = cloneAndRemoveDataAttr(tar[tarLength - i]);
            if (!rawSrc || !rawTar || rawSrc.outerHTML != rawTar.outerHTML) {
                srcEnd = src.length - i;
                break;
            }
        }
        //check if tar end overlap tar start
        var overlap = 0;
        for (var i = start; i >= 0; i--) {
            var rawTarStart = cloneAndRemoveDataAttr(tar[i - 1]);
            var rawTarEnd = cloneAndRemoveDataAttr(tar[tarEnd + 1 + start - i]);
            if (rawTarStart && rawTarEnd && rawTarStart.outerHTML == rawTarEnd.outerHTML)
                overlap++;
            else
                break;
        }
        if (debug)
            console.log('overlap:' + overlap);
        //show diff content
        if (debug) {
            console.log('start:' + start);
            console.log('tarEnd:' + tarEnd);
            console.log('srcEnd:' + srcEnd);
        }
        tarEnd += overlap;
        srcEnd += overlap;
        var repeatAdd = (start - srcEnd) < (start - tarEnd);
        var repeatDiff = Math.abs(srcEnd - tarEnd) - 1;
        //push new elements
        var newElements = [];
        if(srcEnd >= start) {
            for (var j = start; j <= srcEnd; j++) {
                if (!src[j]) continue;
                newElements.push(src[j].outerHTML);
            }
        } else if(repeatAdd) {
            for (var j = srcEnd - repeatDiff; j <= srcEnd; j++) {
                if (!des[j]) continue;
                newElements.push(des[j].outerHTML);
            }
        }
        //push remove elements
        var removeElements = [];
        if(tarEnd >= start) {
            for (var j = start; j <= tarEnd; j++) {
                if (!des[j]) continue;
                removeElements.push(des[j]);
            }
        } else if(!repeatAdd) {
            for (var j = start; j <= start + repeatDiff; j++) {
                if (!des[j]) continue;
                removeElements.push(des[j]);
            }
        }
        //add elements
        if (debug) {
            console.log('ADD ELEMENTS');
            console.log(newElements.join('\n'));
        }
        if (des[start])
            $(newElements.join('')).insertBefore(des[start]);
        else
            $(newElements.join('')).insertAfter(des[start - 1]);
        //remove elements
        if (debug)
            console.log('REMOVE ELEMENTS');
        for (var j = 0; j < removeElements.length; j++) {
            if (debug) {
                console.log(removeElements[j].outerHTML);
            }
            if (removeElements[j])
                removeElements[j].remove();
        }
    }
}

function cloneAndRemoveDataAttr(el) {
    if (!el) return;
    var rawEl = $(el).clone(true)[0];
    rawEl.removeAttribute('data-startline');
    rawEl.removeAttribute('data-endline');
    return rawEl;
}

function copyAttribute(src, des, attr) {
    if (src && src.getAttribute(attr) && des)
        des.setAttribute(attr, src.getAttribute(attr));
}