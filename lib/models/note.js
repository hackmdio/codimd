"use strict";

// external modules
var fs = require('fs');
var path = require('path');
var LZString = require('lz-string');
var md = require('markdown-it')();
var metaMarked = require('meta-marked');
var cheerio = require('cheerio');
var shortId = require('shortid');
var Sequelize = require("sequelize");
var async = require('async');
var moment = require('moment');
var DiffMatchPatch = require('diff-match-patch');
var dmp = new DiffMatchPatch();
var S = require('string');

// core
var config = require("../config.js");
var logger = require("../logger.js");

//ot
var ot = require("../ot/index.js");

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
            type: DataTypes.TEXT,
            set: function (value) {
                this.setDataValue('title', sequelize.stripNullByte(value));
            }
        },
        content: {
            type: DataTypes.TEXT,
            set: function (value) {
                this.setDataValue('content', sequelize.stripNullByte(value));
            }
        },
        authorship: {
            type: DataTypes.TEXT,
            set: function (value) {
                this.setDataValue('authorship', JSON.stringify(value));
            }
        },
        lastchangeAt: {
            type: DataTypes.DATE
        },
        savedAt: {
            type: DataTypes.DATE
        }
    }, {
        paranoid: true,
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
                Note.hasMany(models.Author, {
                    foreignKey: "noteId",
                    as: "authors",
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
                                    var body = fs.readFileSync(filePath, 'utf8');
                                    var contentLength = body.length;
                                    var title = Note.parseNoteTitle(body);
                                    if (fsModifiedTime.isAfter(dbModifiedTime) && note.content !== body) {
                                        note.update({
                                            title: title,
                                            content: body,
                                            lastchangeAt: fsModifiedTime
                                        }).then(function (note) {
                                            sequelize.models.Revision.saveNoteRevision(note, function (err, revision) {
                                                if (err) return _callback(err, null);
                                                // update authorship on after making revision of docs
                                                var patch = dmp.patch_fromText(revision.patch);
                                                var operations = Note.transformPatchToOperations(patch, contentLength);
                                                var authorship = note.authorship;
                                                for (var i = 0; i < operations.length; i++) {
                                                    authorship = Note.updateAuthorshipByOperation(operations[i], null, authorship);
                                                }
                                                note.update({
                                                    authorship: JSON.stringify(authorship)
                                                }).then(function (note) {
                                                    return callback(null, note.id);
                                                }).catch(function (err) {
                                                    return _callback(err, null);
                                                });
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
            parseNoteInfo: function (body) {
                var meta = null;
                try {
                    var obj = metaMarked(body);
                    body = obj.markdown;
                    meta = obj.meta;
                } catch (err) {
                    //na
                }
                if (!meta) meta = {};
                var $ = cheerio.load(md.render(body));
                return {
                    title: Note.extractNoteTitle(meta, $),
                    tags: Note.extractNoteTags(meta, $)
                };
            },
            parseNoteTitle: function (body) {
                var meta = null;
                try {
                    var obj = metaMarked(body);
                    body = obj.markdown;
                    meta = obj.meta;
                } catch (err) {
                    //na
                }
                if (!meta) meta = {};
                var $ = cheerio.load(md.render(body));
                return Note.extractNoteTitle(meta, $);
            },
            extractNoteTitle: function (meta, $) {
                var title = "";
                if (meta.title && (typeof meta.title == "string" || typeof meta.title == "number")) {
                    title = meta.title;
                } else {
                    var h1s = $("h1");
                    if (h1s.length > 0 && h1s.first().text().split('\n').length == 1)
                        title = S(h1s.first().text()).stripTags().s;
                }
                if (!title) title = "Untitled";
                return title;
            },
            generateDescription: function (markdown) {
                return markdown.substr(0, 100).replace(/(?:\r\n|\r|\n)/g, ' ');
            },
            decodeTitle: function (title) {
                return title ? title : 'Untitled';
            },
            generateWebTitle: function (title) {
                title = !title || title == "Untitled" ? "HackMD - Collaborative markdown notes" : title + " - HackMD";
                return title;
            },
            extractNoteTags: function (meta, $) {
                var tags = [];
                var rawtags = [];
                if (meta.tags && (typeof meta.tags == "string" || typeof meta.tags == "number")) {
                    var metaTags = ('' + meta.tags).split(',');
                    for (var i = 0; i < metaTags.length; i++) {
                        var text = metaTags[i].trim();
                        if (text) rawtags.push(text);
                    }
                } else {
                    var h6s = $("h6");
                    h6s.each(function (key, value) {
                        if (/^tags/gmi.test($(value).text())) {
                            var codes = $(value).find("code");
                            for (var i = 0; i < codes.length; i++) {
                                var text = S($(codes[i]).text().trim()).stripTags().s;
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
                return tags;
            },
            parseMeta: function (meta) {
                var _meta = {};
                if (meta) {
                    if (meta.title && (typeof meta.title == "string" || typeof meta.title == "number"))
                        _meta.title = meta.title;
                    if (meta.description && (typeof meta.description == "string" || typeof meta.description == "number"))
                        _meta.description = meta.description;
                    if (meta.robots && (typeof meta.robots == "string" || typeof meta.robots == "number"))
                        _meta.robots = meta.robots;
                    if (meta.GA && (typeof meta.GA == "string" || typeof meta.GA == "number"))
                        _meta.GA = meta.GA;
                    if (meta.disqus && (typeof meta.disqus == "string" || typeof meta.disqus == "number"))
                        _meta.disqus = meta.disqus;
                    if (meta.slideOptions && (typeof meta.slideOptions == "object"))
                        _meta.slideOptions = meta.slideOptions;
                }
                return _meta; 
            },
            updateAuthorshipByOperation: function (operation, userId, authorships) {
                var index = 0;
                var timestamp = Date.now();
                for (var i = 0; i < operation.length; i++) {
                    var op = operation[i];
                    if (ot.TextOperation.isRetain(op)) {
                        index += op;
                    } else if (ot.TextOperation.isInsert(op)) {
                        var opStart = index;
                        var opEnd = index + op.length;
                        var inserted = false;
                        // authorship format: [userId, startPos, endPos, createdAt, updatedAt]
                        if (authorships.length <= 0) authorships.push([userId, opStart, opEnd, timestamp, timestamp]);
                        else {
                            for (var j = 0; j < authorships.length; j++) {
                                var authorship = authorships[j];
                                if (!inserted) {
                                    var nextAuthorship = authorships[j + 1] || -1;
                                    if (nextAuthorship != -1 && nextAuthorship[1] >= opEnd || j >= authorships.length - 1) {
                                        if (authorship[1] < opStart && authorship[2] > opStart) {
                                            // divide
                                            var postLength = authorship[2] - opStart;
                                            authorship[2] = opStart;
                                            authorship[4] = timestamp;
                                            authorships.splice(j + 1, 0, [userId, opStart, opEnd, timestamp, timestamp]);
                                            authorships.splice(j + 2, 0, [authorship[0], opEnd, opEnd + postLength, authorship[3], timestamp]);
                                            j += 2;
                                            inserted = true;
                                        } else if (authorship[1] >= opStart) {
                                            authorships.splice(j, 0, [userId, opStart, opEnd, timestamp, timestamp]);
                                            j += 1;
                                            inserted = true;
                                        } else if (authorship[2] <= opStart) {
                                            authorships.splice(j + 1, 0, [userId, opStart, opEnd, timestamp, timestamp]);
                                            j += 1;
                                            inserted = true;
                                        }
                                    }
                                }
                                if (authorship[1] >= opStart) {
                                    authorship[1] += op.length;
                                    authorship[2] += op.length;
                                }
                            }
                        }
                        index += op.length;
                    } else if (ot.TextOperation.isDelete(op)) {
                        var opStart = index;
                        var opEnd = index - op;
                        if (operation.length == 1) {
                            authorships = [];
                        } else if (authorships.length > 0) {
                            for (var j = 0; j < authorships.length; j++) {
                                var authorship = authorships[j];
                                if (authorship[1] >= opStart && authorship[1] <= opEnd && authorship[2] >= opStart && authorship[2] <= opEnd) {
                                    authorships.splice(j, 1);
                                    j -= 1;
                                } else if (authorship[1] < opStart && authorship[1] < opEnd && authorship[2] > opStart && authorship[2] > opEnd) {
                                    authorship[2] += op;
                                    authorship[4] = timestamp;
                                } else if (authorship[2] >= opStart && authorship[2] <= opEnd) {
                                    authorship[2] = opStart;
                                    authorship[4] = timestamp;
                                } else if (authorship[1] >= opStart && authorship[1] <= opEnd) {
                                    authorship[1] = opEnd;
                                    authorship[4] = timestamp;
                                }
                                if (authorship[1] >= opEnd) {
                                    authorship[1] += op;
                                    authorship[2] += op;
                                }
                            }
                        }
                        index += op;
                    }
                }
                // merge
                for (var j = 0; j < authorships.length; j++) {
                    var authorship = authorships[j];
                    for (var k = j + 1; k < authorships.length; k++) {
                        var nextAuthorship = authorships[k];
                        if (nextAuthorship && authorship[0] === nextAuthorship[0] && authorship[2] === nextAuthorship[1]) {
                            var minTimestamp = Math.min(authorship[3], nextAuthorship[3]);
                            var maxTimestamp = Math.max(authorship[3], nextAuthorship[3]);
                            authorships.splice(j, 1, [authorship[0], authorship[1], nextAuthorship[2], minTimestamp, maxTimestamp]);
                            authorships.splice(k, 1);
                            j -= 1;
                            break;
                        }
                    }
                }
                // clear
                for (var j = 0; j < authorships.length; j++) {
                    var authorship = authorships[j];
                    if (!authorship[0]) {
                        authorships.splice(j, 1);
                        j -= 1;
                    }
                }
                return authorships;
            },
            transformPatchToOperations: function (patch, contentLength) {
                var operations = [];
                if (patch.length > 0) {
                    // calculate original content length
                    for (var j = patch.length - 1; j >= 0; j--) {
                        var p = patch[j];
                        for (var i = 0; i < p.diffs.length; i++) {
                            var diff = p.diffs[i];
                            switch(diff[0]) {
                                case 1: // insert
                                    contentLength -= diff[1].length;
                                break;
                                case -1: // delete
                                    contentLength += diff[1].length;
                                break;
                            }
                        }
                    }
                    // generate operations
                    var bias = 0;
                    var lengthBias = 0;
                    for (var j = 0; j < patch.length; j++) {
                        var operation = [];
                        var p = patch[j];
                        var currIndex = p.start1;
                        var currLength = contentLength - bias;
                        for (var i = 0; i < p.diffs.length; i++) {
                            var diff = p.diffs[i];
                            switch(diff[0]) {
                                case 0: // retain
                                    if (i == 0) // first
                                        operation.push(currIndex + diff[1].length);
                                    else if (i != p.diffs.length - 1) // mid
                                        operation.push(diff[1].length);
                                    else // last
                                        operation.push(currLength + lengthBias - currIndex);
                                    currIndex += diff[1].length;
                                break;
                                case 1: // insert
                                    operation.push(diff[1]);
                                    lengthBias += diff[1].length;
                                    currIndex += diff[1].length;
                                break;
                                case -1: // delete
                                    operation.push(-diff[1].length);
                                    bias += diff[1].length;
                                    currIndex += diff[1].length;
                                break;
                            }
                        }
                        operations.push(operation);
                    }
                }
                return operations;
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
                        note.title = Note.parseNoteTitle(body);
                        note.content = body;
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