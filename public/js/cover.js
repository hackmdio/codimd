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
           </li>',
    page: 18,
    plugins: [
        ListPagination({
            outerWindow: 1
        })
    ]
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
            if (data.photo) $('.ui-avatar').prop('src', data.photo).show();
            else $('.ui-avatar').prop('src', '').hide();
            $('.ui-name').html(data.name);
            $('.ui-signout').show();
            $(".ui-history").click();
            parseServerToHistory(historyList, parseHistoryCallback);
        },
        function () {
            $('.ui-signin').show();
            $('.ui-or').show();
            $('.ui-welcome').hide();
            $('.ui-avatar').prop('src', '').hide();
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
    if (!$("#home").is(':visible')) {
        $(".section:visible").hide();
        $("#home").fadeIn();
    }
});

$(".ui-history").click(function () {
    if (!$("#history").is(':visible')) {
        $(".section:visible").hide();
        $("#history").fadeIn();
    }
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
        checkIfAuth(function () {
            postHistoryToServer(id, {
                pinned: pinned
            }, function (err, result) {
                if (!err) {
                    if (pinned)
                        $this.addClass('active');
                    else
                        $this.removeClass('active');
                } 
            });
        }, function () {
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
        })
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
    checkIfAuth(function () {
        deleteServerHistory(deleteId, function (err, result) {
            if (!err) {
                if (clearHistory) {
                    historyList.clear();
                    checkHistoryList();
                } else {
                    historyList.remove('id', deleteId);
                    checkHistoryList();
                }
            }
            $('.delete-modal').modal('hide');
            deleteId = null;
            clearHistory = false;
        });
    }, function () {
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
    });
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
    var lastTags = $(".ui-use-tags").select2('val'); 
    $(".ui-use-tags").select2('val', '');
    historyList.filter();
    var lastKeyword = $('.search').val();
    $('.search').val('');
    historyList.search();
    $('#history-list').slideUp('fast');
    $('.pagination').slideUp('fast');
    
    resetCheckAuth();
    historyList.clear();
    parseHistory(historyList, function (list, notehistory) { 
        parseHistoryCallback(list, notehistory);
        $(".ui-use-tags").select2('val', lastTags);
        $(".ui-use-tags").trigger('change');
        historyList.search(lastKeyword);
        $('.search').val(lastKeyword);
        checkHistoryList();
        $('#history-list').slideDown('fast');
        $('.pagination').slideDown('fast');
    });
});

$(".ui-logout").click(function () {
    clearLoginState();
    location.href = serverurl + '/logout';
});

var filtertags = [];
$(".ui-use-tags").select2({
    placeholder: $(".ui-use-tags").attr('placeholder'),
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