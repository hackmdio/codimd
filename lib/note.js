//note
//external modules
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var LZString = require('lz-string');
var marked = require('marked');
var cheerio = require('cheerio');
var shortId = require('shortid');

//others
var db = require("./db.js");
var logger = require("./logger.js");

//permission types
permissionTypes = ["freely", "editable", "locked", "private"];

// create a note model
var model = mongoose.model('note', {
    id: String,
    shortid: {
        type: String,
        unique: true,
        default: shortId.generate
    },
    permission: {
        type: String,
        enum: permissionTypes
    },
    lastchangeuser: {
        type: Schema.Types.ObjectId,
        ref: 'user'
    },
    viewcount: {
        type: Number,
        default: 0
    },
    updated: Date,
    created: Date
});

//public
var note = {
    model: model,
    findNote: findNote,
    newNote: newNote,
    findOrNewNote: findOrNewNote,
    checkNoteIdValid: checkNoteIdValid,
    checkNoteExist: checkNoteExist,
    getNoteTitle: getNoteTitle,
    generateWebTitle: generateWebTitle,
    increaseViewCount: increaseViewCount,
    updatePermission: updatePermission,
    updateLastChangeUser: updateLastChangeUser
};

function checkNoteIdValid(noteId) {
    try {
        //logger.info(noteId);
        var id = LZString.decompressFromBase64(noteId);
        if (!id) return false;
        var uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        var result = id.match(uuidRegex);
        if (result && result.length == 1)
            return true;
        else
            return false;
    } catch (err) {
        logger.error(err);
        return false;
    }
}

function checkNoteExist(noteId) {
    try {
        //logger.info(noteId);
        var id = LZString.decompressFromBase64(noteId);
        db.readFromDB(id, function (err, result) {
            if (err) return false;
            return true;
        });
    } catch (err) {
        logger.error(err);
        return false;
    }
}

//get title
function getNoteTitle(body) {
    var $ = cheerio.load(marked(body));
    var h1s = $("h1");
    var title = "";
    if (h1s.length > 0 && h1s.first().text().split('\n').length == 1)
        title = h1s.first().text();
    else
        title = "Untitled";
    return title;
}

//generate note web page title
function generateWebTitle(title) {
    title = !title || title == "Untitled" ? "HackMD - Collaborative notes" : title + " - HackMD";
    return title;
}

function findNote(id, callback) {
    model.findOne({
        $or: [
            {
                id: id
            },
            {
                shortid: id
            }
        ]
    }, function (err, note) {
        if (err) {
            logger.error('find note failed: ' + err);
            callback(err, null);
        }
        if (!err && note) {
            callback(null, note);
        } else {
            logger.error('find note failed: ' + err);
            callback(err, null);
        };
    });
}

function newNote(id, owner, callback) {
    var permission = "freely";
    if (owner && owner != "null") {
        permission = "editable";
    }
    var note = new model({
        id: id,
        permission: permission,
        updated: Date.now(),
        created: Date.now()
    });
    note.save(function (err) {
        if (err) {
            logger.error('new note failed: ' + err);
            callback(err, null);
        } else {
            logger.info("new note success: " + note.id);
            callback(null, note);
        };
    });
}

function findOrNewNote(id, owner, callback) {
    findNote(id, function (err, note) {
        if (err || !note) {
            newNote(id, owner, function (err, note) {
                if (err) {
                    logger.error('find or new note failed: ' + err);
                    callback(err, null);
                } else {
                    callback(null, note);
                }
            });
        } else {
            if (!note.permission) {
                var permission = "freely";
                if (owner && owner != "null") {
                    permission = "editable";
                }
                note.permission = permission;
                note.updated = Date.now();
                note.save(function (err) {
                    if (err) {
                        logger.error('add note permission failed: ' + err);
                        callback(err, null);
                    } else {
                        logger.info("add note permission success: " + note.id);
                        callback(null, note);
                    };
                });
            } else {
                callback(null, note);
            }
        }
    });
}

function increaseViewCount(note, callback) {
    note.viewcount++;
    note.updated = Date.now();
    note.save(function (err) {
        if (err) {
            logger.error('increase note viewcount failed: ' + err);
            callback(err, null);
        } else {
            logger.info("increase note viewcount success: " + note.id);
            callback(null, note);
        };
    });
}

function updatePermission(note, permission, callback) {
    note.permission = permission;
    note.updated = Date.now();
    note.save(function (err) {
        if (err) {
            logger.error('update note permission failed: ' + err);
            callback(err, null);
        } else {
            logger.info("update note permission success: " + note.id);
            callback(null, note);
        };
    });
}

function updateLastChangeUser(note, lastchangeuser, callback) {
    note.lastchangeuser = lastchangeuser;
    note.updated = Date.now();
    note.save(function (err) {
        if (err) {
            logger.error('update note lastchangeuser failed: ' + err);
            callback(err, null);
        } else {
            logger.info("update note lastchangeuser success: " + note.id);
            callback(null, note);
        };
    });
}

module.exports = note;