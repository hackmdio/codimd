// external modules
var async = require('async');
var moment = require('moment');
var LZString = require('lz-string');

// core
var config = require("../config.js");
var logger = require("../logger.js");
var models = require("../models");

process.on('message', function (data) {
    if (!data || !data.msg || data.msg !== 'update note' || !data.notes) return process.exit();
    var notes = data.notes;
    async.each(Object.keys(notes), function (key, callback) {
        var note = notes[key];
        if (config.debug) logger.info("note updater found dirty note: " + key);
        updateNote(note, function(err, _note) {
            if (!_note) {
                process.send({
                    msg: 'note not found',
                    note: note
                });
                logger.error('note not found: ', note.id);
            }
            if (err || !_note) {
                process.send({
                    msg: 'error',
                    note: note
                });
                return callback(err, null);
            }
            note.updatetime = moment(_note.lastchangeAt).valueOf();
            process.send({
                msg: 'check',
                note: note
            });
            return callback(null, null);
        });
    }, function (err) {
        if (err) logger.error('note updater error', err);
        process.exit();
    });
});

function updateNote(note, callback) {
    models.Note.findOne({
        where: {
            id: note.id
        }
    }).then(function (_note) {
        if (!_note) return callback(null, null);
        if (note.lastchangeuser) {
            if (_note.lastchangeuserId != note.lastchangeuser) {
                models.User.findOne({
                    where: {
                        id: note.lastchangeuser
                    }
                }).then(function (user) {
                    if (!user) return callback(null, null);
                    note.lastchangeuserprofile = models.User.parseProfile(user.profile);
                    return finishUpdateNote(note, _note, callback);
                }).catch(function (err) {
                    logger.error(err);
                    return callback(err, null);
                });
            } else {
                return finishUpdateNote(note, _note, callback);
            }
        } else {
            note.lastchangeuserprofile = null;
            return finishUpdateNote(note, _note, callback);
        }
    }).catch(function (err) {
        logger.error(err);
        return callback(err, null);
    });
}

function finishUpdateNote(note, _note, callback) {
    var body = note.document;
    var title = note.title = models.Note.parseNoteTitle(body);
    title = LZString.compressToBase64(title);
    body = LZString.compressToBase64(body);
    var values = {
        title: title,
        content: body,
        authorship: LZString.compressToBase64(JSON.stringify(note.authorship)),
        lastchangeuserId: note.lastchangeuser,
        lastchangeAt: Date.now()
    };
    _note.update(values).then(function (_note) {
        return callback(null, _note);
    }).catch(function (err) {
        logger.error(err);
        return callback(err, null);
    });
}

module.exports = {
    updateNote: updateNote
};