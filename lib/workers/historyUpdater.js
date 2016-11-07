// external modules
var async = require('async');

// core
var config = require("../config.js");
var logger = require("../logger.js");
var models = require("../models");

process.on('message', function (data) {
    if (!data || !data.msg || data.msg !== 'update history' || !data.caches) return process.exit();
    var caches = data.caches;
    async.each(Object.keys(caches), function (key, callback) {
        var cache = caches[key];
        if (config.debug) logger.info("history updater found dirty history: " + key);
        var history = parseHistoryToArray(cache);
        finishUpdateHistory(key, history, function (err, count) {
            if (err) return callback(err, null);
            if (!count) return callback(null, null);
            process.send({
                msg: 'check',
                userid: key
            });
            return callback(null, null);
        });
    }, function (err) {
        if (err) logger.error('history updater error', err);
        process.exit();
    });
});

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

module.exports = {
    parseHistoryToArray: parseHistoryToArray,
    parseHistoryToObject: parseHistoryToObject
};