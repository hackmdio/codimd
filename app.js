'use strict'
// app
// external modules
var express = require('express')

var ejs = require('ejs')
var passport = require('passport')
var methodOverride = require('method-override')
var cookieParser = require('cookie-parser')
var compression = require('compression')
var session = require('express-session')
var SequelizeStore = require('connect-session-sequelize')(session.Store)
var fs = require('fs')
var path = require('path')
var uuid = require('uuid')

var morgan = require('morgan')
var passportSocketIo = require('passport.socketio')
var helmet = require('helmet')
var i18n = require('i18n')
var flash = require('connect-flash')

// core
var config = require('./lib/config')
var logger = require('./lib/logger')
var response = require('./lib/response')
var models = require('./lib/models')

// generate front-end constants by template
var constpath = path.join(__dirname, './public/js/lib/common/constant.ejs')
var data = {
  domain: config.domain,
  urlpath: config.urlpath,
  debug: config.debug,
  version: config.version,
  GOOGLE_API_KEY: config.google.clientSecret,
  GOOGLE_CLIENT_ID: config.google.clientID,
  DROPBOX_APP_KEY: config.dropbox.clientSecret
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
if (config.hsts.enable) {
  app.use(helmet.hsts({
    maxAge: config.hsts.maxAgeSeconds * 1000,
    includeSubdomains: config.hsts.includeSubdomains,
    preload: config.hsts.preload
  }))
} else if (config.usessl) {
  logger.info('Consider enabling HSTS for extra security:')
  logger.info('https://en.wikipedia.org/wiki/HTTP_Strict_Transport_Security')
}

app.use((req, res, next) => {
  res.locals.nonce = uuid.v4()
  next()
})

// use Content-Security-Policy to limit XSS, dangerous plugins, etc.
// https://helmetjs.github.io/docs/csp/
if (config.csp.enable) {
  var cdnDirectives = {
    scriptSrc: ['https://cdnjs.cloudflare.com', 'https://cdn.mathjax.org'],
    styleSrc: ['https://cdnjs.cloudflare.com', 'https://fonts.googleapis.com'],
    fontSrc: ['https://cdnjs.cloudflare.com', 'https://fonts.gstatic.com']
  }
  var directives = {}
  for (var propertyName in config.csp.directives) {
    if (config.csp.directives.hasOwnProperty(propertyName)) {
      var directive = config.csp.directives[propertyName]
      if (config.usecdn && !!cdnDirectives[propertyName]) {
        directive = directive.concat(cdnDirectives[propertyName])
      }
      directives[propertyName] = directive
    }
  }
  directives.scriptSrc.push(function (req, res) { return "'nonce-" + res.locals.nonce + "'" })
  if (config.csp.upgradeInsecureRequests === 'auto') {
    directives.upgradeInsecureRequests = config.usessl === 'true'
  } else {
    directives.upgradeInsecureRequests = config.csp.upgradeInsecureRequests === 'true'
  }
  app.use(helmet.contentSecurityPolicy({
    directives: directives
  }))
} else {
  logger.info('Content-Security-Policy is disabled. This may be a security risk.')
}

i18n.configure({
  locales: ['en', 'zh', 'fr', 'de', 'ja', 'es', 'ca', 'el', 'pt', 'it', 'tr', 'ru', 'nl', 'hr', 'pl', 'uk', 'hi', 'sv', 'eo', 'da'],
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
app.use(require('./lib/web/middleware/tooBusy'))

app.use(flash())

// passport
app.use(passport.initialize())
app.use(passport.session())

// check uri is valid before going further
app.use(require('./lib/web/middleware/checkURIValid'))
// redirect url without trailing slashes
app.use(require('./lib/web/middleware/redirectWithoutTrailingSlashes'))

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
app.use(require('./lib/web/userRouter'))
app.use(require('./lib/web/imageRouter'))
app.use(require('./lib/web/noteRouter'))

// response not found if no any route matxches
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
    realtime.maintenance = false
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
  realtime.maintenance = true
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
