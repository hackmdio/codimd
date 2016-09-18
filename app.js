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
var imgur = require('imgur');
var formidable = require('formidable');
var morgan = require('morgan');
var passportSocketIo = require("passport.socketio");
var helmet = require('helmet');
var i18n = require('i18n');

//core
var config = require("./lib/config.js");
var logger = require("./lib/logger.js");
var auth = require("./lib/auth.js");
var response = require("./lib/response.js");
var models = require("./lib/models");

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
    locales: ['en', 'zh', 'fr', 'de', 'ja', 'es'],
    cookie: 'locale',
    directory: __dirname + '/locales'
});

app.use(cookieParser());

app.use(i18n.init);

// routes without sessions
// static files
app.use('/', express.static(__dirname + '/public', { maxAge: config.staticcachetime }));
app.use('/vendor/', express.static(__dirname + '/bower_components', { maxAge: config.staticcachetime }));

//session
app.use(session({
    name: config.sessionname,
    secret: config.sessionsecret,
    resave: false, //don't save session if unmodified
    saveUninitialized: true, //always create session to ensure the origin
    rolling: true, // reset maxAge on every response
    cookie: {
        maxAge: config.sessionlife,
        expires: new Date(Date.now() + config.sessionlife)
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

// redirect url with trailing slashes
app.use(function(req, res, next) {
    if ("GET" == req.method && req.path.substr(-1) == '/' && req.path.length > 1) {
        var query = req.url.slice(req.path.length);
        res.redirect(301, config.serverurl + req.path.slice(0, -1) + query);
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
//logout
app.get('/logout', function (req, res) {
    if (config.debug && req.isAuthenticated())
        logger.info('user logout: ' + req.user.id);
    req.logout();
    res.redirect(config.serverurl + '/');
});
//get history
app.get('/history', function (req, res) {
    if (req.isAuthenticated()) {
        models.User.findOne({
            where: {
                id: req.user.id
            }
        }).then(function (user) {
            if (!user)
                return response.errorNotFound(res);
            var history = [];
            if (user.history)
                history = JSON.parse(user.history);
            res.send({
                history: history
            });
            if (config.debug)
                logger.info('read history success: ' + user.id);
        }).catch(function (err) {
            logger.error('read history failed: ' + err);
            return response.errorInternalError(res);
        });
    } else {
        return response.errorForbidden(res);
    }
});
//post history
app.post('/history', urlencodedParser, function (req, res) {
    if (req.isAuthenticated()) {
        if (config.debug)
            logger.info('SERVER received history from [' + req.user.id + ']: ' + req.body.history);
        models.User.update({
            history: req.body.history
        }, {
            where: {
                id: req.user.id
            }
        }).then(function (count) {
            if (!count)
                return response.errorNotFound(res);
            if (config.debug)
                logger.info("write user history success: " + req.user.id);
        }).catch(function (err) {
            logger.error('write history failed: ' + err);
            return response.errorInternalError(res);
        });
        res.end();
    } else {
        return response.errorForbidden(res);
    }
});
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
            var profile = models.User.parseProfile(user.profile);
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
//upload to imgur
app.post('/uploadimage', function (req, res) {
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        if (err || !files.image || !files.image.path) {
            response.errorForbidden(res);
        } else {
            if (config.debug)
                logger.info('SERVER received uploadimage: ' + JSON.stringify(files.image));
            imgur.setClientId(config.imgur.clientID);
            try {
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
            if (err) return new Error(err);
            if (notes.length <= 0) return startListen();
        });
    }
});

// log uncaught exception
process.on('uncaughtException', function (err) {
    logger.error('An uncaught exception has occured.');
    logger.error(err);
    logger.error('Process will exit now.');
    process.exit(1);
});

// gracefully exit
process.on('SIGINT', function () {
    config.maintenance = true;
    // disconnect all socket.io clients
    Object.keys(io.sockets.sockets).forEach(function (key) {
        var socket = io.sockets.sockets[key];
        // notify client server going into maintenance status
        socket.emit('maintenance');
        socket.disconnect(true);
    });
    var checkCleanTimer = setInterval(function () {
        if (realtime.isReady()) {
            models.Revision.checkAllNotesRevision(function (err, notes) {
                if (err) return new Error(err);
                if (notes.length <= 0) {
                    clearInterval(checkCleanTimer);
                    return process.exit(0);
                }
            });
        }
    }, 100);
});
