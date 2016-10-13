var store = require('store');

var common = require('./common');
var checkIfAuth = common.checkIfAuth;
var urlpath = common.urlpath;
var getLoginState = common.getLoginState;

var extra = require('./extra');
var renderFilename = extra.renderFilename;
var md = extra.md;

window.migrateHistoryFromTempCallback = null;

migrateHistoryFromTemp();

function migrateHistoryFromTemp() {
    if (url('#tempid')) {
        $.get(serverurl + '/temp', {
                tempid: url('#tempid')
            })
            .done(function (data) {
                if (data && data.temp) {
                    getStorageHistory(function (olddata) {
                        if (!olddata || olddata.length == 0) {
                            saveHistoryToStorage(JSON.parse(data.temp));
                        }
                    });
                }
            })
            .always(function () {
                var hash = location.hash.split('#')[1];
                hash = hash.split('&');
                for (var i = 0; i < hash.length; i++)
                    if (hash[i].indexOf('tempid') == 0) {
                        hash.splice(i, 1);
                        i--;
                    }
                hash = hash.join('&');
                location.hash = hash;
                if (migrateHistoryFromTempCallback)
                    migrateHistoryFromTempCallback();
            });
    }
}

function saveHistory(notehistory) {
    checkIfAuth(
        function () {
            saveHistoryToServer(notehistory);
        },
        function () {
            saveHistoryToStorage(notehistory);
        }
    );
}

function saveHistoryToStorage(notehistory) {
    if (store.enabled)
        store.set('notehistory', JSON.stringify(notehistory));
    else
        saveHistoryToCookie(notehistory);
}

function saveHistoryToCookie(notehistory) {
    Cookies.set('notehistory', notehistory, {
        expires: 365
    });
}

function saveHistoryToServer(notehistory) {
    $.post(serverurl + '/history', {
        history: JSON.stringify(notehistory)
    });
}

function saveCookieHistoryToStorage(callback) {
    store.set('notehistory', Cookies.get('notehistory'));
    callback();
}

function saveStorageHistoryToServer(callback) {
    var data = store.get('notehistory');
    if (data) {
        $.post(serverurl + '/history', {
                history: data
            })
            .done(function (data) {
                callback(data);
            });
    }
}

function saveCookieHistoryToServer(callback) {
    $.post(serverurl + '/history', {
            history: Cookies.get('notehistory')
        })
        .done(function (data) {
            callback(data);
        });
}

function clearDuplicatedHistory(notehistory) {
    var newnotehistory = [];
    for (var i = 0; i < notehistory.length; i++) {
        var found = false;
        for (var j = 0; j < newnotehistory.length; j++) {
            var id = notehistory[i].id.replace(/\=+$/, '');
            var newId = newnotehistory[j].id.replace(/\=+$/, '');
            if (id == newId || notehistory[i].id == newnotehistory[j].id || !notehistory[i].id || !newnotehistory[j].id) {
                var time = (typeof notehistory[i].time === 'number' ? moment(notehistory[i].time) : moment(notehistory[i].time, 'MMMM Do YYYY, h:mm:ss a'));
                var newTime = (typeof newnotehistory[i].time === 'number' ? moment(newnotehistory[i].time) : moment(newnotehistory[i].time, 'MMMM Do YYYY, h:mm:ss a'));
                if(time >= newTime) {
                    newnotehistory[j] = notehistory[i];
                }
                found = true;
                break;
            }
        }
        if (!found)
            newnotehistory.push(notehistory[i]);
    }
    return newnotehistory;
}

function addHistory(id, text, time, tags, pinned, notehistory) {
    // only add when note id exists
    if (id) {
      notehistory.push({
          id: id,
          text: text,
          time: time,
          tags: tags,
          pinned: pinned
      });
    }
    return notehistory;
}

function removeHistory(id, notehistory) {
    for (var i = 0; i < notehistory.length; i++) {
        if (notehistory[i].id == id) {
            notehistory.splice(i, 1);
			i--;
		}
    }
    return notehistory;
}

//used for inner
function writeHistory(view) {
    checkIfAuth(
        function () {
            // no need to do this anymore, this will count from server-side
            // writeHistoryToServer(view);
        },
        function () {
            writeHistoryToStorage(view);
        }
    );
}

function writeHistoryToServer(view) {
    $.get(serverurl + '/history')
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
            if (!notehistory)
                notehistory = [];

            var newnotehistory = generateHistory(view, notehistory);
            saveHistoryToServer(newnotehistory);
        })
        .fail(function (xhr, status, error) {
            console.error(xhr.responseText);
        });
}

function writeHistoryToCookie(view) {
    try {
        var notehistory = Cookies.getJSON('notehistory');
    } catch (err) {
        var notehistory = [];
    }
    if (!notehistory)
        notehistory = [];

    var newnotehistory = generateHistory(view, notehistory);
    saveHistoryToCookie(newnotehistory);
}

function writeHistoryToStorage(view) {
    if (store.enabled) {
        var data = store.get('notehistory');
        if (data) {
            if (typeof data == "string")
                data = JSON.parse(data);
            var notehistory = data;
        } else
            var notehistory = [];
        if (!notehistory)
            notehistory = [];

        var newnotehistory = generateHistory(view, notehistory);
        saveHistoryToStorage(newnotehistory);
    } else {
        writeHistoryToCookie(view);
    }
}

if (!Array.isArray) {
    Array.isArray = function(arg) {
        return Object.prototype.toString.call(arg) === '[object Array]';
    };
}

function renderHistory(view) {
    var title = renderFilename(view);

    var tags = [];
    var rawtags = [];
    if (md && md.meta && md.meta.tags && (typeof md.meta.tags == "string" || typeof md.meta.tags == "number")) {
        var metaTags = ('' + md.meta.tags).split(',');
        for (var i = 0; i < metaTags.length; i++) {
            var text = metaTags[i].trim();
            if (text) rawtags.push(text);
        }
    } else {
        view.find('h6').each(function (key, value) {
            if (/^tags/gmi.test($(value).text())) {
                var codes = $(value).find("code");
                for (var i = 0; i < codes.length; i++) {
                    var text = codes[i].innerHTML.trim();
                    if (text) rawtags.push(text);
                }
            }
        });
    }
    for (var i = 0; i < rawtags.length; i++) {
        var found = false;
        for (var j = 0; j < tags.length; j++) {
            if (tags[j] == rawtags[i]) {
                found = true;
                break;
            }
        }
        if (!found)
            tags.push(rawtags[i]);
    }
    //console.debug(tags);
    var id = urlpath ? location.pathname.slice(urlpath.length + 1, location.pathname.length).split('/')[1] : location.pathname.split('/')[1];
    return {
        id: id,
        text: title,
        time: moment().valueOf(),
        tags: tags
    };
}

function generateHistory(view, notehistory) {
    var info = renderHistory(view);
	//keep any pinned data
	var pinned = false;
	for (var i = 0; i < notehistory.length; i++) {
		if (notehistory[i].id == info.id && notehistory[i].pinned) {
			pinned = true;
			break;
		}
	}
    notehistory = removeHistory(info.id, notehistory);
    notehistory = addHistory(info.id, info.text, info.time, info.tags, pinned, notehistory);
    notehistory = clearDuplicatedHistory(notehistory);
    return notehistory;
}

//used for outer
function getHistory(callback) {
    checkIfAuth(
        function () {
            getServerHistory(callback);
        },
        function () {
            getStorageHistory(callback);
        }
    );
}

function getServerHistory(callback) {
    $.get(serverurl + '/history')
        .done(function (data) {
            if (data.history) {
                callback(data.history);
            }
        })
        .fail(function (xhr, status, error) {
            console.error(xhr.responseText);
        });
}

function getCookieHistory(callback) {
    callback(Cookies.getJSON('notehistory'));
}

function getStorageHistory(callback) {
    if (store.enabled) {
        var data = store.get('notehistory');
        if (data) {
            if (typeof data == "string")
                data = JSON.parse(data);
            callback(data);
        } else
            getCookieHistory(callback);
    } else {
        getCookieHistory(callback);
    }
}

function parseHistory(list, callback) {
    checkIfAuth(
        function () {
            parseServerToHistory(list, callback);
        },
        function () {
            parseStorageToHistory(list, callback);
        }
    );
}

function parseServerToHistory(list, callback) {
    $.get(serverurl + '/history')
        .done(function (data) {
            if (data.history) {
                parseToHistory(list, data.history, callback);
            }
        })
        .fail(function (xhr, status, error) {
            console.error(xhr.responseText);
        });
}

function parseCookieToHistory(list, callback) {
    var notehistory = Cookies.getJSON('notehistory');
    parseToHistory(list, notehistory, callback);
}

function parseStorageToHistory(list, callback) {
    if (store.enabled) {
        var data = store.get('notehistory');
        if (data) {
            if (typeof data == "string")
                data = JSON.parse(data);
            parseToHistory(list, data, callback);
        } else
            parseCookieToHistory(list, callback);
    } else {
        parseCookieToHistory(list, callback);
    }
}

function parseToHistory(list, notehistory, callback) {
    if (!callback) return;
    else if (!list || !notehistory) callback(list, notehistory);
    else if (notehistory && notehistory.length > 0) {
        for (var i = 0; i < notehistory.length; i++) {
            //parse time to timestamp and fromNow
            var timestamp = (typeof notehistory[i].time === 'number' ? moment(notehistory[i].time) : moment(notehistory[i].time, 'MMMM Do YYYY, h:mm:ss a'));
            notehistory[i].timestamp = timestamp.valueOf();
            notehistory[i].fromNow = timestamp.fromNow();
            notehistory[i].time = timestamp.format('llll');
            if (notehistory[i].id && list.get('id', notehistory[i].id).length == 0)
                list.add(notehistory[i]);
        }
    }
    callback(list, notehistory);
}

function postHistoryToServer(noteId, data, callback) {
    $.post(serverurl + '/history/' + noteId, data)
    .done(function (result) {
        return callback(null, result);
    })
    .fail(function (xhr, status, error) {
        console.error(xhr.responseText);
        return callback(error, null);
    });
}

function deleteServerHistory(noteId, callback) {
    $.ajax({
        url: serverurl + '/history' + (noteId ? '/' + noteId : ""),
        type: 'DELETE'
    })
    .done(function (result) {
        return callback(null, result);
    })
    .fail(function (xhr, status, error) {
        console.error(xhr.responseText);
        return callback(error, null);
    });
}

module.exports = {
    writeHistory: writeHistory,
    parseHistory: parseHistory,
    getStorageHistory: getStorageHistory,
    getHistory: getHistory,
    saveHistory: saveHistory,
    removeHistory: removeHistory,
    parseStorageToHistory: parseStorageToHistory,
    postHistoryToServer: postHistoryToServer,
    deleteServerHistory: deleteServerHistory,
    parseServerToHistory: parseServerToHistory,
    saveStorageHistoryToServer: saveStorageHistoryToServer,
    clearDuplicatedHistory: clearDuplicatedHistory
}
