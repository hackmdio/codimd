var migrateHistoryFromTempCallback = null;

migrateHistoryFromTemp();

function migrateHistoryFromTemp() {
    if (url('#tempid')) {
        $.get('/temp', {
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
        saveHistoryToStorage(notehistory);
}

function saveHistoryToCookie(notehistory) {
    Cookies.set('notehistory', notehistory, {
        expires: 365
    });
}

function saveHistoryToServer(notehistory) {
    $.post('/history', {
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
        $.post('/history', {
                history: data
            })
            .done(function (data) {
                callback(data);
            });
    }
}

function saveCookieHistoryToServer(callback) {
    $.post('/history', {
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
            if (notehistory[i].id == newnotehistory[j].id) {
                found = true;
                break;
            }
        }
        if (!found)
            newnotehistory.push(notehistory[i]);
    }
    return newnotehistory;
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
            writeHistoryToStorage(view);
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
            if(!notehistory)
                notehistory = [];
        
            var newnotehistory = generateHistory(view, notehistory);
            saveHistoryToServer(newnotehistory);
        })
        .fail(function () {
            writeHistoryToStorage(view);
        });
}

function writeHistoryToCookie(view) {
    try {
        var notehistory = Cookies.getJSON('notehistory');
    } catch (err) {
        var notehistory = [];
    }
    if(!notehistory)
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
        if(!notehistory)
            notehistory = [];
        
        var newnotehistory = generateHistory(view, notehistory);
        saveHistoryToStorage(newnotehistory);
    } else {
        writeHistoryToCookie(view);
    }
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
            getStorageHistory(callback);
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
            getStorageHistory(callback);
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
    $.get('/history')
        .done(function (data) {
            if (data.history) {
                parseToHistory(list, data.history, callback);
            }
        })
        .fail(function () {
            parseStorageToHistory(list, callback);
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
            notehistory[i].timestamp = moment(notehistory[i].time, 'MMMM Do YYYY, h:mm:ss a').unix();
            notehistory[i].fromNow = moment(notehistory[i].time, 'MMMM Do YYYY, h:mm:ss a').fromNow();
            if (list.get('id', notehistory[i].id).length == 0)
                list.add(notehistory[i]);
        }
    }
    callback(list, notehistory);
}