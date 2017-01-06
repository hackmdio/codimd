import store from 'store';
import S from 'string';
import {
    checkIfAuth,
    urlpath
} from './common';

window.migrateHistoryFromTempCallback = null;

migrateHistoryFromTemp();

function migrateHistoryFromTemp() {
    if (url('#tempid')) {
        $.get(`${serverurl}/temp`, {
                tempid: url('#tempid')
            })
            .done(data => {
                if (data && data.temp) {
                    getStorageHistory(olddata => {
                        if (!olddata || olddata.length == 0) {
                            saveHistoryToStorage(JSON.parse(data.temp));
                        }
                    });
                }
            })
            .always(() => {
                let hash = location.hash.split('#')[1];
                hash = hash.split('&');
                for (let i = 0; i < hash.length; i++)
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

export function saveHistory(notehistory) {
    checkIfAuth(
        () => {
            saveHistoryToServer(notehistory);
        },
        () => {
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
    $.post(`${serverurl}/history`, {
        history: JSON.stringify(notehistory)
    });
}

function saveCookieHistoryToStorage(callback) {
    store.set('notehistory', Cookies.get('notehistory'));
    callback();
}

export function saveStorageHistoryToServer(callback) {
    const data = store.get('notehistory');
    if (data) {
        $.post(`${serverurl}/history`, {
                history: data
            })
            .done(data => {
                callback(data);
            });
    }
}

function saveCookieHistoryToServer(callback) {
    $.post(`${serverurl}/history`, {
            history: Cookies.get('notehistory')
        })
        .done(data => {
            callback(data);
        });
}

export function clearDuplicatedHistory(notehistory) {
    const newnotehistory = [];
    for (let i = 0; i < notehistory.length; i++) {
        let found = false;
        for (let j = 0; j < newnotehistory.length; j++) {
            const id = notehistory[i].id.replace(/\=+$/, '');
            const newId = newnotehistory[j].id.replace(/\=+$/, '');
            if (id == newId || notehistory[i].id == newnotehistory[j].id || !notehistory[i].id || !newnotehistory[j].id) {
                const time = (typeof notehistory[i].time === 'number' ? moment(notehistory[i].time) : moment(notehistory[i].time, 'MMMM Do YYYY, h:mm:ss a'));
                const newTime = (typeof newnotehistory[i].time === 'number' ? moment(newnotehistory[i].time) : moment(newnotehistory[i].time, 'MMMM Do YYYY, h:mm:ss a'));
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
          id,
          text,
          time,
          tags,
          pinned
      });
    }
    return notehistory;
}

export function removeHistory(id, notehistory) {
    for (let i = 0; i < notehistory.length; i++) {
        if (notehistory[i].id == id) {
            notehistory.splice(i, 1);
            i -= 1;
        }
    }
    return notehistory;
}

//used for inner
export function writeHistory(title, tags) {
    checkIfAuth(
        () => {
            // no need to do this anymore, this will count from server-side
            // writeHistoryToServer(title, tags);
        },
        () => {
            writeHistoryToStorage(title, tags);
        }
    );
}

function writeHistoryToServer(title, tags) {
    $.get(`${serverurl}/history`)
        .done(data => {
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

            const newnotehistory = generateHistory(title, tags, notehistory);
            saveHistoryToServer(newnotehistory);
        })
        .fail((xhr, status, error) => {
            console.error(xhr.responseText);
        });
}

function writeHistoryToCookie(title, tags) {
    try {
        var notehistory = Cookies.getJSON('notehistory');
    } catch (err) {
        var notehistory = [];
    }
    if (!notehistory)
        notehistory = [];

    const newnotehistory = generateHistory(title, tags, notehistory);
    saveHistoryToCookie(newnotehistory);
}

function writeHistoryToStorage(title, tags) {
    if (store.enabled) {
        let data = store.get('notehistory');
        if (data) {
            if (typeof data == "string")
                data = JSON.parse(data);
            var notehistory = data;
        } else
            var notehistory = [];
        if (!notehistory)
            notehistory = [];

        const newnotehistory = generateHistory(title, tags, notehistory);
        saveHistoryToStorage(newnotehistory);
    } else {
        writeHistoryToCookie(title, tags);
    }
}

if (!Array.isArray) {
    Array.isArray = arg => Object.prototype.toString.call(arg) === '[object Array]';
}

function renderHistory(title, tags) {
    //console.debug(tags);
    const id = urlpath ? location.pathname.slice(urlpath.length + 1, location.pathname.length).split('/')[1] : location.pathname.split('/')[1];
    return {
        id,
        text: title,
        time: moment().valueOf(),
        tags
    };
}

function generateHistory(title, tags, notehistory) {
    const info = renderHistory(title, tags);
    //keep any pinned data
    let pinned = false;
    for (let i = 0; i < notehistory.length; i++) {
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
export function getHistory(callback) {
    checkIfAuth(
        () => {
            getServerHistory(callback);
        },
        () => {
            getStorageHistory(callback);
        }
    );
}

function getServerHistory(callback) {
    $.get(`${serverurl}/history`)
        .done(data => {
            if (data.history) {
                callback(data.history);
            }
        })
        .fail((xhr, status, error) => {
            console.error(xhr.responseText);
        });
}

function getCookieHistory(callback) {
    callback(Cookies.getJSON('notehistory'));
}

export function getStorageHistory(callback) {
    if (store.enabled) {
        let data = store.get('notehistory');
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

export function parseHistory(list, callback) {
    checkIfAuth(
        () => {
            parseServerToHistory(list, callback);
        },
        () => {
            parseStorageToHistory(list, callback);
        }
    );
}

export function parseServerToHistory(list, callback) {
    $.get(`${serverurl}/history`)
        .done(data => {
            if (data.history) {
                parseToHistory(list, data.history, callback);
            }
        })
        .fail((xhr, status, error) => {
            console.error(xhr.responseText);
        });
}

function parseCookieToHistory(list, callback) {
    const notehistory = Cookies.getJSON('notehistory');
    parseToHistory(list, notehistory, callback);
}

export function parseStorageToHistory(list, callback) {
    if (store.enabled) {
        let data = store.get('notehistory');
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
        for (let i = 0; i < notehistory.length; i++) {
            //parse time to timestamp and fromNow
            const timestamp = (typeof notehistory[i].time === 'number' ? moment(notehistory[i].time) : moment(notehistory[i].time, 'MMMM Do YYYY, h:mm:ss a'));
            notehistory[i].timestamp = timestamp.valueOf();
            notehistory[i].fromNow = timestamp.fromNow();
            notehistory[i].time = timestamp.format('llll');
            // prevent XSS
            notehistory[i].text = S(notehistory[i].text).escapeHTML().s;
            notehistory[i].tags = (notehistory[i].tags && notehistory[i].tags.length > 0) ? S(notehistory[i].tags).escapeHTML().s.split(',') : [];
            // add to list
            if (notehistory[i].id && list.get('id', notehistory[i].id).length == 0)
                list.add(notehistory[i]);
        }
    }
    callback(list, notehistory);
}

export function postHistoryToServer(noteId, data, callback) {
    $.post(`${serverurl}/history/${noteId}`, data)
    .done(result => callback(null, result))
    .fail((xhr, status, error) => {
        console.error(xhr.responseText);
        return callback(error, null);
    });
}

export function deleteServerHistory(noteId, callback) {
    $.ajax({
        url: `${serverurl}/history${noteId ? '/' + noteId : ""}`,
        type: 'DELETE'
    })
    .done(result => callback(null, result))
    .fail((xhr, status, error) => {
        console.error(xhr.responseText);
        return callback(error, null);
    });
}
