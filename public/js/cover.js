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
    if ($("#history-list").children().length > 0)
        $(".ui-nohistory").hide();
    else if ($("#history-list").children().length == 0) {
        $(".ui-nohistory").slideDown();
        var cookienotehistory = JSON.parse($.cookie('notehistory'));
        if (login && cookienotehistory && cookienotehistory.length > 0) {
            $(".ui-import-from-cookie").slideDown();
        }
    }
}

function parseHistoryCallback() {
    checkHistoryList();
    $(".ui-history-close").click(function (e) {
        e.preventDefault();
        var id = $(this).closest("a").attr("href").split('/')[1];
        getHistory(function (notehistory) {
            var newnotehistory = removeHistory(id, notehistory);
            saveHistory(newnotehistory);
        });
        $(this).closest("li").remove();
        checkHistoryList();
    });
}

var login = false;

checkIfAuth(
    function (data) {
        $('.ui-signin').hide();
        $('.ui-or').hide();
        $('.ui-welcome').show();
        $('.ui-name').html(data.name);
        $('.ui-signout').show();
        $(".ui-history").click();
        login = true;
    },
    function () {
        $('.ui-signin').slideDown();
        $('.ui-or').slideDown();
        login = false;
    }
);

parseHistory(parseHistoryCallback);

$(".ui-import-from-cookie").click(function () {
    saveCookieHistoryToServer(function() {
        parseCookieToHistory(parseHistoryCallback);
        $(".ui-import-from-cookie").hide();
    });
});

var source = $("#template").html();
var template = Handlebars.compile(source);
var context = {
    release: [
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