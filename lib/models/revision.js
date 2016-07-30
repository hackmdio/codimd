"use strict";

// external modules
var Sequelize = require("sequelize");
var LZString = require('lz-string');
var async = require('async');
var moment = require('moment');
var DiffMatchPatch = require('diff-match-patch');
var dmp = new DiffMatchPatch();

// core
var config = require("../config.js");
var logger = require("../logger.js");

module.exports = function (sequelize, DataTypes) {
    var Revision = sequelize.define("Revision", {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: Sequelize.UUIDV4
        },
        patch: {
            type: DataTypes.TEXT
        },
        lastContent: {
            type: DataTypes.TEXT
        },
        content: {
            type: DataTypes.TEXT
        },
        length: {
            type: DataTypes.INTEGER
        }
    }, {
        classMethods: {
            associate: function (models) {
                Revision.belongsTo(models.Note, {
                    foreignKey: "noteId",
                    as: "note",
                    constraints: false
                });
            },
            createPatch: function (lastDoc, CurrDoc) {
                var ms_start = (new Date()).getTime();
                var diff = dmp.diff_main(lastDoc, CurrDoc);
                dmp.diff_cleanupSemantic(diff);
                var patch = dmp.patch_make(lastDoc, diff);
                patch = dmp.patch_toText(patch);
                var ms_end = (new Date()).getTime();
                if (config.debug) {
                    logger.info(patch);
                    logger.info((ms_end - ms_start) + 'ms');
                }
                return patch;
            },
            getNoteRevisions: function (note, callback) {
                Revision.findAll({
                    where: {
                        noteId: note.id
                    },
                    order: '"createdAt" DESC'
                }).then(function (revisions) {
                    var data = [];
                    for (var i = 0, l = revisions.length; i < l; i++) {
                        var revision = revisions[i];
                        data.push({
                            time: moment(revision.createdAt).valueOf(),
                            length: revision.length
                        });
                    }
                    callback(null, data);
                }).catch(function (err) {
                    callback(err, null);
                });
            },
            getPatchedNoteRevisionByTime: function (note, time, callback) {
                // find all revisions to prepare for all possible calculation
                Revision.findAll({
                    where: {
                        noteId: note.id
                    },
                    order: '"createdAt" DESC'
                }).then(function (revisions) {
                    if (revisions.length <= 0) return callback(null, null);
                    // measure target revision position 
                    Revision.count({
                        where: {
                            noteId: note.id,
                            createdAt: {
                                $gte: time
                            }
                        },
                        order: '"createdAt" DESC'
                    }).then(function (count) {
                        if (count <= 0) return callback(null, null);
                        var ms_start = (new Date()).getTime();
                        var startContent = null;
                        var lastPatch = [];
                        var applyPatches = [];
                        if (count <= Math.round(revisions.length / 2)) {
                            // start from top to target
                            for (var i = 0; i < count; i++) {
                                var revision = revisions[i];
                                if (i == 0) {
                                    startContent = LZString.decompressFromBase64(revision.content || revision.lastContent);
                                }
                                if (i != count - 1) {
                                    var patch = dmp.patch_fromText(LZString.decompressFromBase64(revision.patch));
                                    applyPatches = applyPatches.concat(patch);
                                }
                                lastPatch = revision.patch;
                            }
                            // swap DIFF_INSERT and DIFF_DELETE to achieve unpatching
                            for (var i = 0, l = applyPatches.length; i < l; i++) {
                                for (var j = 0, m = applyPatches[i].diffs.length; j < m; j++) {
                                    var diff = applyPatches[i].diffs[j];
                                    if (diff[0] == DiffMatchPatch.DIFF_INSERT)
                                        diff[0] = DiffMatchPatch.DIFF_DELETE;
                                    else if (diff[0] == DiffMatchPatch.DIFF_DELETE)
                                        diff[0] = DiffMatchPatch.DIFF_INSERT;
                                }
                            }
                        } else {
                            // start from bottom to target
                            var l = revisions.length - 1;
                            for (var i = l; i >= count - 1; i--) {
                                var revision = revisions[i];
                                if (i == l) {
                                    startContent = LZString.decompressFromBase64(revision.lastContent);
                                }
                                if (revision.patch) {
                                    var patch = dmp.patch_fromText(LZString.decompressFromBase64(revision.patch));
                                    applyPatches = applyPatches.concat(patch);
                                }
                                lastPatch = revision.patch;
                            }
                        }
                        try {
                            var finalContent = dmp.patch_apply(applyPatches, startContent)[0];
                        } catch (err) {
                            return callback(err, null);
                        }
                        var data = {
                            content: finalContent,
                            patch: dmp.patch_fromText(LZString.decompressFromBase64(lastPatch))
                        };
                        var ms_end = (new Date()).getTime();
                        if (config.debug) {
                            logger.info((ms_end - ms_start) + 'ms');
                        }
                        return callback(null, data);
                    }).catch(function (err) {
                        return callback(err, null);
                    });
                }).catch(function (err) {
                    return callback(err, null);
                });
            },
            checkAllNotesRevision: function (callback) {
                Revision.saveAllNotesRevision(function (err, notes) {
                    if (err) return callback(err, null);
                    if (notes.length <= 0) {
                        return callback(null, notes);
                    } else {
                        Revision.checkAllNotesRevision(callback);
                    }
                });
            },
            saveAllNotesRevision: function (callback) {
                sequelize.models.Note.findAll({
                    where: {
                        $and: [
                            {
                                lastchangeAt: {
                                    $or: {
                                        $eq: null,
                                        $and: {
                                            $ne: null,
                                            $gt: sequelize.col('createdAt')
                                        }
                                    }
                                }
                            },
                            {
                                savedAt: {
                                    $or: {
                                        $eq: null,
                                        $lt: sequelize.col('lastchangeAt')
                                    }
                                }
                            }
                        ]
                    }
                }).then(function (notes) {
                    if (notes.length <= 0) return callback(null, notes);
                    async.each(notes, function (note, _callback) {
                        Revision.saveNoteRevision(note, _callback);
                    }, function (err) {
                        if (err) return callback(err, null);
                        return callback(null, notes);
                    });
                }).catch(function (err) {
                    return callback(err, null);
                });
            },
            saveNoteRevision: function (note, callback) {
                Revision.findAll({
                    where: {
                        noteId: note.id
                    },
                    order: '"createdAt" DESC'
                }).then(function (revisions) {
                    if (revisions.length <= 0) {
                        // if no revision available
                        Revision.create({
                            noteId: note.id,
                            lastContent: note.content,
                            length: LZString.decompressFromBase64(note.content).length
                        }).then(function (revision) {
                            Revision.finishSaveNoteRevision(note, revision, callback);
                        }).catch(function (err) {
                            return callback(err, null);
                        });
                    } else {
                        var latestRevision = revisions[0];
                        var lastContent = LZString.decompressFromBase64(latestRevision.content || latestRevision.lastContent);
                        var content = LZString.decompressFromBase64(note.content);
                        var patch = Revision.createPatch(lastContent, content);
                        if (!patch) {
                            // if patch is empty (means no difference) then just update the latest revision updated time 
                            latestRevision.changed('updatedAt', true); 
                            latestRevision.update({
                                updatedAt: Date.now()
                            }).then(function (revision) {
                                Revision.finishSaveNoteRevision(note, revision, callback);
                            }).catch(function (err) {
                                return callback(err, null);
                            });
                        } else {
                            Revision.create({
                                noteId: note.id,
                                patch: LZString.compressToBase64(patch),
                                content: note.content,
                                length: LZString.decompressFromBase64(note.content).length
                            }).then(function (revision) {
                                // clear last revision content to reduce db size
                                latestRevision.update({
                                    content: null
                                }).then(function () {
                                    Revision.finishSaveNoteRevision(note, revision, callback);
                                }).catch(function (err) {
                                    return callback(err, null);
                                });
                            }).catch(function (err) {
                                return callback(err, null);
                            });
                        }
                    }
                }).catch(function (err) {
                    return callback(err, null);
                });
            },
            finishSaveNoteRevision: function (note, revision, callback) {
                note.update({
                    savedAt: revision.updatedAt
                }).then(function () {
                    return callback(null, revision);
                }).catch(function (err) {
                    return callback(err, null);
                });
            }
        }
    });

    return Revision;
};