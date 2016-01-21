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
var metaMarked = require('meta-marked');

//core
var config = require("../config.js");

//others
var db = require("./db.js");
var Note = require("./note.js");
var User = require("./user.js");

//slides
var md = require('reveal.js/plugin/markdown/markdown');
var Mustache = require('mustache');

//reveal.js
var opts = {
    userBasePath: process.cwd(),
    revealBasePath: path.resolve(require.resolve('reveal.js'), '..', '..'),
    template: fs.readFileSync(path.join('.', '/public/views/slide', 'reveal.hbs')).toString(),
    templateListing: fs.readFileSync(path.join('.', '/public/views/slide', 'listing.hbs')).toString(),
    theme: 'css/theme/black.css',
    highlightTheme: 'zenburn',
    separator: '^(\r\n?|\n)---(\r\n?|\n)$',
    verticalSeparator: '^(\r\n?|\n)----(\r\n?|\n)$',
    revealOptions: {}
};

//public
var response = {
    errorForbidden: function (res) {
        responseError(res, "403", "Forbidden", "oh no.");
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
    showPublishSlide: showPublishSlide,
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
    db.readFromDB(noteId, function (err, data) {
        if (err) {
            return response.errorNotFound(res);
        }
        var body = LZString.decompressFromBase64(data.rows[0].content);
        var meta = null;
        try {
            meta = metaMarked(body).meta;
        } catch(err) {
            //na
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
			useCDN: config.usecdn,
            robots: (meta && meta.robots) || false //default allow robots
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
        owner = req.user._id;
    }
    db.newToDB(newId, owner, body, function (err, result) {
        if (err) {
            return response.errorInternalError(res);
        }
        Note.newNote(newId, owner, function(err, result) {
            if (err) {
                return response.errorInternalError(res);
            }
            res.redirect("/" + LZString.compressToBase64(newId));
        });
    });
}

function showFeatures(req, res, next) {
    db.readFromDB(config.featuresnotename, function (err, data) {
        if (err) {
            var body = fs.readFileSync(config.defaultfeaturespath, 'utf8');
            body = LZString.compressToBase64(body);
            db.newToDB(config.featuresnotename, null, body, function (err, result) {
                if (err) {
                    return response.errorInternalError(res);
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
    if (noteId != config.featuresnotename) {
        if (!Note.checkNoteIdValid(noteId)) {
            return response.errorNotFound(res);
        }
        noteId = LZString.decompressFromBase64(noteId);
        if (!noteId) {
            return response.errorNotFound(res);
        }
    }
    db.readFromDB(noteId, function (err, data) {
        if (err) {
            return response.errorNotFound(res);
        }
        var notedata = data.rows[0];
        Note.findOrNewNote(noteId, notedata.owner, function (err, note) {
            if (err || !note) {
                return response.errorNotFound(res);
            }
            //check view permission
            if (note.permission == 'private') {
                if (!req.isAuthenticated() || notedata.owner != req.user._id)
                    return response.errorForbidden(res);
            }
            responseHackMD(res, noteId);
        });
    });
}

function showPublishNote(req, res, next) {
    var shortid = req.params.shortid;
    if (shortId.isValid(shortid)) {
        Note.findNote(shortid, function (err, note) {
            if (err || !note) {
                return response.errorNotFound(res);
            }
            db.readFromDB(note.id, function (err, data) {
                if (err) {
                    return response.errorNotFound(res);
                }
                var notedata = data.rows[0];
                //check view permission
                if (note.permission == 'private') {
                    if (!req.isAuthenticated() || notedata.owner != req.user._id)
                        return response.errorForbidden(res);
                }
                //increase note viewcount
                Note.increaseViewCount(note, function (err, note) {
                    if (err || !note) {
                        return response.errorNotFound(res);
                    }
                    var body = LZString.decompressFromBase64(notedata.content);
                    var meta = null;
                    try {
                        meta = metaMarked(body).meta;
                    } catch(err) {
                        //na
                    }
                    var updatetime = notedata.update_time;
                    var text = S(body).escapeHTML().s;
                    var title = notedata.title;
                    var decodedTitle = LZString.decompressFromBase64(title);
                    if (decodedTitle) title = decodedTitle;
                    title = Note.generateWebTitle(title);
                    var origin = config.getserverurl();
                    var data = {
                        title: title,
                        viewcount: note.viewcount,
                        updatetime: updatetime,
                        url: origin,
                        body: text,
                        useCDN: config.usecdn,
                        lastchangeuserprofile: null,
                        robots: (meta && meta.robots) || false //default allow robots
                    };
                    if (note.lastchangeuser) {
                        //find last change user profile if lastchangeuser exists
                        User.findUser(note.lastchangeuser, function (err, user) {
                            if (!err && user && user.profile) {
                                var profile = JSON.parse(user.profile);
                                if (profile) {
                                    data.lastchangeuserprofile = {
                                        name: profile.displayName || profile.username,
                                        photo: User.parsePhotoByProfile(profile)
                                    }
                                    renderPublish(data, res);
                                }
                            }
                        });
                    } else {
                        renderPublish(data, res);
                    }
                    
                });
            });
        });
    } else {
        return response.errorNotFound(res);
    }
}

function renderPublish(data, res) {
    var template = config.prettypath;
    var options = {
        cache: !config.debug,
        filename: template
    };
    var compiled = ejs.compile(fs.readFileSync(template, 'utf8'), options);
    var html = compiled(data);
    var buf = html;
    res.writeHead(200, {
        'Content-Type': 'text/html; charset=UTF-8',
        'Cache-Control': 'private',
        'Content-Length': buf.length
    });
    res.end(buf);
}

function actionPublish(req, res, noteId) {
    db.readFromDB(noteId, function (err, data) {
        if (err) {
            return response.errorNotFound(res);
        }
        var owner = data.rows[0].owner;
        Note.findOrNewNote(noteId, owner, function (err, note) {
            if (err) {
                return response.errorNotFound(res);
            }
            res.redirect("/s/" + note.shortid);
        });
    });
}

function actionSlide(req, res, noteId) {
    db.readFromDB(noteId, function (err, data) {
        if (err) {
            return response.errorNotFound(res);
        }
        var owner = data.rows[0].owner;
        Note.findOrNewNote(noteId, owner, function (err, note) {
            if (err) {
                return response.errorNotFound(res);
            }
            res.redirect("/p/" + note.shortid);
        });
    });
}

function actionDownload(req, res, noteId) {
    db.readFromDB(noteId, function (err, data) {
        if (err) {
            return response.errorNotFound(res);
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
            return response.errorNotFound(res);
        }
        var body = LZString.decompressFromBase64(data.rows[0].content);
        try {
            body = metaMarked(body).markdown;
        } catch(err) {
            //na
        }
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
            return response.errorNotFound(res);
        }
        noteId = LZString.decompressFromBase64(noteId);
        if (!noteId) {
            return response.errorNotFound(res);
        }
    }
    Note.findNote(noteId, function (err, note) {
        if (err || !note) {
            return response.errorNotFound(res);
        }
        db.readFromDB(note.id, function (err, data) {
            if (err) {
                return response.errorNotFound(res);
            }
            var notedata = data.rows[0];
            //check view permission
            if (note.permission == 'private') {
                if (!req.isAuthenticated() || notedata.owner != req.user._id)
                    return response.errorForbidden(res);
            }
            var action = req.params.action;
            switch (action) {
            case "publish":
            case "pretty": //pretty deprecated
                actionPublish(req, res, noteId);
                break;
            case "slide":
                actionSlide(req, res, noteId);
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
        });
    });
}

function publishNoteActions(req, res, next) {
    var shortid = req.params.shortid;
    if (shortId.isValid(shortid)) {
        Note.findNote(shortid, function (err, note) {
            if (err || !note) {
                return response.errorNotFound(res);
            }
            db.readFromDB(note.id, function (err, data) {
                if (err) {
                    return response.errorNotFound(res);
                }
                var notedata = data.rows[0];
                //check view permission
                if (note.permission == 'private') {
                    if (!req.isAuthenticated() || notedata.owner != req.user._id)
                        return response.errorForbidden(res);
                }
                var action = req.params.action;
                switch (action) {
                case "edit":
                    if (note.id != config.featuresnotename)
                        res.redirect('/' + LZString.compressToBase64(note.id));
                    else
                        res.redirect('/' + note.id);
                    break;
                }
            });
        });
    }
}

function showPublishSlide(req, res, next) {
    var shortid = req.params.shortid;
    if (shortId.isValid(shortid)) {
        Note.findNote(shortid, function (err, note) {
            if (err || !note) {
                return response.errorNotFound(res);
            }
            db.readFromDB(note.id, function (err, data) {
                if (err) {
                    return response.errorNotFound(res);
                }
                var notedata = data.rows[0];
                //check view permission
                if (note.permission == 'private') {
                    if (!req.isAuthenticated() || notedata.owner != req.user._id)
                        return response.errorForbidden(res);
                }
                //increase note viewcount
                Note.increaseViewCount(note, function (err, note) {
                    if (err || !note) {
                        return response.errorNotFound(res);
                    }
                    var body = LZString.decompressFromBase64(notedata.content);
                    try {
                        body = metaMarked(body).markdown;
                    } catch(err) {
                        //na
                    }
                    var title = notedata.title;
                    var decodedTitle = LZString.decompressFromBase64(title);
                    if (decodedTitle) title = decodedTitle;
                    title = Note.generateWebTitle(title);
                    var text = S(body).escapeHTML().s;
                    render(res, title, text);
                });
            });
        });
    } else {
        return response.errorNotFound(res);
    }
}

//reveal.js render
var render = function (res, title, markdown) {
    var slides = md.slidify(markdown, opts);

    res.end(Mustache.to_html(opts.template, {
        title: title,
        theme: opts.theme,
        highlightTheme: opts.highlightTheme,
        slides: slides,
        options: JSON.stringify(opts.revealOptions, null, 2)
    }));
};


module.exports = response;
