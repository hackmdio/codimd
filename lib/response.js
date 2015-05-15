//response
//external modules
var ejs = require('ejs');
var fs = require('fs');
var path = require('path');
var uuid = require('node-uuid');
var markdownpdf = require("markdown-pdf");
var LZString = require('lz-string');

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
    noteActions: noteActions
};

function responseError(res, code, detail, msg) {
    res.writeHead(code, {
        'Content-Type': 'text/html'
    });
    var content = ejs.render(fs.readFileSync(config.errorpath, 'utf8'), {
        cache: !config.debug,
        filename: config.errorpath,
        code: code,
        detail: detail,
        msg: msg
    });
    res.write(content);
    res.end();
}

function responseHackMD(res) {
    res.writeHead(200, {
        'Content-Type': 'text/html'
    });
    var content = ejs.render(fs.readFileSync(config.hackmdpath, 'utf8'), {
        cache: !config.debug,
        filename: config.hackmdpath
    });
    res.write(content);
    res.end();
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
                responseHackMD(res);
            });
        } else {
            responseHackMD(res);
        }
    });
}

function showNote(req, res, next) {
    var noteId = req.params.noteId;
    if (!Note.checkNoteIdValid(noteId)) {
        responseError(res, "404", "Not Found", "oops.");
        return;
    }
    responseHackMD(res);
}

function actionPretty(req, res, noteId) {
    db.readFromDB(noteId, function (err, data) {
        if (err) {
            responseError(res, "404", "Not Found", "oops.");
            return;
        }
        var body = data.rows[0].content;
        var template = config.prettypath;
        var compiled = ejs.compile(fs.readFileSync(template, 'utf8'));
        var origin = "//" + req.headers.host;
        var html = compiled({
            url: origin,
            body: body
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
    case "pretty":
        actionPretty(req, res, noteId);
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

module.exports = response;