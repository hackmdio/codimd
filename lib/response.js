//response
//external modules
var ejs = require('ejs');
var fs = require('fs');
var path = require('path');
var uuid = require('node-uuid');
var markdownpdf = require("markdown-pdf");
var LZString = require('lz-string');
var S = require('string');
var shortId = require('shortid');

//core
var config = require("../config.js");

//others
var db = require("./db.js");
var Note = require("./note.js");

//public
var response = {
    errorForbidden: function (res) {
        res.status(403).send("Forbidden, oh no.");
    },
    errorNotFound: function (res) {
        responseError(res, "404", "Not Found", "oops.");
    },
    errorInternalError: function (res) {
        responseError(res, "500", "Internal Error", "wtf.");
    },
    errorServiceUnavailable: function (res) {
        res.status(503).send("I'm busy right now, try again later.");
    },
    newNote: newNote,
    showFeatures: showFeatures,
    showNote: showNote,
    showPublishNote: showPublishNote,
	showIndex: showIndex,
    noteActions: noteActions,
    publishNoteActions: publishNoteActions
};

function responseError(res, code, detail, msg) {
    res.writeHead(code, {
        'Content-Type': 'text/html'
    });
    var template = config.errorpath;
    var content = ejs.render(fs.readFileSync(template, 'utf8'), {
        title: code + ' ' + detail + ' ' + msg,
        cache: !config.debug,
        filename: template,
        code: code,
        detail: detail,
        msg: msg,
        useCDN: config.usecdn
    });
    res.write(content);
    res.end();
}

function showIndex(req, res, next) {
    res.writeHead(200, {
        'Content-Type': 'text/html'
    });
    var template = config.indexpath;
    var content = ejs.render(fs.readFileSync(template, 'utf8'), {
        useCDN: config.usecdn
    });
    res.write(content);
    res.end();
}

function responseHackMD(res, noteId) {
    if (noteId != config.featuresnotename) {
        if (!Note.checkNoteIdValid(noteId)) {
            responseError(res, "404", "Not Found", "oops.");
            return;
        }
        noteId = LZString.decompressFromBase64(noteId);
        if (!noteId) {
            responseError(res, "404", "Not Found", "oops.");
            return;
        }
    }
    db.readFromDB(noteId, function (err, data) {
        if (err) {
            responseError(res, "404", "Not Found", "oops.");
            return;
        }
        var title = data.rows[0].title;
        var decodedTitle = LZString.decompressFromBase64(title);
        if (decodedTitle) title = decodedTitle;
        title = Note.generateWebTitle(title);
        var template = config.hackmdpath;
        var options = {
            cache: !config.debug,
            filename: template
        };
        var compiled = ejs.compile(fs.readFileSync(template, 'utf8'), options);
        var html = compiled({
            title: title,
            useCDN: config.usecdn
        });
        var buf = html;
        res.writeHead(200, {
            'Content-Type': 'text/html; charset=UTF-8',
            'Cache-Control': 'private',
            'Content-Length': buf.length
        });
        res.end(buf);
    });
}

function newNote(req, res, next) {
    var newId = uuid.v4();
    var body = fs.readFileSync(config.defaultnotepath, 'utf8');
    body = LZString.compressToBase64(body);
    var owner = null;
    if (req.isAuthenticated()) {
        owner = req.session.passport.user;
    }
    db.newToDB(newId, owner, body, function (err, result) {
        if (err) {
            responseError(res, "500", "Internal Error", "wtf.");
            return;
        }
        res.redirect("/" + LZString.compressToBase64(newId));
    });
}

function showFeatures(req, res, next) {
    db.readFromDB(config.featuresnotename, function (err, data) {
        if (err) {
            var body = fs.readFileSync(config.defaultfeaturespath, 'utf8');
            body = LZString.compressToBase64(body);
            db.newToDB(config.featuresnotename, null, body, function (err, result) {
                if (err) {
                    responseError(res, "500", "Internal Error", "wtf.");
                    return;
                }
                responseHackMD(res, config.featuresnotename);
            });
        } else {
            responseHackMD(res, config.featuresnotename);
        }
    });
}

function showNote(req, res, next) {
    var noteId = req.params.noteId;
    if (!Note.checkNoteIdValid(noteId)) {
        responseError(res, "404", "Not Found", "oops.");
        return;
    }
    responseHackMD(res, noteId);
}

function showPublishNote(req, res, next) {
    var shortid = req.params.shortid;
    if (shortId.isValid(shortid)) {
        Note.findNote(shortid, function (err, note) {
            if (err || !note) {
                responseError(res, "404", "Not Found", "oops.");
                return;
            }
            //increase note viewcount
            Note.increaseViewCount(note, function (err, note) {
                if (err || !note) {
                    responseError(res, "404", "Not Found", "oops.");
                    return;
                }
                db.readFromDB(note.id, function (err, data) {
                    if (err) {
                        responseError(res, "404", "Not Found", "oops.");
                        return;
                    }
                    var body = LZString.decompressFromBase64(data.rows[0].content);
                    var updatetime = data.rows[0].update_time;
                    var text = S(body).escapeHTML().s;
                    var title = data.rows[0].title;
                    var decodedTitle = LZString.decompressFromBase64(title);
                    if (decodedTitle) title = decodedTitle;
                    title = Note.generateWebTitle(title);
                    var template = config.prettypath;
                    var options = {
                        cache: !config.debug,
                        filename: template
                    };
                    var compiled = ejs.compile(fs.readFileSync(template, 'utf8'), options);
                    var origin = config.getserverurl();
                    var html = compiled({
                        title: title,
                        viewcount: note.viewcount,
                        updatetime: updatetime,
                        url: origin,
                        body: text,
                        useCDN: config.usecdn
                    });
                    var buf = html;
                    res.writeHead(200, {
                        'Content-Type': 'text/html; charset=UTF-8',
                        'Cache-Control': 'private',
                        'Content-Length': buf.length
                    });
                    res.end(buf);
                });
            });
        });
    } else {
        responseError(res, "404", "Not Found", "oops.");
    }
}

function actionPublish(req, res, noteId) {
    db.readFromDB(noteId, function (err, data) {
        if (err) {
            responseError(res, "404", "Not Found", "oops.");
            return;
        }
        var owner = data.rows[0].owner;
        var permission = "freely";
        if (owner && owner != "null") {
            permission = "editable";
        }
        Note.findOrNewNote(noteId, permission, function (err, note) {
            if (err) {
                responseError(res, "404", "Not Found", "oops.");
                return;
            }
            res.redirect("/s/" + note.shortid);
        });
    });
}

//pretty api is deprecated
function actionPretty(req, res, noteId) {
    db.readFromDB(noteId, function (err, data) {
        if (err) {
            responseError(res, "404", "Not Found", "oops.");
            return;
        }
        var body = LZString.decompressFromBase64(data.rows[0].content);
        var text = S(body).escapeHTML().s;
        var title = data.rows[0].title;
        var decodedTitle = LZString.decompressFromBase64(title);
        if (decodedTitle) title = decodedTitle;
        title = Note.generateWebTitle(title);
        var template = config.prettypath;
        var compiled = ejs.compile(fs.readFileSync(template, 'utf8'));
        var origin = config.getserverurl();
        var html = compiled({
            title: title,
            url: origin,
            body: text
        });
        var buf = html;
        res.writeHead(200, {
            'Content-Type': 'text/html; charset=UTF-8',
            'Cache-Control': 'private',
            'Content-Length': buf.length
        });
        res.end(buf);
    });
}

function actionDownload(req, res, noteId) {
    db.readFromDB(noteId, function (err, data) {
        if (err) {
            responseError(res, "404", "Not Found", "oops.");
            return;
        }
        var body = LZString.decompressFromBase64(data.rows[0].content);
        var title = Note.getNoteTitle(body);
        res.writeHead(200, {
            'Content-Type': 'text/markdown; charset=UTF-8',
            'Cache-Control': 'private',
            'Content-disposition': 'attachment; filename=' + title + '.md',
            'Content-Length': body.length
        });
        res.end(body);
    });
}

function actionPDF(req, res, noteId) {
    db.readFromDB(noteId, function (err, data) {
        if (err) {
            responseError(res, "404", "Not Found", "oops.");
            return;
        }
        var body = LZString.decompressFromBase64(data.rows[0].content);
        var title = Note.getNoteTitle(body);

        if (!fs.existsSync(config.tmppath)) {
            fs.mkdirSync(config.tmppath);
        }
        var path = config.tmppath + Date.now() + '.pdf';
        markdownpdf().from.string(body).to(path, function () {
            var stream = fs.createReadStream(path);
            var filename = title;
            // Be careful of special characters
            filename = encodeURIComponent(filename);
            // Ideally this should strip them
            res.setHeader('Content-disposition', 'attachment; filename="' + filename + '.pdf"');
            res.setHeader('Cache-Control', 'private');
            res.setHeader('Content-Type', 'application/pdf; charset=UTF-8');
            stream.pipe(res);
            fs.unlink(path);
        });
    });
}

function noteActions(req, res, next) {
    var noteId = req.params.noteId;
    if (noteId != config.featuresnotename) {
        if (!Note.checkNoteIdValid(noteId)) {
            responseError(res, "404", "Not Found", "oops.");
            return;
        }
        noteId = LZString.decompressFromBase64(noteId);
        if (!noteId) {
            responseError(res, "404", "Not Found", "oops.");
            return;
        }
    }
    var action = req.params.action;
    switch (action) {
    case "publish":
    case "pretty": //pretty deprecated
        actionPublish(req, res, noteId);
        break;
    case "download":
        actionDownload(req, res, noteId);
        break;
    case "pdf":
        actionPDF(req, res, noteId);
        break;
    default:
        if (noteId != config.featuresnotename)
            res.redirect('/' + LZString.compressToBase64(noteId));
        else
            res.redirect('/' + noteId);
        break;
    }
}

function publishNoteActions(req, res, next) {
    var action = req.params.action;
    switch (action) {
    case "edit":
        var shortid = req.params.shortid;
        if (shortId.isValid(shortid)) {
            Note.findNote(shortid, function (err, note) {
                if (err || !note) {
                    responseError(res, "404", "Not Found", "oops.");
                    return;
                }
                if (note.id != config.featuresnotename)
                    res.redirect('/' + LZString.compressToBase64(note.id));
                else
                    res.redirect('/' + note.id);
            });
        }
        break;
    }
}

module.exports = response;
