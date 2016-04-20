var options = {
    valueNames: ['id', 'text', 'timestamp', 'fromNow', 'time', 'tags', 'pinned'],
    item: '<li class="col-xs-12 col-sm-6 col-md-6 col-lg-4">\
            <span class="id" style="display:none;"></span>\
            <a href="#">\
                <div class="item">\
					<div class="ui-history-pin fa fa-thumb-tack fa-fw"></div>\
                    <div class="ui-history-close fa fa-close fa-fw" data-toggle="modal" data-target=".delete-modal"></div>\
                    <div class="content">\
                        <h4 class="text"></h4>\
                        <p>\
                            <i><i class="fa fa-clock-o"></i> visited </i><i class="fromNow"></i>\
                            <br>\
                            <i class="timestamp" style="display:none;"></i>\
                            <i class="time"></i>\
                        </p>\
                        <p class="tags"></p>\
                    </div>\
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
	//sort by pinned then timestamp
	list.sort('', {
        sortFunction: function (a, b) {
			var notea = a.values();
            var noteb = b.values();
			if (notea.pinned && !noteb.pinned) {
                return -1;
            } else if (!notea.pinned && noteb.pinned) {
                return 1;
            } else {
				if (notea.timestamp > noteb.timestamp) {
                	return -1;
				} else if (notea.timestamp < noteb.timestamp) {
					return 1;
				} else {
					return 0;
				}
			}
		}
	});
    var filtertags = [];
    $(".item").each(function (key, value) {
        var a = $(this).closest("a");
        var pin = $(this).find(".ui-history-pin");
        var id = a.siblings("span").html();
        var tagsEl = $(this).find(".tags");
        var item = historyList.get('id', id);
        if (item.length > 0 && item[0]) {
            var values = item[0].values();
			//parse pinned
			if (values.pinned) {
				pin.addClass('active');
			} else {
				pin.removeClass('active');
			}
            //parse link to element a
            a.attr('href', serverurl + '/' + values.id);
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
        var value = list.get('id', id)[0].values();
        $('.ui-delete-modal-msg').text('Do you really want to delete below history?');
        $('.ui-delete-modal-item').html('<i class="fa fa-file-text"></i> ' + value.text + '<br><i class="fa fa-clock-o"></i> ' + value.time);
        clearHistory = false;
        deleteId = id;
    });
	$(".ui-history-pin").click(function (e) {
        e.preventDefault();
		var $this = $(this);
        var id = $this.closest("a").siblings("span").html();
		var item = list.get('id', id)[0];
        var values = item.values();
		var pinned = values.pinned;
        if (!values.pinned) {
			pinned = true;
			item._values.pinned = true;
		} else {
			pinned = false;
			item._values.pinned = false;
		}
		getHistory(function (notehistory) {
			for(var i = 0; i < notehistory.length; i++) {
				if (notehistory[i].id == id) {
					notehistory[i].pinned = pinned;
					break;
				}
			}
            saveHistory(notehistory);
            if (pinned)
				$this.addClass('active');
			else
				$this.removeClass('active');
        });
    });
    buildTagsFilter(filtertags);
}

//auto update item fromNow every minutes
setInterval(updateItemFromNow, 60000);

function updateItemFromNow() {
    var items = $('.item').toArray();
    for (var i = 0; i < items.length; i++) {
        var item = $(items[i]);
        var timestamp = parseInt(item.find('.timestamp').text());
        item.find('.fromNow').text(moment(timestamp).fromNow());
    }
}

var clearHistory = false;
var deleteId = null;

function deleteHistory() {
    if (clearHistory) {
        saveHistory([]);
        historyList.clear();
        checkHistoryList();
        deleteId = null;
    } else {
        if (!deleteId) return;
        getHistory(function (notehistory) {
            var newnotehistory = removeHistory(deleteId, notehistory);
            saveHistory(newnotehistory);
            historyList.remove('id', deleteId);
            checkHistoryList();
            deleteId = null;
        });
    }
    $('.delete-modal').modal('hide');
    clearHistory = false;
}

$(".ui-delete-modal-confirm").click(function () {
    deleteHistory();
});

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
    $('.ui-delete-modal-msg').text('Do you really want to clear all history?');
    $('.ui-delete-modal-item').html('There is no turning back.');
    clearHistory = true;
    deleteId = null;
});

$(".ui-refresh-history").click(function () {
    resetCheckAuth();
    historyList.clear();
    parseHistory(historyList, parseHistoryCallback);
});

$(".ui-logout").click(function () {
    clearLoginState();
    location.href = serverurl + '/logout';
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
            version: "0.4.0",
            tag: "first-year",
            date: moment("201604201430", 'YYYYMMDDhhmm').fromNow(),
            detail: [
                {
                    title: "Features",
                    item: [
                            "+ Support docs",
                            "+ Support Ionicons and Octicons",
                            "+ Support mermaid diagram",
                            "+ Support import and export with Gist",
                            "+ Support import and export with Google Drive",
                            "+ Support more options in YAML metadata",
                            "+ Support change keymap and indentation size/type"
                        ]
                    },
                {
                    title: "Enhancements",
                    item: [
                            "* Change header anchor styles",
                            "* Refactor server code and configs",
                            "* Support experimental spell checking",
                            "* Upgrade CodeMirror to 5.13.5",
                            "* Update to emit info and disconnect clients if updater get errors",
                            "* Support to indicate if the note status is created or updated",
                            "* Support more DB types",
                            "* Server now use ORM for DBs",
                            "* Support static file cache",
                            "* Support more ssl settings",
                            "* Improve server stablilty",
                            "* Improve server performance",
                            "* Support Ionicons",
                            "* Support container syntax and styles",
                            "* Improve input performance",
                            "* Change markdown engine from remarkable to markdown-it",
                            "* Server now support set sub url path",
                            "* Support textcomplete in multiple editing",
                            "* Update to filter XSS on rendering",
                            "* Update to make sync scroll lerp on last line",
                            "* Update to make continue list in todo list default as unchecked",
                            "* Support auto indent whole line in list or blockquote"
                        ]
                    },
				{
                    title: "Fixes",
                    item: [
                            "* Fix status bar might be inserted before loaded",
                            "* Fix mobile layout and focus issues",
                            "* Fix editor layout and styles might not handle correctly",
                            "* Fix all diagram rendering method and styles to avoid partial update gets wrong",
                            "* Fix to ignore process image which already wrapped by link node",
                            "* Fix when cut or patse scroll map might get wrong",
                            "* Fix to handle more socket error and info status",
                            "* Fix textcomplete not matching properly",
                            "* Fix and refactor cursor tag and cursor menu",
                            "* Fix Japanese, Chinese font styles",
                            "* Fix minor bugs of UI and seletor syntaxes"
                        ]
                    }
                ]
            },
        {
            version: "0.3.4",
            tag: "techstars",
            date: moment("201601190022", 'YYYYMMDDhhmm').fromNow(),
            detail: [
                {
                    title: "Features",
                    item: [
                            "+ Beta Support slide mode",
                            "+ Beta Support export to PDF",
                            "+ Support TOC syntax",
                            "+ Support embed slideshare and speakerdeck",
                            "+ Support Graphviz charts",
                            "+ Support YAML metadata",
                            "+ Support private permission"
                        ]
                    },
                {
                    title: "Enhancements",
                    item: [
                            "* Support pin note in history",    
                            "* Support IE9 and above",
                            "* Support specify and continue line number in code block",
                            "* Changed all embed layout to 100% width",
                            "* Added auto detect default mode",
                            "* Support show last change note user",
                            "* Upgrade CodeMirror to 5.10.1 with some manual patches",
                            "* Improved server performance",
                            "* Support autocomplete for code block languages of charts"
                        ]
                    },
				{
                    title: "Fixes",
                    item: [
                            "* Fixed some server connection issues",
                            "* Fixed several issues cause scrollMap incorrect",
                            "* Fixed cursor animation should not apply on scroll",
                            "* Fixed a possible bug in partial update",
                            "* Fixed internal href should not link out",
                            "* Fixed dropbox saver url not correct",
                            "* Fixed mathjax might not parse properly",
                            "* Fixed sequence diagram might render multiple times"
                        ]
                    }
                ]
            },
		{
            version: "0.3.3",
            tag: "moon-festival",
            date: moment("201509271400", 'YYYYMMDDhhmm').fromNow(),
            detail: [
                {
                    title: "Features",
                    item: [
                            "+ Added status bar below editor",
                            "+ Added resizable grid in both mode",
                            "+ Added title reminder if have unread changes",
                            "+ Support todo list change in the view mode",
                            "+ Support export to HTML",
                            "+ Changed to a new theme, One Dark(modified version)"
                        ]
                    },
                {
                    title: "Enhancements",
                    item: [
                            "* Support extra tags in todo list",
                            "* Changed overall font styles",
                            "* Optimized build sync scroll map, gain lots better performance",
                            "* Support and improved print styles",
                            "* Support to use CDN",
                            "* Image and link will href to new tab ors window",
                            "* Support auto scroll to corresponding position when change mode from view to edit",
                            "* Minor UI/UX tweaks"
                        ]
                    },
				{
                    title: "Fixes",
                    item: [
                            "* Change DB schema to support long title",
                            "* Change editable permission icon to avoid misunderstanding",
                            "* Fixed some issues in OT and reconnection",
                            "* Fixed cursor menu and cursor tag are not calculate doc height properly",
                            "* Fixed scroll top might not animate",
                            "* Fixed scroll top not save and restore properly",
                            "* Fixed history might not delete or clear properly",
                            "* Fixed server might not clean client properly"
                        ]
                    }
                ]
            },
        {
            version: "0.3.2",
            tag: "typhoon",
            date: moment("201507111230", 'YYYYMMDDhhmm').fromNow(),
            detail: [
                {
                    title: "Features",
                    item: [
                            "+ Support operational transformation",
                            "+ Support show other user selections",
                            "+ Support show user profile image if available"
                        ]
                    },
                {
                    title: "Enhancements",
                    item: [
                            "* Updated editor to 5.4.0",
                            "* Change UI share to publish to avoid misleading",
                            "* Added random color in blockquote tag",
                            "* Optimized image renderer, avoid duplicated rendering",
                            "* Optimized building syncscroll map, make it faster",
                            "* Optimized SEO on publish and edit note"
                        ]
                    }
                ]
            },
        {
            version: "0.3.1",
            tag: "clearsky",
            date: moment("201506301600", 'YYYYMMDDhhmm').fromNow(),
            detail: [
                {
                    title: "Features",
                    item: [
                            "+ Added auto table of content",
                            "+ Added basic permission control",
                            "+ Added view count in share note"
                        ]
                    },
                {
                    title: "Enhancements",
                    item: [
                            "* Toolbar now will hide in single view",
                            "* History time now will auto update",
                            "* Smooth scroll on anchor changed",
                            "* Updated video style"
                        ]
                    },
                {
                    title: "Fixes",
                    item: [
                            "* Note might not clear when all users disconnect",
                            "* Blockquote tag not parsed properly",
                            "* History style not correct"
                        ]
                    }
                ]
            },
        {
            version: "0.3.0",
            tag: "sunrise",
            date: moment("201506152400", 'YYYYMMDDhhmm').fromNow(),
            detail: [
                {
                    title: "Enhancements",
                    item: [
                            "* Used short url in share notes",
                            "* Added upload image button on toolbar",
                            "* Share notes are now SEO and mobile friendly",
                            "* Updated code block style",
                            "* Newline now will cause line breaks",
                            "* Image now will link out",
                            "* Used otk to avoid race condition",
                            "* Used hash to avoid data inconsistency",
                            "* Optimized server realtime script"
                        ]
                    },
                {
                    title: "Fixes",
                    item: [
                            "* Composition input might lost or duplicated when other input involved",
                            "* Note title might not save properly",
                            "* Todo list not render properly"
                        ]
                    }
                ]
            },
        {
            version: "0.2.9",
            tag: "wildfire",
            date: moment("201505301400", 'YYYYMMDDhhmm').fromNow(),
            detail: [
                {
                    title: "Features",
                    item: [
                            "+ Support text auto complete",
                            "+ Support cursor tag and random last name",
                            "+ Support online user list",
                            "+ Support show user info in blockquote"
                        ]
                    },
                {
                    title: "Enhancements",
                    item: [
                            "* Added more code highlighting support",
                            "* Added more continue list support",
                            "* Adjust menu and history filter UI for better UX",
                            "* Adjust sync scoll animte to gain performance",
                            "* Change compression method of dynamic data",
                            "* Optimized render script"
                        ]
                    },
                {
                    title: "Fixes",
                    item: [
                            "* Access history fallback might get wrong",
                            "* Sync scroll not accurate",
                            "* Sync scroll reach bottom range too much",
                            "* Detect login state change not accurate",
                            "* Detect editor focus not accurate",
                            "* Server not handle some editor events"
                        ]
                    }
                ]
            },
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