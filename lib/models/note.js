"use strict";

// external modules
var fs = require('fs');
var path = require('path');
var LZString = require('lz-string');
var marked = require('marked');
var cheerio = require('cheerio');
var shortId = require('shortid');
var Sequelize = require("sequelize");
var async = require('async');
var moment = require('moment');

// core
var config = require("../config.js");
var logger = require("../logger.js");

// permission types
var permissionTypes = ["freely", "editable", "locked", "private"];

module.exports = function (sequelize, DataTypes) {
    var Note = sequelize.define("Note", {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: Sequelize.UUIDV4
        },
        shortid: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false,
            defaultValue: shortId.generate
        },
        alias: {
            type: DataTypes.STRING,
            unique: true
        },
        permission: {
            type: DataTypes.ENUM,
            values: permissionTypes
        },
        viewcount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        title: {
            type: DataTypes.TEXT
        },
        content: {
            type: DataTypes.TEXT
        },
        lastchangeAt: {
            type: DataTypes.DATE
        },
        savedAt: {
            type: DataTypes.DATE
        }
    }, {
        classMethods: {
            associate: function (models) {
                Note.belongsTo(models.User, {
                    foreignKey: "ownerId",
                    as: "owner",
                    constraints: false
                });
                Note.belongsTo(models.User, {
                    foreignKey: "lastchangeuserId",
                    as: "lastchangeuser",
                    constraints: false
                });
                Note.hasMany(models.Revision, {
                    foreignKey: "noteId",
                    constraints: false
                });
            },
            checkFileExist: function (filePath) {
                try {
                    return fs.statSync(filePath).isFile();
                } catch (err) {
                    return false;
                }
            },
            checkNoteIdValid: function (id) {
                var uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
                var result = id.match(uuidRegex);
                if (result && result.length == 1)
                    return true;
                else
                    return false;
            },
            parseNoteId: function (noteId, callback) {
                async.series({
                    parseNoteIdByAlias: function (_callback) {
                        // try to parse note id by alias (e.g. doc)
                        Note.findOne({
                            where: {
                                alias: noteId
                            }
                        }).then(function (note) {
                            if (note) {
                                var filePath = path.join(config.docspath, noteId + '.md');
                                if (Note.checkFileExist(filePath)) {
                                    // if doc in filesystem have newer modified time than last change time
                                    // then will update the doc in db
                                    var fsModifiedTime = moment(fs.statSync(filePath).mtime);
                                    var dbModifiedTime = moment(note.lastchangeAt || note.createdAt);
                                    if (fsModifiedTime.isAfter(dbModifiedTime)) {
                                        var body = fs.readFileSync(filePath, 'utf8');
                                        note.update({
                                            title: LZString.compressToBase64(Note.parseNoteTitle(body)),
                                            content: LZString.compressToBase64(body),
                                            lastchangeAt: fsModifiedTime
                                        }).then(function (note) {
                                            sequelize.models.Revision.saveNoteRevision(note, function (err, revision) {
                                                if (err) return _callback(err, null);
                                                return callback(null, note.id);
                                            });
                                        }).catch(function (err) {
                                            return _callback(err, null);
                                        });
                                    } else {
                                        return callback(null, note.id);
                                    }
                                } else {
                                    return callback(null, note.id);
                                }
                            } else {
                                var filePath = path.join(config.docspath, noteId + '.md');
                                if (Note.checkFileExist(filePath)) {
                                    Note.create({
                                        alias: noteId,
                                        owner: null,
                                        permission: 'locked'
                                    }).then(function (note) {
                                        return callback(null, note.id);
                                    }).catch(function (err) {
                                        return _callback(err, null);
                                    });
                                } else {
                                    return _callback(null, null);
                                }
                            }
                        }).catch(function (err) {
                            return _callback(err, null);
                        });
                    },
                    parseNoteIdByLZString: function (_callback) {
                        // try to parse note id by LZString Base64
                        try {
                            var id = LZString.decompressFromBase64(noteId);
                            if (id && Note.checkNoteIdValid(id))
                                return callback(null, id);
                            else
                                return _callback(null, null);
                        } catch (err) {
                            return _callback(err, null);
                        }
                    },
                    parseNoteIdByShortId: function (_callback) {
                        // try to parse note id by shortId
                        try {
                            if (shortId.isValid(noteId)) {
                                Note.findOne({
                                    where: {
                                        shortid: noteId
                                    }
                                }).then(function (note) {
                                    if (!note) return _callback(null, null);
                                    return callback(null, note.id);
                                }).catch(function (err) {
                                    return _callback(err, null);
                                });
                            } else {
                                return _callback(null, null);
                            }
                        } catch (err) {
                            return _callback(err, null);
                        }
                    }
                }, function (err, result) {
                    if (err) {
                        logger.error(err);
                        return callback(err, null);
                    }
                    return callback(null, null);
                });
            },
            parseNoteTitle: function (body) {
                var $ = cheerio.load(marked(body));
                var h1s = $("h1");
                var title = "";
                if (h1s.length > 0 && h1s.first().text().split('\n').length == 1)
                    title = h1s.first().text();
                else
                    title = "Untitled";
                return title;
            },
            decodeTitle: function (title) {
                var decodedTitle = LZString.decompressFromBase64(title);
                if (decodedTitle) title = decodedTitle;
                else title = 'Untitled';
                return title;
            },
            generateWebTitle: function (title) {
                title = !title || title == "Untitled" ? "HackMD - Collaborative markdown notes" : title + " - HackMD";
                return title;
            }
        },
        hooks: {
            beforeCreate: function (note, options, callback) {
                // if no content specified then use default note
                if (!note.content) {
                    var body = null;
                    var filePath = null;
                    if (!note.alias) {
                        filePath = config.defaultnotepath;
                    } else {
                        filePath = path.join(config.docspath, note.alias + '.md');
                    }
                    if (Note.checkFileExist(filePath)) {
                        var fsCreatedTime = moment(fs.statSync(filePath).ctime);
                        body = fs.readFileSync(filePath, 'utf8');
                        note.title = LZString.compressToBase64(Note.parseNoteTitle(body));
                        note.content = LZString.compressToBase64(body);
                        if (filePath !== config.defaultnotepath) {
                            note.createdAt = fsCreatedTime;
                        }
                    }
                }
                // if no permission specified and have owner then give editable permission, else default permission is freely
                if (!note.permission) {
                    if (note.ownerId) {
                        note.permission = "editable";
                    } else {
                        note.permission = "freely";
                    }
                }
                return callback(null, note);
            },
            afterCreate: function (note, options, callback) {
                sequelize.models.Revision.saveNoteRevision(note, function (err, revision) {
                    callback(err, note);
                });
            }
        }
    });

    return Note;
};