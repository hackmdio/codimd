//history
//external modules
var async = require('async');
var moment = require('moment');

//core
var config = require("./config.js");
var logger = require("./logger.js");
var response = require("./response.js");
var models = require("./models");

//public
var History = {
    historyGet: historyGet,
    historyPost: historyPost,
    historyDelete: historyDelete,
    isReady: isReady,
    updateHistory: updateHistory
};

var caches = {};
//update when the history is dirty
var updater = setInterval(function () {
    var deleted = [];
    async.each(Object.keys(caches), function (key, callback) {
        var cache = caches[key];
        if (cache.isDirty) {
            if (config.debug) logger.info("history updater found dirty history: " + key);
            var history = parseHistoryToArray(cache.history);
            finishUpdateHistory(key, history, function (err, count) {
                if (err) return callback(err, null);
                if (!count) return callback(null, null);
                cache.isDirty = false;
                cache.updateAt = Date.now();
                return callback(null, null);
            });
        } else {
            if (moment().isAfter(moment(cache.updateAt).add(5, 'minutes'))) {
                deleted.push(key);
            }
            return callback(null, null);
        }
    }, function (err) {
        if (err) return logger.error('history updater error', err);
    });
    // delete specified caches
    for (var i = 0, l = deleted.length; i < l; i++) {
        caches[deleted[i]].history = {};
        delete caches[deleted[i]];
    }
}, 1000);

function finishUpdateHistory(userid, history, callback) {
    models.User.update({
        history: JSON.stringify(history)
    }, {
        where: {
            id: userid
        }
    }).then(function (count) {
        return callback(null, count);
    }).catch(function (err) {
        return callback(err, null);
    });
}

function isReady() {
    var dirtyCount = 0;
    async.each(Object.keys(caches), function (key, callback) {
        if (caches[key].isDirty) dirtyCount++;
        return callback(null, null);
    }, function (err) {
        if (err) return logger.error('history ready check error', err);
    });
    return dirtyCount > 0 ? false : true;
}

function getHistory(userid, callback) {
    if (caches[userid]) {
        return callback(null, caches[userid].history);
    } else {
        models.User.findOne({
            where: {
                id: userid
            }
        }).then(function (user) {
            if (!user)
                return callback(null, null);
            var history = [];
            if (user.history)
                history = JSON.parse(user.history);
            if (config.debug)
                logger.info('read history success: ' + user.id);
            setHistory(userid, history);
            return callback(null, history);
        }).catch(function (err) {
            logger.error('read history failed: ' + err);
            return callback(err, null);
        });   
    }
}

function setHistory(userid, history) {
    if (Array.isArray(history)) history = parseHistoryToObject(history);
    if (!caches[userid]) {
        caches[userid] = {
            history: {},
            isDirty: false,
            updateAt: Date.now()
        };
    }
    caches[userid].history = history;
}

function updateHistory(userid, noteId, document) {
    if (userid && noteId && typeof document !== 'undefined') {
        getHistory(userid, function (err, history) {
            if (err || !history) return;
            if (!caches[userid].history[noteId]) {
                caches[userid].history[noteId] = {};
            }
            var noteHistory = caches[userid].history[noteId];
            var noteInfo = models.Note.parseNoteInfo(document);
            noteHistory.id = noteId;
            noteHistory.text = noteInfo.title;
            noteHistory.time = moment().format('MMMM Do YYYY, h:mm:ss a');
            noteHistory.tags = noteInfo.tags;
            caches[userid].isDirty = true;
        });
    }
}

function parseHistoryToArray(history) {
    var _history = [];
    Object.keys(history).forEach(function (key) {
        var item = history[key];
        _history.push(item);
    });
    return _history;
}

function parseHistoryToObject(history) {
    var _history = {};
    for (var i = 0, l = history.length; i < l; i++) {
        var item = history[i];
        _history[item.id] = item;
    }
    return _history;
}

function historyGet(req, res) {
    if (req.isAuthenticated()) {
        getHistory(req.user.id, function (err, history) {
            if (err) return response.errorInternalError(res);
            if (!history) return response.errorNotFound(res);
            res.send({
                history: parseHistoryToArray(history)
            });
        });
    } else {
        return response.errorForbidden(res);
    }
}

function historyPost(req, res) {
    if (req.isAuthenticated()) {
        var noteId = req.params.noteId;
        if (!noteId) {
            if (typeof req.body['history'] === 'undefined') return response.errorBadRequest(res);
            if (config.debug)
                logger.info('SERVER received history from [' + req.user.id + ']: ' + req.body.history);
            try {
                var history = JSON.parse(req.body.history);
            } catch (err) {
                return response.errorBadRequest(res);
            }
            if (Array.isArray(history)) {
                setHistory(req.user.id, history);
                caches[req.user.id].isDirty = true;
                res.end();
            } else {
                return response.errorBadRequest(res);
            }
        } else {
            if (typeof req.body['pinned'] === 'undefined') return response.errorBadRequest(res);
            getHistory(req.user.id, function (err, history) {
                if (err) return response.errorInternalError(res);
                if (!history) return response.errorNotFound(res);
                if (!caches[req.user.id].history[noteId]) return response.errorNotFound(res);
                if (req.body.pinned === 'true' || req.body.pinned === 'false') {
                    caches[req.user.id].history[noteId].pinned = (req.body.pinned === 'true');
                    caches[req.user.id].isDirty = true;
                    res.end();
                } else {
                    return response.errorBadRequest(res);
                }
            });
        }
    } else {
        return response.errorForbidden(res);
    }
}

function historyDelete(req, res) {
    if (req.isAuthenticated()) {
        var noteId = req.params.noteId;
        if (!noteId) {
            setHistory(req.user.id, []);
            caches[req.user.id].isDirty = true;
            res.end();
        } else {
            getHistory(req.user.id, function (err, history) {
                if (err) return response.errorInternalError(res);
                if (!history) return response.errorNotFound(res);
                delete caches[req.user.id].history[noteId];
                caches[req.user.id].isDirty = true;
                res.end();
            });
        }
    } else {
        return response.errorForbidden(res);
    }
}

module.exports = History;