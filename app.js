// app
// external modules
var express = require('express')
var toobusy = require('toobusy-js')
var ejs = require('ejs')
var passport = require('passport')
var methodOverride = require('method-override')
var cookieParser = require('cookie-parser')
var compression = require('compression')
var session = require('express-session')
var SequelizeStore = require('connect-session-sequelize')(session.Store)
var fs = require('fs')
var url = require('url')
var path = require('path')
var imgur = require('imgur')
var formidable = require('formidable')
var morgan = require('morgan')
var passportSocketIo = require('passport.socketio')
var helmet = require('helmet')
var i18n = require('i18n')
var flash = require('connect-flash')

// utils
var getImageMimeType = require('./lib/utils.js').getImageMimeType

// core
var config = require('./lib/config.js')
var logger = require('./lib/logger.js')
var response = require('./lib/response.js')
var models = require('./lib/models')

// generate front-end constants by template
var configJson = config.raw
var constpath = path.join(__dirname, './public/js/lib/common/constant.ejs')
var googleApiKey = (fs.existsSync('/run/secrets/google_apiKey') && config.handleDockerSecret('google_apiKey')) || process.env.HMD_GOOGLE_API_KEY || (configJson.google && configJson.google.apiKey) || ''
var googleClientID = (fs.existsSync('/run/secrets/google_clientID') && config.handleDockerSecret('google_clientID')) || process.env.HMD_GOOGLE_CLIENT_ID || (configJson.google && configJson.google.clientID) || ''
var dropboxAppKey = (fs.existsSync('/run/secrets/dropbox_appKey') && config.handleDockerSecret('dropbox_appKey')) || process.env.HMD_DROPBOX_APP_KEY || (configJson.dropbox && configJson.dropbox.appKey) || ''
var data = {
  domain: config.domain,
  urlpath: config.urlpath,
  debug: config.debug,
  version: config.version,
  GOOGLE_API_KEY: googleApiKey,
  GOOGLE_CLIENT_ID: googleClientID,
  DROPBOX_APP_KEY: dropboxAppKey
}
ejs.renderFile(constpath, data, {}, function (err, str) {
  if (err) throw new Error(err)
  fs.writeFileSync(path.join(__dirname, './public/build/constant.js'), str)
})

// server setup
var app = express()
var server = null
if (config.usessl) {
  var ca = (function () {
    var i, len, results
    results = []
    for (i = 0, len = config.sslcapath.length; i < len; i++) {
      results.push(fs.readFileSync(config.sslcapath[i], 'utf8'))
    }
    return results
  })()
  var options = {
    key: fs.readFileSync(config.sslkeypath, 'utf8'),
    cert: fs.readFileSync(config.sslcertpath, 'utf8'),
    ca: ca,
    dhparam: fs.readFileSync(config.dhparampath, 'utf8'),
    requestCert: false,
    rejectUnauthorized: false
  }
  server = require('https').createServer(options, app)
} else {
  server = require('http').createServer(app)
}

// logger
app.use(morgan('combined', {
  'stream': logger
}))

// socket io
var io = require('socket.io')(server)
io.engine.ws = new (require('uws').Server)({
  noServer: true,
  perMessageDeflate: false
})

// others
var realtime = require('./lib/realtime.js')

// assign socket io to realtime
realtime.io = io

// methodOverride
app.use(methodOverride('_method'))

// session store
var sessionStore = new SequelizeStore({
  db: models.sequelize
})

// compression
app.use(compression())

// use hsts to tell https users stick to this
app.use(helmet.hsts({
  maxAge: 31536000 * 1000, // 365 days
  includeSubdomains: true,
  preload: true
}))

i18n.configure({
  locales: ['en', 'zh', 'fr', 'de', 'ja', 'es', 'ca', 'el', 'pt', 'it', 'tr', 'ru', 'nl', 'hr', 'pl', 'uk', 'hi', 'sv', 'eo'],
  cookie: 'locale',
  directory: path.join(__dirname, '/locales')
})

app.use(cookieParser())

app.use(i18n.init)

// routes without sessions
// static files
app.use('/', express.static(path.join(__dirname, '/public'), { maxAge: config.staticcachetime }))

// session
app.use(session({
  name: config.sessionname,
  secret: config.sessionsecret,
  resave: false, // don't save session if unmodified
  saveUninitialized: true, // always create session to ensure the origin
  rolling: true, // reset maxAge on every response
  cookie: {
    maxAge: config.sessionlife
  },
  store: sessionStore
}))

// session resumption
var tlsSessionStore = {}
server.on('newSession', function (id, data, cb) {
  tlsSessionStore[id.toString('hex')] = data
  cb()
})
server.on('resumeSession', function (id, cb) {
  cb(null, tlsSessionStore[id.toString('hex')] || null)
})

// middleware which blocks requests when we're too busy
app.use(function (req, res, next) {
  if (toobusy()) {
    response.errorServiceUnavailable(res)
  } else {
    next()
  }
})

app.use(flash())

// passport
app.use(passport.initialize())
app.use(passport.session())

// serialize and deserialize
passport.serializeUser(function (user, done) {
  logger.info('serializeUser: ' + user.id)
  return done(null, user.id)
})
passport.deserializeUser(function (id, done) {
  models.User.findOne({
    where: {
      id: id
    }
  }).then(function (user) {
    logger.info('deserializeUser: ' + user.id)
    return done(null, user)
  }).catch(function (err) {
    logger.error(err)
    return done(err, null)
  })
})

// check uri is valid before going further
app.use(require('./lib/web/middleware/checkURiValid'))

// redirect url without trailing slashes
app.use(require('./lib/web/middleware/redirectwithoutTrailingSlashes'))

// routes need sessions
// template files
app.set('views', path.join(__dirname, '/public/views'))
// set render engine
app.engine('ejs', ejs.renderFile)
// set view engine
app.set('view engine', 'ejs')

app.use(require('./lib/web/baseRouter'))
app.use(require('./lib/web/statusRouter'))
app.use(require('./lib/web/auth'))
app.use(require('./lib/web/historyRouter'))

// get me info
app.get('/me', function (req, res) {
  if (req.isAuthenticated()) {
    models.User.findOne({
      where: {
        id: req.user.id
      }
    }).then(function (user) {
      if (!user) { return response.errorNotFound(res) }
      var profile = models.User.getProfile(user)
      res.send({
        status: 'ok',
        id: req.user.id,
        name: profile.name,
        photo: profile.photo
      })
    }).catch(function (err) {
      logger.error('read me failed: ' + err)
      return response.errorInternalError(res)
    })
  } else {
    res.send({
      status: 'forbidden'
    })
  }
})

// upload image
app.post('/uploadimage', function (req, res) {
  var form = new formidable.IncomingForm()

  form.keepExtensions = true

  if (config.imageUploadType === 'filesystem') {
    form.uploadDir = 'public/uploads'
  }

  form.parse(req, function (err, fields, files) {
    if (err || !files.image || !files.image.path) {
      response.errorForbidden(res)
    } else {
      if (config.debug) { logger.info('SERVER received uploadimage: ' + JSON.stringify(files.image)) }

      try {
        switch (config.imageUploadType) {
          case 'filesystem':
            res.send({
              link: url.resolve(config.serverurl + '/', files.image.path.match(/^public\/(.+$)/)[1])
            })

            break

          case 's3':
            var AWS = require('aws-sdk')
            var awsConfig = new AWS.Config(config.s3)
            var s3 = new AWS.S3(awsConfig)

            fs.readFile(files.image.path, function (err, buffer) {
              if (err) {
                logger.error(err)
                res.status(500).end('upload image error')
                return
              }
              var params = {
                Bucket: config.s3bucket,
                Key: path.join('uploads', path.basename(files.image.path)),
                Body: buffer
              }

              var mimeType = getImageMimeType(files.image.path)
              if (mimeType) { params.ContentType = mimeType }

              s3.putObject(params, function (err, data) {
                if (err) {
                  logger.error(err)
                  res.status(500).end('upload image error')
                  return
                }
                res.send({
                  link: `https://s3-${config.s3.region}.amazonaws.com/${config.s3bucket}/${params.Key}`
                })
              })
            })
            break
          case 'imgur':
          default:
            imgur.setClientId(config.imgur.clientID)
            imgur.uploadFile(files.image.path)
              .then(function (json) {
                if (config.debug) { logger.info('SERVER uploadimage success: ' + JSON.stringify(json)) }
                res.send({
                  link: json.data.link.replace(/^http:\/\//i, 'https://')
                })
              })
              .catch(function (err) {
                logger.error(err)
                return res.status(500).end('upload image error')
              })
            break
        }
      } catch (err) {
        logger.error(err)
        return res.status(500).end('upload image error')
      }
    }
  })
})
// get new note
app.get('/new', response.newNote)
// get publish note
app.get('/s/:shortid', response.showPublishNote)
// publish note actions
app.get('/s/:shortid/:action', response.publishNoteActions)
// get publish slide
app.get('/p/:shortid', response.showPublishSlide)
// publish slide actions
app.get('/p/:shortid/:action', response.publishSlideActions)
// get note by id
app.get('/:noteId', response.showNote)
// note actions
app.get('/:noteId/:action', response.noteActions)
// note actions with action id
app.get('/:noteId/:action/:actionId', response.noteActions)
// response not found if no any route matches
app.get('*', function (req, res) {
  response.errorNotFound(res)
})

// socket.io secure
io.use(realtime.secure)
// socket.io auth
io.use(passportSocketIo.authorize({
  cookieParser: cookieParser,
  key: config.sessionname,
  secret: config.sessionsecret,
  store: sessionStore,
  success: realtime.onAuthorizeSuccess,
  fail: realtime.onAuthorizeFail
}))
// socket.io heartbeat
io.set('heartbeat interval', config.heartbeatinterval)
io.set('heartbeat timeout', config.heartbeattimeout)
// socket.io connection
io.sockets.on('connection', realtime.connection)

// listen
function startListen () {
  server.listen(config.port, function () {
    var schema = config.usessl ? 'HTTPS' : 'HTTP'
    logger.info('%s Server listening at port %d', schema, config.port)
    config.maintenance = false
  })
}

// sync db then start listen
models.sequelize.sync().then(function () {
  // check if realtime is ready
  if (realtime.isReady()) {
    models.Revision.checkAllNotesRevision(function (err, notes) {
      if (err) throw new Error(err)
      if (!notes || notes.length <= 0) return startListen()
    })
  } else {
    throw new Error('server still not ready after db synced')
  }
})

// log uncaught exception
process.on('uncaughtException', function (err) {
  logger.error('An uncaught exception has occured.')
  logger.error(err)
  logger.error('Process will exit now.')
  process.exit(1)
})

// install exit handler
function handleTermSignals () {
  logger.info('hackmd has been killed by signal, try to exit gracefully...')
  config.maintenance = true
  // disconnect all socket.io clients
  Object.keys(io.sockets.sockets).forEach(function (key) {
    var socket = io.sockets.sockets[key]
    // notify client server going into maintenance status
    socket.emit('maintenance')
    setTimeout(function () {
      socket.disconnect(true)
    }, 0)
  })
  var checkCleanTimer = setInterval(function () {
    if (realtime.isReady()) {
      models.Revision.checkAllNotesRevision(function (err, notes) {
        if (err) return logger.error(err)
        if (!notes || notes.length <= 0) {
          clearInterval(checkCleanTimer)
          return process.exit(0)
        }
      })
    }
  }, 100)
}
process.on('SIGINT', handleTermSignals)
process.on('SIGTERM', handleTermSignals)
process.on('SIGQUIT', handleTermSignals)
