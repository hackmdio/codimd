var options = {
    valueNames: ['id', 'text', 'timestamp', 'fromNow', 'time', 'tags'],
    item: '<li class="col-xs-12 col-sm-6 col-md-6 col-lg-4">\
            <span class="id" style="display:none;"></span>\
            <a href="#">\
                <div class="item">\
                    <div class="ui-history-close fa fa-close fa-fw"></div>\
                    <h4 class="text"></h4>\
                    <p><i class="fromNow"><i class="fa fa-clock-o"></i></i>\
                    <br>\
                    <i class="timestamp" style="display:none;"></i><i class="time"></i></p>\
                    <p class="tags"></p>\
                </div>\
            </a>\
           </li>'
};
var historyList = new List('history', options);

migrateHistoryFromTempCallback = pageInit;
loginStateChangeEvent = pageInit;
pageInit();

function pageInit() {
    checkIfAuth(
        function (data) {
            $('.ui-signin').hide();
            $('.ui-or').hide();
            $('.ui-welcome').show();
            $('.ui-name').html(data.name);
            $('.ui-signout').show();
            $(".ui-history").click();
            parseServerToHistory(historyList, parseHistoryCallback);
        },
        function () {
            $('.ui-signin').slideDown();
            $('.ui-or').slideDown();
            $('.ui-welcome').hide();
            $('.ui-name').html('');
            $('.ui-signout').hide();
            parseStorageToHistory(historyList, parseHistoryCallback);
        }
    );
}

$(".masthead-nav li").click(function () {
    $(this).siblings().removeClass("active");
    $(this).addClass("active");
});

$(".ui-home").click(function () {
    $(".section").hide();
    $("#home").fadeIn();
});

$(".ui-history").click(function () {
    $(".section").hide();
    $("#history").fadeIn();
});

$(".ui-releasenotes").click(function () {
    $(".section").hide();
    $("#releasenotes").fadeIn();
});

function checkHistoryList() {
    if ($("#history-list").children().length > 0) {
        $(".ui-nohistory").hide();
        $(".ui-import-from-browser").hide();
    } else if ($("#history-list").children().length == 0) {
        $(".ui-nohistory").slideDown();
        getStorageHistory(function (data) {
            if (data && data.length > 0 && getLoginState() && historyList.items.length == 0) {
                $(".ui-import-from-browser").slideDown();
            }
        });
    }
}

function parseHistoryCallback(list, notehistory) {
    checkHistoryList();
    list.sort('timestamp', {
        order: "desc"
    });
    var filtertags = [];
    $(".item").each(function (key, value) {
        var a = $(this).closest("a");
        var id = a.siblings("span").html();
        var tagsEl = $(this).find(".tags");
        var item = historyList.get('id', id);
        if (item.length > 0 && item[0]) {
            var values = item[0].values();
            //parse link to element a
            a.attr('href', '/' + values.id);
            //parse tags
            if (values.tags) {
                var tags = values.tags;
                if (tags.length > 0) {
                    var labels = [];
                    for (var j = 0; j < tags.length; j++) {
                        //push info filtertags if not found
                        var found = false;
                        if (filtertags.indexOf(tags[j]) != -1)
                            found = true;
                        if (!found)
                            filtertags.push(tags[j]);
                        //push into the item label
                        labels.push("<span class='label label-default'>" + tags[j] + "</span>");
                    }
                    tagsEl.html(labels.join(' '));
                }
            }
        }
    });
    $(".ui-history-close").click(function (e) {
        e.preventDefault();
        var id = $(this).closest("a").siblings("span").html();
        getHistory(function (notehistory) {
            var newnotehistory = removeHistory(id, notehistory);
            saveHistory(newnotehistory);
        });
        list.remove('id', id);
        checkHistoryList();
    });
    buildTagsFilter(filtertags);
}

$(".ui-import-from-browser").click(function () {
    saveStorageHistoryToServer(function () {
        parseStorageToHistory(historyList, parseHistoryCallback);
    });
});

$(".ui-save-history").click(function () {
    getHistory(function (data) {
        var history = JSON.stringify(data);
        var blob = new Blob([history], {
            type: "application/json;charset=utf-8"
        });
        saveAs(blob, 'hackmd_history_' + moment().format('YYYYMMDDHHmmss'));
    });
});

$(".ui-open-history").bind("change", function (e) {
    var files = e.target.files || e.dataTransfer.files;
    var file = files[0];
    var reader = new FileReader();
    reader.onload = function () {
        var notehistory = JSON.parse(reader.result);
        //console.log(notehistory);
        if (!reader.result) return;
        getHistory(function (data) {
            var mergedata = data.concat(notehistory);
            mergedata = clearDuplicatedHistory(mergedata);
            saveHistory(mergedata);
            parseHistory(historyList, parseHistoryCallback);
        });
        $(".ui-open-history").replaceWith($(".ui-open-history").val('').clone(true));
    };
    reader.readAsText(file);
});

$(".ui-clear-history").click(function () {
    saveHistory([]);
    historyList.clear();
    checkHistoryList();
});

$(".ui-refresh-history").click(function () {
    resetCheckAuth();
    historyList.clear();
    parseHistory(historyList, parseHistoryCallback);
});

$(".ui-logout").click(function () {
    clearLoginState();
    location.href = '/logout';
});

var filtertags = [];
$(".ui-use-tags").select2({
    placeholder: 'Use tags...',
    multiple: true,
    data: function () {
        return {
            results: filtertags
        };
    }
});
$('.select2-input').css('width', 'inherit');
buildTagsFilter([]);

function buildTagsFilter(tags) {
    for (var i = 0; i < tags.length; i++)
        tags[i] = {
            id: i,
            text: tags[i]
        };
    filtertags = tags;
}
$(".ui-use-tags").on('change', function () {
    var tags = [];
    var data = $(this).select2('data');
    for (var i = 0; i < data.length; i++)
        tags.push(data[i].text);
    if (tags.length > 0) {
        historyList.filter(function (item) {
            var values = item.values();
            if (!values.tags) return false;
            var found = false;
            for (var i = 0; i < tags.length; i++) {
                if (values.tags.indexOf(tags[i]) != -1) {
                    found = true;
                    break;
                }
            }
            return found;
        });
    } else {
        historyList.filter();
    }
    checkHistoryList();
});

$('.search').keyup(function () {
    checkHistoryList();
});

var source = $("#template").html();
var template = Handlebars.compile(source);
var context = {
    release: [
        {
            version: "0.2.8",
            tag: "flame",
            date: moment("201505151200", 'YYYYMMDDhhmm').fromNow(),
            detail: [
                {
                    title: "Features",
                    item: [
                            "+ Support drag-n-drop(exclude firefox) and paste image inline",
                            "+ Support tags filter in history",
                            "+ Support sublime-like shortcut keys"
                        ]
                    },
                {
                    title: "Enhancements",
                    item: [
                            "* Adjust index description",
                            "* Adjust toolbar ui and view font",
                            "* Remove scroll sync delay and gain accuracy"
                        ]
                    },
                {
                    title: "Fixes",
                    item: [
                            "* Partial update in the front and the end might not render properly",
                            "* Server not handle some editor events"
                        ]
                    }
                ]
            },
        {
            version: "0.2.7",
            tag: "fuel",
            date: moment("201505031200", 'YYYYMMDDhhmm').fromNow(),
            detail: [
                {
                    title: "Features",
                    item: [
                            "+ Support facebook, twitter, github, dropbox login",
                            "+ Support own history"
                        ]
                    },
                {
                    title: "Enhancements",
                    item: [
                            "* Adjust history ui",
                            "* Upgrade realtime package",
                            "* Upgrade editor package, now support composition input better"
                        ]
                    },
                {
                    title: "Fixes",
                    item: [
                            "* Partial update might not render properly",
                            "* Cursor focus might not at correct position"
                        ]
                    }
                ]
            },
        {
            version: "0.2.6",
            tag: "zippo",
            date: moment("201504241600", 'YYYYMMDDhhmm').fromNow(),
            detail: [
                {
                    title: "Features",
                    item: [
                            "+ Support sync scroll",
                            "+ Support partial update"
                        ]
                    },
                {
                    title: "Enhancements",
                    item: [
                            "* Added feedback ui",
                            "* Adjust animations and delays",
                            "* Adjust editor viewportMargin for performance",
                            "* Adjust emit refresh event occasion",
                            "* Added editor fallback fonts",
                            "* Index page auto focus at history if valid"
                        ]
                    },
                {
                    title: "Fixes",
                    item: [
                            "* Server might not disconnect client properly",
                            "* Resume connection might restore wrong info"
                        ]
                    }
                ]
            },
        {
            version: "0.2.5",
            tag: "lightning",
            date: moment("201504142110", 'YYYYMMDDhhmm').fromNow(),
            detail: [
                {
                    title: "Features",
                    item: [
                            "+ Support import from dropbox and clipboard",
                            "+ Support more code highlighting",
                            "+ Support mathjax, sequence diagram and flow chart"
                        ]
                    },
                {
                    title: "Enhancements",
                    item: [
                            "* Adjust toolbar and layout style",
                            "* Adjust mobile layout style",
                            "* Adjust history layout style",
                            "* Server using heartbeat to gain accuracy of online users"
                        ]
                    },
                {
                    title: "Fixes",
                    item: [
                            "* Virtual keyboard might broken the navbar",
                            "* Adjust editor viewportMargin for preloading content"
                        ]
                    }
                ]
            },
        {
            version: "0.2.4",
            tag: "flint",
            date: moment("201504101240", 'YYYYMMDDhhmm').fromNow(),
            detail: [
                {
                    title: "Features",
                    item: [
                            "+ Support save to dropbox",
                            "+ Show other users' cursor with light color"
                        ]
                    },
                {
                    title: "Enhancements",
                    item: [
                            "* Adjust toolbar layout style for future"
                        ]
                    },
                {
                    title: "Fixes",
                    item: [
                            "* Title might not render properly",
                            "* Code border style might not show properly",
                            "* Server might not connect concurrent client properly"
                        ]
                    }
                ]
            },
        {
            version: "0.2.3",
            tag: "light",
            date: moment("201504062030", 'YYYYMMDDhhmm').fromNow(),
            detail: [
                {
                    title: "Features",
                    item: [
                            "+ Support youtube, vimeo",
                            "+ Support gist",
                            "+ Added quick link in pretty",
                            "+ Added font-smoothing style"
                        ]
                    },
                {
                    title: "Enhancements",
                    item: [
                            "* Change the rendering engine to remarkable",
                            "* Adjust view, todo list layout style for UX",
                            "+ Added responsive layout check",
                            "+ Auto reload if client version mismatch",
                            "+ Keep history stack after reconnect if nothing changed",
                            "+ Added features page"
                        ]
                    },
                {
                    title: "Fixes",
                    item: [
                            "* Closetags auto input might not have proper origin",
                            "* Autofocus on editor only if it's on desktop",
                            "+ Prevent using real script and iframe tags",
                            "* Sorting in history by time not percise"
                        ]
                    }
                ]
            },
        {
            version: "0.2.2",
            tag: "fire",
            date: moment("201503272110", 'YYYYMMDDhhmm').fromNow(),
            detail: [
                {
                    title: "Features",
                    item: [
                            "+ Support smartLists, smartypants",
                            "+ Support line number on code block",
                            "+ Support tags and search or sort history"
                        ]
                    },
                {
                    title: "Enhancements",
                    item: [
                            "+ Added delay on socket change",
                            "+ Updated markdown-body width to match github style",
                            "+ Socket changes now won't add to editor's history",
                            "* Reduce redundant server events"
                        ]
                    },
                {
                    title: "Fixes",
                    item: [
                            "* Toolbar links might get wrong",
                            "* Wrong action redirections"
                        ]
                    }
                ]
            },
        {
            version: "0.2.1",
            tag: "spark",
            date: moment("201503171340", 'YYYYMMDDhhmm').fromNow(),
            detail: [
                {
                    title: "Features",
                    item: [
                            "+ Support github-like todo-list",
                            "+ Support emoji"
                        ]
                    },
                {
                    title: "Enhancements",
                    item: [
                            "+ Added more effects on transition",
                            "+ Reduced rendering delay",
                            "+ Auto close and match brackets",
                            "+ Auto close and match tags",
                            "+ Added code fold and fold gutters",
                            "+ Added continue listing of markdown"
                        ]
                    }
                ]
            },
        {
            version: "0.2.0",
            tag: "launch-day",
            date: moment("201503142020", 'YYYYMMDDhhmm').fromNow(),
            detail: [
                {
                    title: "Features",
                    item: [
                            "+ Markdown editor",
                            "+ Preview html",
                            "+ Realtime collaborate",
                            "+ Cross-platformed",
                            "+ Recently used history"
                        ]
                    }
                ]
            }
        ]
};
var html = template(context);
$("#releasenotes").html(html);