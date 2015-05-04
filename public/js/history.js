//common
function checkIfAuth(yesCallback, noCallback) {
    $.get('/me')
        .done(function (data) {
            if (data && data.status == 'ok') {
                yesCallback(data);
            } else {
                noCallback();
            }
        })
        .fail(function () {
            noCallback();
        });
}

function saveHistory(notehistory) {
    checkIfAuth(
        function () {
            saveHistoryToServer(notehistory);
        },
        function () {
            saveHistoryToCookie(notehistory);
        }
    );
}

function saveHistoryToCookie(notehistory) {
    $.cookie('notehistory', JSON.stringify(notehistory), {
        expires: 365
    });
}

function saveHistoryToServer(notehistory) {
    $.post('/history', {
        history: JSON.stringify(notehistory)
    });
}

function saveCookieHistoryToServer(callback) {
    $.post('/history', {
            history: $.cookie('notehistory')
        })
        .done(function (data) {
            callback();
        });
}

function clearDuplicatedHistory(notehistory) {
    var newnotehistory = [];
    for (var i = 0; i < notehistory.length; i++) {
        var found = false;
        for (var j = 0; j < newnotehistory.length; j++) {
            if (notehistory[i].id == newnotehistory[j].id) {
                found = true;
                break;
            }
        }
        if (!found)
            newnotehistory.push(notehistory[i]);
    }
    return notehistory;
}

function addHistory(id, text, time, tags, notehistory) {
    notehistory.push({
        id: id,
        text: text,
        time: time,
        tags: tags
    });
    return notehistory;
}

function removeHistory(id, notehistory) {
    for (var i = 0; i < notehistory.length; i++) {
        if (notehistory[i].id == id)
            notehistory.splice(i, 1);
    }
    return notehistory;
}

//used for inner
function writeHistory(view) {
    checkIfAuth(
        function () {
            writeHistoryToServer(view);
        },
        function () {
            writeHistoryToCookie(view);
        }
    );
}

function writeHistoryToServer(view) {
    $.get('/history')
        .done(function (data) {
            try {
                if (data.history) {
                    var notehistory = data.history;
                } else {
                    var notehistory = [];
                }
            } catch (err) {
                var notehistory = [];
            }
            var newnotehistory = generateHistory(view, notehistory);
            saveHistoryToServer(newnotehistory);
        })
        .fail(function () {
            writeHistoryToCookie(view);
        });
}

function writeHistoryToCookie(view) {
    try {
        var notehistory = JSON.parse($.cookie('notehistory'));
    } catch (err) {
        var notehistory = [];
    }

    var newnotehistory = generateHistory(view, notehistory);
    saveHistoryToCookie(newnotehistory);
}

function renderHistory(view) {
    var title = renderFilename(view);

    var tags = [];
    var rawtags = [];
    view.find('h6').each(function (key, value) {
        if (/^tags/gmi.test($(value).text())) {
            var codes = $(value).find("code");
            for (var i = 0; i < codes.length; i++)
                rawtags.push(codes[i]);
        }
    });
    for (var i = 0; i < rawtags.length; i++) {
        var found = false;
        for (var j = 0; j < tags.length; j++) {
            if (tags[j] == rawtags[i].innerHTML) {
                found = true;
                break;
            }
        }
        if (!found)
            tags.push(rawtags[i].innerHTML);
    }
    //console.debug(tags);
    return {
        id: location.pathname.split('/')[1],
        text: title,
        time: moment().format('MMMM Do YYYY, h:mm:ss a'),
        tags: tags
    };
}

function generateHistory(view, notehistory) {
    var info = renderHistory(view);
    notehistory = clearDuplicatedHistory(notehistory);
    notehistory = removeHistory(info.id, notehistory);
    notehistory = addHistory(info.id, info.text, info.time, info.tags, notehistory);
    return notehistory;
}

//used for outer
function getHistory(callback) {
    checkIfAuth(
        function () {
            getServerHistory(callback);
        },
        function () {
            getCookieHistory(callback);
        }
    );
}

function getServerHistory(callback) {
    $.get('/history')
        .done(function (data) {
            if (data.history) {
                callback(data.history);
            }
        })
        .fail(function () {
            getCookieHistory(callback);
        });
}

function getCookieHistory(callback) {
    callback(JSON.parse($.cookie('notehistory')));
}

function parseHistory(callback) {
    checkIfAuth(
        function () {
            parseServerToHistory(callback);
        },
        function () {
            parseCookieToHistory(callback);
        }
    );
}

function parseServerToHistory(callback) {
    $.get('/history')
        .done(function (data) {
            if (data.history) {
                //console.log(data.history);
                parseToHistory(data.history, callback);
            }
        })
        .fail(function () {
            parseCookieToHistory(callback);
        });
}

function parseCookieToHistory(callback) {
    var notehistory = JSON.parse($.cookie('notehistory'));
    parseToHistory(notehistory, callback);
}

function parseToHistory(notehistory, callback) {
    if (notehistory && notehistory.length > 0) {
        //console.log(notehistory);
        for (var i = 0; i < notehistory.length; i++) {
            notehistory[i].timestamp = moment(notehistory[i].time, 'MMMM Do YYYY, h:mm:ss a').unix();
            notehistory[i].fromNow = moment(notehistory[i].time, 'MMMM Do YYYY, h:mm:ss a').fromNow();
        }
        $(notehistory).each(function (key, value) {
            var close = "<div class='ui-history-close fa fa-close fa-fw'></div>";
            var text = "<h4 class='text'>" + value.text + "</h2>";
            var timestamp = "<i class='timestamp' style='display:none;'>" + value.timestamp + "</i>";
            var fromNow = "<i class='fromNow'><i class='fa fa-clock-o'></i> " + value.fromNow + "</i>";
            var time = "<i class='time'>" + value.time + "</i>";
            var tags = "";
            if (value.tags) {
                var labels = [];
                for (var j = 0; j < value.tags.length; j++)
                    labels.push("<span class='label label-default'>" + value.tags[j] + "</span>");
                tags = "<p class='tags'>" + labels.join(" ") + "</p>";
            }
            var li = "<li class='col-xs-12 col-sm-6 col-md-6 col-lg-6'><a href='" + "./" + value.id + "'><div class='item'>" + close + text + '<p>' + fromNow + '<br>' + timestamp + time + '</p>' + tags + "</div></a></li>"
                //console.debug(li);
            $("#history-list").append(li);
        });
    }

    var options = {
        valueNames: ['text', 'timestamp', 'fromNow', 'time', 'tags']
    };
    var historyList = new List('history', options);
    historyList.sort('timestamp', {
        order: "desc"
    });
    callback();
}