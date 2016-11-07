//history
//external modules
var async = require('async');
var moment = require('moment');
var childProcess = require('child_process');

//core
var config = require("./config.js");
var logger = require("./logger.js");
var response = require("./response.js");
var models = require("./models");

// workers
var historyUpdater = require("./workers/historyUpdater");

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
var updaterIsBusy = false;
var updater = setInterval(function () {
    if (updaterIsBusy) return;
    var deleted = [];
    var _caches = {};
    Object.keys(caches).forEach(function (key) {
        var cache = caches[key];
        if (cache.isDirty) {
            _caches[key] = cache.history;
            cache.isDirty = false;
        } else {
            if (moment().isAfter(moment(cache.updateAt).add(5, 'minutes'))) {
                deleted.push(key);
            }
        }
    });
    // delete specified caches
    for (var i = 0, l = deleted.length; i < l; i++) {
        caches[deleted[i]].history = {};
        delete caches[deleted[i]];
    }
    if (Object.keys(_caches).length <= 0) return;
    updaterIsBusy = true;
    var worker = childProcess.fork("./lib/workers/historyUpdater.js");
    if (config.debug) logger.info('history updater worker process started');
    worker.send({
        msg: 'update history',
        caches: _caches
    });
    worker.on('message', function (data) {
        if (!data || !data.msg || !data.userid) return;
        var cache = caches[data.userid];
        if (!cache) return;
        switch(data.msg) {
            case 'check':
                cache.updateAt = Date.now();
                break;
        }
    });
    worker.on('close', function (code) {
        updaterIsBusy = false;
        if (config.debug) logger.info('history updater worker process exited with code ' + code);
    });
}, 1000);

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
    if (Array.isArray(history)) history = historyUpdater.parseHistoryToObject(history);
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
            noteHistory.time = moment().valueOf();
            noteHistory.tags = noteInfo.tags;
            caches[userid].isDirty = true;
        });
    }
}

function historyGet(req, res) {
    if (req.isAuthenticated()) {
        getHistory(req.user.id, function (err, history) {
            if (err) return response.errorInternalError(res);
            if (!history) return response.errorNotFound(res);
            res.send({
                history: historyUpdater.parseHistoryToArray(history)
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