//app
//external modules
var connect = require('connect');
var express = require('express');
var toobusy = require('toobusy-js');
var ejs = require('ejs');
var passport = require('passport');
var methodOverride = require('method-override');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var compression = require('compression')
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);

//core
var config = require("./config.js");
var User = require("./lib/user.js");
var auth = require("./lib/auth.js");
var response = require("./lib/response.js");

//server setup
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var port = process.env.PORT || config.testport;

// connect to the mongodb
if (config.debug)
    mongoose.connect(config.mongodbstring);
else
    mongoose.connect(process.env.MONGOLAB_URI);

//others
var db = require("./lib/db.js");
var realtime = require("./lib/realtime.js");

//methodOverride
app.use(methodOverride('_method'));

// create application/json parser
var jsonParser = bodyParser.json();

// create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({
    extended: false
});

//compression
app.use(compression());

//session
app.use(session({
    name: config.sessionname,
    secret: config.sessionsecret,
    resave: false, //don't save session if unmodified
    saveUninitialized: true, //don't create session until something stored
    cookie: {
        maxAge: new Date(Date.now() + config.sessionlife),
        expires: new Date(Date.now() + config.sessionlife),
    },
    maxAge: new Date(Date.now() + config.sessionlife),
    store: new MongoStore({
            mongooseConnection: mongoose.connection,
            touchAfter: config.sessiontouch
        },
        function (err) {
            console.log(err);
        })
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
    //console.log('serializeUser: ' + user._id);
    done(null, user._id);
});
passport.deserializeUser(function (id, done) {
    User.model.findById(id, function (err, user) {
        //console.log(user)
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
app.get("/", function (req, res, next) {
    res.render("index.html");
});
//get status
app.get("/status", function (req, res, next) {
    realtime.getStatus(function (data) {
        res.end(JSON.stringify(data));
    });
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
        console.log('user logout: ' + req.session.passport.user);
    req.logout();
    res.redirect('/');
});
//get history
app.get('/history', function (req, res) {
    if (req.isAuthenticated()) {
        User.model.findById(req.session.passport.user, function (err, user) {
            if (err) {
                console.log('read history failed: ' + err);
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
            console.log('SERVER received history from [' + req.session.passport.user + ']: ' + req.body.history);
        User.model.findById(req.session.passport.user, function (err, user) {
            if (err) {
                console.log('write history failed: ' + err);
            } else {
                user.history = req.body.history;
                user.save(function (err) {
                    if (err) {
                        console.log('write user history failed: ' + err);
                    } else {
                        if (config.debug)
                            console.log("write user history success: " + user._id);
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
                console.log('read me failed: ' + err);
            } else {
                var profile = JSON.parse(user.profile);
                res.send({
                    status: 'ok',
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
//get new note
app.get("/new", response.newNote);
//get features
app.get("/features", response.showFeatures);
//get note by id
app.get("/:noteId", response.showNote);
//note actions
app.get("/:noteId/:action", response.noteActions);

//socket.io secure
io.use(realtime.secure);
//socket.io heartbeat
io.set('heartbeat interval', config.heartbeatinterval);
io.set('heartbeat timeout', config.heartbeattimeout);
//socket.io connection
io.sockets.on('connection', realtime.connection);

//listen
server.listen(port, function () {
    console.log('Server listening at port %d', port);
});