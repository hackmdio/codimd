//app
//external modules
var express = require('express');
var toobusy = require('toobusy-js');
var ejs = require('ejs');
var passport = require('passport');
var methodOverride = require('method-override');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var compression = require('compression')
var session = require('express-session');
var SequelizeStore = require('connect-session-sequelize')(session.Store);
var fs = require('fs');
var url = require('url');
var path = require('path');
var imgur = require('imgur');
var formidable = require('formidable');
var morgan = require('morgan');
var passportSocketIo = require("passport.socketio");
var helmet = require('helmet');
var i18n = require('i18n');
var flash = require('connect-flash');
var validator = require('validator');

//core
var config = require("./lib/config.js");
var logger = require("./lib/logger.js");
var auth = require("./lib/auth.js");
var response = require("./lib/response.js");
var models = require("./lib/models");
var note = require("./lib/note.js");

//server setup
if (config.usessl) {
    var ca = (function () {
        var i, len, results;
        results = [];
        for (i = 0, len = config.sslcapath.length; i < len; i++) {
            results.push(fs.readFileSync(config.sslcapath[i], 'utf8'));
        }
        return results;
    })();
    var options = {
        key: fs.readFileSync(config.sslkeypath, 'utf8'),
        cert: fs.readFileSync(config.sslcertpath, 'utf8'),
        ca: ca,
        dhparam: fs.readFileSync(config.dhparampath, 'utf8'),
        requestCert: false,
        rejectUnauthorized: false
    };
    var app = express();
    var server = require('https').createServer(options, app);
} else {
    var app = express();
    var server = require('http').createServer(app);
}

//logger
app.use(morgan('combined', {
    "stream": logger.stream
}));

//socket io
var io = require('socket.io')(server);
io.engine.ws = new (require('uws').Server)({
    noServer: true,
    perMessageDeflate: false
});

//others
var realtime = require("./lib/realtime.js");

//assign socket io to realtime
realtime.io = io;

//methodOverride
app.use(methodOverride('_method'));

// create application/json parser
var jsonParser = bodyParser.json({
    limit: 1024 * 1024 * 10 // 10 mb
});

// create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({
    extended: false,
    limit: 1024 * 1024 * 10 // 10 mb
});

//session store
var sessionStore = new SequelizeStore({
    db: models.sequelize
});

//compression
app.use(compression());

// use hsts to tell https users stick to this
app.use(helmet.hsts({
    maxAge: 31536000 * 1000, // 365 days
    includeSubdomains: true,
    preload: true
}));

i18n.configure({
    locales: ['en', 'zh', 'fr', 'de', 'ja', 'es', 'el', 'pt', 'it', 'tr', 'ru', 'nl', 'hr', 'pl', 'uk', 'hi', 'sv', 'eo'],
    cookie: 'locale',
    directory: __dirname + '/locales'
});

app.use(cookieParser());

app.use(i18n.init);

// routes without sessions
// static files
app.use('/', express.static(__dirname + '/public', { maxAge: config.staticcachetime }));

//session
app.use(session({
    name: config.sessionname,
    secret: config.sessionsecret,
    resave: false, //don't save session if unmodified
    saveUninitialized: true, //always create session to ensure the origin
    rolling: true, // reset maxAge on every response
    cookie: {
        maxAge: config.sessionlife
    },
    store: sessionStore
}));

// session resumption
var tlsSessionStore = {};
server.on('newSession', function (id, data, cb) {
    tlsSessionStore[id.toString('hex')] = data;
    cb();
});
server.on('resumeSession', function (id, cb) {
    cb(null, tlsSessionStore[id.toString('hex')] || null);
});

//middleware which blocks requests when we're too busy
app.use(function (req, res, next) {
    if (toobusy()) {
        response.errorServiceUnavailable(res);
    } else {
        next();
    }
});

app.use(flash());

//passport
app.use(passport.initialize());
app.use(passport.session());

//serialize and deserialize
passport.serializeUser(function (user, done) {
    logger.info('serializeUser: ' + user.id);
    return done(null, user.id);
});
passport.deserializeUser(function (id, done) {
    models.User.findOne({
        where: {
            id: id
        }
    }).then(function (user) {
        logger.info('deserializeUser: ' + user.id);
        return done(null, user);
    }).catch(function (err) {
        logger.error(err);
        return done(err, null);
    });
});

// check uri is valid before going further
app.use(function(req, res, next) {
    try {
        decodeURIComponent(req.path);
    } catch (err) {
        logger.error(err);
        return response.errorBadRequest(res);
    }
    next();
});

// redirect url without trailing slashes
app.use(function(req, res, next) {
    if ("GET" == req.method && req.path.substr(-1) == '/' && req.path.length > 1) {
        var query = req.url.slice(req.path.length);
        var urlpath = req.path.slice(0, -1);
        var serverurl = config.serverurl;
        if (config.urlpath) serverurl = serverurl.slice(0, -(config.urlpath.length + 1));
        res.redirect(301, serverurl + urlpath + query);
    } else {
        next();
    }
});

// routes need sessions
//template files
app.set('views', __dirname + '/public/views');
//set render engine
app.engine('ejs', ejs.renderFile);
//set view engine
app.set('view engine', 'ejs');
//get index
app.get("/", response.showIndex);
//get 403 forbidden
app.get("/403", function (req, res) {
    response.errorForbidden(res);
});
//get 404 not found
app.get("/404", function (req, res) {
    response.errorNotFound(res);
});
//get 500 internal error
app.get("/500", function (req, res) {
    response.errorInternalError(res);
});
//get status
app.get("/status", function (req, res, next) {
    realtime.getStatus(function (data) {
        res.set({
            'Cache-Control': 'private', // only cache by client
            'X-Robots-Tag': 'noindex, nofollow' // prevent crawling
        });
        res.send(data);
    });
});
//get status
app.get("/temp", function (req, res) {
    var host = req.get('host');
    if (config.alloworigin.indexOf(host) == -1)
        response.errorForbidden(res);
    else {
        var tempid = req.query.tempid;
        if (!tempid)
            response.errorForbidden(res);
        else {
            models.Temp.findOne({
                where: {
                    id: tempid
                }
            }).then(function (temp) {
                if (!temp)
                    response.errorNotFound(res);
                else {
                    res.header("Access-Control-Allow-Origin", "*");
                    res.send({
                        temp: temp.data
                    });
                    temp.destroy().catch(function (err) {
                        if (err)
                            logger.error('remove temp failed: ' + err);
                    });
                }
            }).catch(function (err) {
                logger.error(err);
                return response.errorInternalError(res);
            });
        }
    }
});
//post status
app.post("/temp", urlencodedParser, function (req, res) {
    var host = req.get('host');
    if (config.alloworigin.indexOf(host) == -1)
        response.errorForbidden(res);
    else {
        var data = req.body.data;
        if (!data)
            response.errorForbidden(res);
        else {
            if (config.debug)
                logger.info('SERVER received temp from [' + host + ']: ' + req.body.data);
            models.Temp.create({
                data: data
            }).then(function (temp) {
                if (temp) {
                    res.header("Access-Control-Allow-Origin", "*");
                    res.send({
                        status: 'ok',
                        id: temp.id
                    });
                } else
                    response.errorInternalError(res);
            }).catch(function (err) {
                logger.error(err);
                return response.errorInternalError(res);
            });
        }
    }
});

function setReturnToFromReferer(req) {
    var referer = req.get('referer');
    if (!req.session) req.session = {};
    req.session.returnTo = referer;
}

//facebook auth
if (config.facebook) {
    app.get('/auth/facebook', function (req, res, next) {
        setReturnToFromReferer(req);
        passport.authenticate('facebook')(req, res, next);
    });
    //facebook auth callback
    app.get('/auth/facebook/callback',
        passport.authenticate('facebook', {
            successReturnToOrRedirect: config.serverurl + '/',
            failureRedirect: config.serverurl + '/'
        }));

    app.get('/transferNotes/facebook', function (req, res, next) {
        setReturnToFromReferer(req);
        passport.authenticate('facebook-transferNotes')(req, res, next);
    });
    // facebook auth transferNotes callback
    app.get('/transferNotes/facebook/callback', (req, res, next) => {
        passport.authenticate('facebook-transferNotes', (err, user, info) => {
            if (err) return next(err);
            if (!user) return res.redirect(config.serverurl + '/');
            if(req.isAuthenticated()) {
                note.transferAllNotes(models.Note, req.user.id, user.id)
                .then(() => {
                    return res.redirect(config.serverurl + '/');
                }).catch((err) => {
                    return next(err);
                });
            } else {
                req.logIn(user, function(err) {
                    if (err) return next(err);
                    return res.redirect(config.serverurl + '/');
                });
            }
        })(req, res, next);
    });
}
//twitter auth
if (config.twitter) {
    app.get('/auth/twitter', function (req, res, next) {
        setReturnToFromReferer(req);
        passport.authenticate('twitter')(req, res, next);
    });
    //twitter auth callback
    app.get('/auth/twitter/callback',
        passport.authenticate('twitter', {
            successReturnToOrRedirect: config.serverurl + '/',
            failureRedirect: config.serverurl + '/'
        }));
}
//github auth
if (config.github) {
    app.get('/auth/github', function (req, res, next) {
        setReturnToFromReferer(req);
        passport.authenticate('github')(req, res, next);
    });
    //github auth callback
    app.get('/auth/github/callback',
        passport.authenticate('github', {
            successReturnToOrRedirect: config.serverurl + '/',
            failureRedirect: config.serverurl + '/'
        }));
    //github callback actions
    app.get('/auth/github/callback/:noteId/:action', response.githubActions);
}
//gitlab auth
if (config.gitlab) {
    app.get('/auth/gitlab', function (req, res, next) {
        setReturnToFromReferer(req);
        passport.authenticate('gitlab')(req, res, next);
    });
    //gitlab auth callback
    app.get('/auth/gitlab/callback',
        passport.authenticate('gitlab', {
            successReturnToOrRedirect: config.serverurl + '/',
            failureRedirect: config.serverurl + '/'
        }));
    //gitlab callback actions
    app.get('/auth/gitlab/callback/:noteId/:action', response.gitlabActions);
}
//dropbox auth
if (config.dropbox) {
    app.get('/auth/dropbox', function (req, res, next) {
        setReturnToFromReferer(req);
        passport.authenticate('dropbox-oauth2')(req, res, next);
    });
    //dropbox auth callback
    app.get('/auth/dropbox/callback',
        passport.authenticate('dropbox-oauth2', {
            successReturnToOrRedirect: config.serverurl + '/',
            failureRedirect: config.serverurl + '/'
        }));
}
//google auth
if (config.google) {
    app.get('/auth/google', function (req, res, next) {
        setReturnToFromReferer(req);
        passport.authenticate('google', { scope: ['profile'] })(req, res, next);
    });
    //google auth callback
    app.get('/auth/google/callback',
        passport.authenticate('google', {
            successReturnToOrRedirect: config.serverurl + '/',
            failureRedirect: config.serverurl + '/'
        }));
}
// ldap auth
if (config.ldap) {
    app.post('/auth/ldap', urlencodedParser, function (req, res, next) {
        if (!req.body.username || !req.body.password) return response.errorBadRequest(res);
        setReturnToFromReferer(req);
        passport.authenticate('ldapauth', {
            successReturnToOrRedirect: config.serverurl + '/',
            failureRedirect: config.serverurl + '/',
            failureFlash: true
        })(req, res, next);
    });
}
// email auth
if (config.email) {
    if (config.allowemailregister)
        app.post('/register', urlencodedParser, function (req, res, next) {
            if (!req.body.email || !req.body.password) return response.errorBadRequest(res);
            if (!validator.isEmail(req.body.email)) return response.errorBadRequest(res);
            models.User.findOrCreate({
                where: {
                    email: req.body.email
                },
                defaults: {
                    password: req.body.password
                }
            }).spread(function (user, created) {
                if (user) {
                    if (created) {
                        if (config.debug) logger.info('user registered: ' + user.id);
                        req.flash('info', "You've successfully registered, please signin.");
                    } else {
                        if (config.debug) logger.info('user found: ' + user.id);
                        req.flash('error', "This email has been used, please try another one.");
                    }
                    return res.redirect(config.serverurl + '/');
                }
                req.flash('error', "Failed to register your account, please try again.");
                return res.redirect(config.serverurl + '/');
            }).catch(function (err) {
                logger.error('auth callback failed: ' + err);
                return response.errorInternalError(res);
            });
        });

    app.post('/login', urlencodedParser, function (req, res, next) {
        if (!req.body.email || !req.body.password) return response.errorBadRequest(res);
        if (!validator.isEmail(req.body.email)) return response.errorBadRequest(res);
        setReturnToFromReferer(req);
        passport.authenticate('local', {
            successReturnToOrRedirect: config.serverurl + '/',
            failureRedirect: config.serverurl + '/',
            failureFlash: 'Invalid email or password.'
        })(req, res, next);
    });
}
//logout
app.get('/logout', function (req, res) {
    if (config.debug && req.isAuthenticated())
        logger.info('user logout: ' + req.user.id);
    req.logout();
    res.redirect(config.serverurl + '/');
});
var history = require("./lib/history.js");
//get history
app.get('/history', history.historyGet);
//post history
app.post('/history', urlencodedParser, history.historyPost);
//post history by note id
app.post('/history/:noteId', urlencodedParser, history.historyPost);
//delete history
app.delete('/history', history.historyDelete);
//delete history by note id
app.delete('/history/:noteId', history.historyDelete);
//get me info
app.get('/me', function (req, res) {
    if (req.isAuthenticated()) {
        models.User.findOne({
            where: {
                id: req.user.id
            }
        }).then(function (user) {
            if (!user)
                return response.errorNotFound(res);
            var profile = models.User.getProfile(user);
            res.send({
                status: 'ok',
                id: req.user.id,
                name: profile.name,
                photo: profile.photo
            });
        }).catch(function (err) {
            logger.error('read me failed: ' + err);
            return response.errorInternalError(res);
        });
    } else {
        res.send({
            status: 'forbidden'
        });
    }
});

//upload image
app.post('/uploadimage', function (req, res) {
    var form = new formidable.IncomingForm();

    form.keepExtensions = true;

    if (config.imageUploadType === 'filesystem') {
        form.uploadDir = "public/uploads";
    }

    form.parse(req, function (err, fields, files) {
        if (err || !files.image || !files.image.path) {
            response.errorForbidden(res);
        } else {
            if (config.debug)
                logger.info('SERVER received uploadimage: ' + JSON.stringify(files.image));

            try {
                switch (config.imageUploadType) {
                case 'filesystem':
                    res.send({
                        link: url.resolve(config.serverurl + '/', files.image.path.match(/^public\/(.+$)/)[1])
                    });

                    break;

                case 's3':
                    var AWS = require('aws-sdk');
                    var awsConfig = new AWS.Config(config.s3);
                    var s3 = new AWS.S3(awsConfig);

                    fs.readFile(files.image.path, function (err, buffer) {
                        var params = {
                            Bucket: config.s3bucket,
                            Key: path.join('uploads', path.basename(files.image.path)),
                            Body: buffer
                        };

                        s3.putObject(params, function (err, data) {
                            if (err) {
                                logger.error(err);
                                res.status(500).end('upload image error');
                            } else {
                                res.send({
                                    link: `https://s3-${config.s3.region}.amazonaws.com/${config.s3bucket}/${params.Key}`
                                });
                            }
                        });

                    });

                    break;

                case 'imgur':
                default:
                    imgur.setClientId(config.imgur.clientID);
                    imgur.uploadFile(files.image.path)
                        .then(function (json) {
                            if (config.debug)
                                logger.info('SERVER uploadimage success: ' + JSON.stringify(json));
                            res.send({
                                link: json.data.link.replace(/^http:\/\//i, 'https://')
                            });
                        })
                        .catch(function (err) {
                            logger.error(err);
                            return res.status(500).end('upload image error');
                        });
                    break;
                }
            } catch (err) {
                logger.error(err);
                return res.status(500).end('upload image error');
            }
        }
    });
});
//get new note
app.get("/new", response.newNote);
//get publish note
app.get("/s/:shortid", response.showPublishNote);
//publish note actions
app.get("/s/:shortid/:action", response.publishNoteActions);
//get publish slide
app.get("/p/:shortid", response.showPublishSlide);
//publish slide actions
app.get("/p/:shortid/:action", response.publishSlideActions);
//get note by id
app.get("/:noteId", response.showNote);
//note actions
app.get("/:noteId/:action", response.noteActions);
//note actions with action id
app.get("/:noteId/:action/:actionId", response.noteActions);
// response not found if no any route matches
app.get('*', function (req, res) {
    response.errorNotFound(res);
});

//socket.io secure
io.use(realtime.secure);
//socket.io auth
io.use(passportSocketIo.authorize({
    cookieParser: cookieParser,
    key: config.sessionname,
    secret: config.sessionsecret,
    store: sessionStore,
    success: realtime.onAuthorizeSuccess,
    fail: realtime.onAuthorizeFail
}));
//socket.io heartbeat
io.set('heartbeat interval', config.heartbeatinterval);
io.set('heartbeat timeout', config.heartbeattimeout);
//socket.io connection
io.sockets.on('connection', realtime.connection);

//listen
function startListen() {
    server.listen(config.port, function () {
        var schema = config.usessl ? 'HTTPS' : 'HTTP';
        logger.info('%s Server listening at port %d', schema, config.port);
        config.maintenance = false;
    });
}

// sync db then start listen
models.sequelize.sync().then(function () {
    // check if realtime is ready
    if (realtime.isReady()) {
        models.Revision.checkAllNotesRevision(function (err, notes) {
            if (err) throw new Error(err);
            if (!notes || notes.length <= 0) return startListen();
        });
    } else {
        throw new Error('server still not ready after db synced');
    }
});

// log uncaught exception
process.on('uncaughtException', function (err) {
    logger.error('An uncaught exception has occured.');
    logger.error(err);
    logger.error('Process will exit now.');
    process.exit(1);
});

// install exit handler
function handleTermSignals() {
    config.maintenance = true;
    // disconnect all socket.io clients
    Object.keys(io.sockets.sockets).forEach(function (key) {
        var socket = io.sockets.sockets[key];
        // notify client server going into maintenance status
        socket.emit('maintenance');
        setTimeout(function () {
            socket.disconnect(true);
        }, 0);
    });
    var checkCleanTimer = setInterval(function () {
        if (realtime.isReady()) {
            models.Revision.checkAllNotesRevision(function (err, notes) {
                if (err) return logger.error(err);
                if (!notes || notes.length <= 0) {
                    clearInterval(checkCleanTimer);
                    return process.exit(0);
                }
            });
        }
    }, 100);
}
process.on('SIGINT', handleTermSignals);
process.on('SIGTERM', handleTermSignals);
