//app
//external modules
var express = require('express');
var toobusy = require('toobusy-js');
var ejs = require('ejs');
var passport = require('passport');
var methodOverride = require('method-override');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var compression = require('compression')
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var fs = require('fs');
var shortid = require('shortid');
var imgur = require('imgur');
var formidable = require('formidable');
var morgan = require('morgan');
var passportSocketIo = require("passport.socketio");

//core
var config = require("./config.js");
var logger = require("./lib/logger.js");
var User = require("./lib/user.js");
var Temp = require("./lib/temp.js");
var auth = require("./lib/auth.js");
var response = require("./lib/response.js");

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

// connect to the mongodb
mongoose.connect(process.env.MONGOLAB_URI || config.mongodbstring);

//others
var db = require("./lib/db.js");
var realtime = require("./lib/realtime.js");

//assign socket io to realtime
realtime.io = io;

//methodOverride
app.use(methodOverride('_method'));

// create application/json parser
var jsonParser = bodyParser.json();

// create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({
    extended: false
});

//session store
var sessionStore = new MongoStore({
        mongooseConnection: mongoose.connection,
        touchAfter: config.sessiontouch
    },
    function (err) {
        logger.info(err);
    });

//compression
app.use(compression());

//session
app.use(session({
    name: config.sessionname,
    secret: config.sessionsecret,
    resave: false, //don't save session if unmodified
    saveUninitialized: false, //don't create session until something stored
    cookie: {
        maxAge: new Date(Date.now() + config.sessionlife),
        expires: new Date(Date.now() + config.sessionlife),
    },
    maxAge: new Date(Date.now() + config.sessionlife),
    store: sessionStore
}));

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
    //logger.info('serializeUser: ' + user._id);
    done(null, user._id);
});
passport.deserializeUser(function (id, done) {
    User.model.findById(id, function (err, user) {
        //logger.info(user)
        if (!err) done(null, user);
        else done(err, null);
    })
});

//routes
//static files
app.use('/', express.static(__dirname + '/public'));
//template files
app.set('views', __dirname + '/public');
//set render engine
app.engine('html', ejs.renderFile);
//get index
app.get("/", response.showIndex);
//get status
app.get("/status", function (req, res, next) {
    realtime.getStatus(function (data) {
        res.end(JSON.stringify(data));
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
            Temp.findTemp(tempid, function (err, temp) {
                if (err || !temp)
                    response.errorForbidden(res);
                else {
                    res.header("Access-Control-Allow-Origin", "*");
                    res.send({
                        temp: temp.data
                    });
                    temp.remove(function (err) {
                        if (err)
                            logger.error('remove temp failed: ' + err);
                    });
                }
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
        var id = shortid.generate();
        var data = req.body.data;
        if (!id || !data)
            response.errorForbidden(res);
        else {
            if (config.debug)
                logger.info('SERVER received temp from [' + host + ']: ' + req.body.data);
            Temp.newTemp(id, data, function (err, temp) {
                if (!err && temp) {
                    res.header("Access-Control-Allow-Origin", "*");
                    res.send({
                        status: 'ok',
                        id: temp.id
                    });
                } else
                    response.errorInternalError(res);
            });
        }
    }
});
//facebook auth
app.get('/auth/facebook',
    passport.authenticate('facebook'),
    function (req, res) {});
//facebook auth callback
app.get('/auth/facebook/callback',
    passport.authenticate('facebook', {
        failureRedirect: '/'
    }),
    function (req, res) {
        res.redirect('/');
    });
//twitter auth
app.get('/auth/twitter',
    passport.authenticate('twitter'),
    function (req, res) {});
//twitter auth callback
app.get('/auth/twitter/callback',
    passport.authenticate('twitter', {
        failureRedirect: '/'
    }),
    function (req, res) {
        res.redirect('/');
    });
//github auth
app.get('/auth/github',
    passport.authenticate('github'),
    function (req, res) {});
//github auth callback
app.get('/auth/github/callback',
    passport.authenticate('github', {
        failureRedirect: '/'
    }),
    function (req, res) {
        res.redirect('/');
    });
//dropbox auth
app.get('/auth/dropbox',
    passport.authenticate('dropbox-oauth2'),
    function (req, res) {});
//dropbox auth callback
app.get('/auth/dropbox/callback',
    passport.authenticate('dropbox-oauth2', {
        failureRedirect: '/'
    }),
    function (req, res) {
        res.redirect('/');
    });
//logout
app.get('/logout', function (req, res) {
    if (config.debug && req.session.passport.user)
        logger.info('user logout: ' + req.session.passport.user);
    req.logout();
    res.redirect('/');
});
//get history
app.get('/history', function (req, res) {
    if (req.isAuthenticated()) {
        User.model.findById(req.session.passport.user, function (err, user) {
            if (err) {
                logger.error('read history failed: ' + err);
            } else {
                var history = [];
                if (user.history)
                    history = JSON.parse(user.history);
                res.send({
                    history: history
                });
            }
        });
    } else {
        response.errorForbidden(res);
    }
});
//post history
app.post('/history', urlencodedParser, function (req, res) {
    if (req.isAuthenticated()) {
        if (config.debug)
            logger.info('SERVER received history from [' + req.session.passport.user + ']: ' + req.body.history);
        User.model.findById(req.session.passport.user, function (err, user) {
            if (err) {
                logger.error('write history failed: ' + err);
            } else {
                user.history = req.body.history;
                user.save(function (err) {
                    if (err) {
                        logger.error('write user history failed: ' + err);
                    } else {
                        if (config.debug)
                            logger.info("write user history success: " + user._id);
                    };
                });
            }
        });
        res.end();
    } else {
        response.errorForbidden(res);
    }
});
//get me info
app.get('/me', function (req, res) {
    if (req.isAuthenticated()) {
        User.model.findById(req.session.passport.user, function (err, user) {
            if (err) {
                logger.error('read me failed: ' + err);
            } else {
                var profile = JSON.parse(user.profile);
                res.send({
                    status: 'ok',
                    id: req.session.passport.user,
                    name: profile.displayName || profile.username
                });
            }
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
                            link: json.data.link
                        });
                    })
                    .catch(function (err) {
                        logger.error(err);
                        res.send('upload image error');
                    });
            } catch (err) {
                logger.error(err);
                res.send('upload image error');
            }
        }
    });
});
//get new note
app.get("/new", response.newNote);
//get features
app.get("/features", response.showFeatures);
//get publish note
app.get("/s/:shortid", response.showPublishNote);
//publish note actions
app.get("/s/:shortid/:action", response.publishNoteActions);

//add p
app.get("/p/:shortid", response.showPublishSlide);

//get note by id
app.get("/:noteId", response.showNote);
//note actions
app.get("/:noteId/:action", response.noteActions);

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
if (config.usessl) {
    server.listen(config.sslport, function () {
        logger.info('HTTPS Server listening at sslport %d', config.sslport);
    });
} else {
    server.listen(config.port, function () {
        logger.info('HTTP Server listening at port %d', config.port);
    });
}
process.on('uncaughtException', function (err) {
    logger.error(err);
});
