'use strict'
console.log('Starting app.js with Node version:', process.version) // Removed semicolon
// app
// external modules
var express = require('express')

var ejs = require('ejs')
var passport = require('passport')
var methodOverride = require('method-override')
var cookieParser = require('cookie-parser')
var session = require('express-session')
var SequelizeStore = require('connect-session-sequelize')(session.Store)
var fs = require('fs')
var path = require('path')

var morgan = require('morgan')
var passportSocketIo = require('passport.socketio')
var helmet = require('helmet')
var i18n = require('i18n')
var flash = require('connect-flash')
var apiMetrics = require('prometheus-api-metrics')

// core
var config = require('./lib/config')
var logger = require('./lib/logger')
var response = require('./lib/response')
var models = require('./lib/models')
var csp = require('./lib/csp')
var realtime = require('./lib/realtime/realtime.js') // Moved require to top
const { Environment } = require('./lib/config/enum')

const { versionCheckMiddleware, checkVersion } = require('./lib/web/middleware/checkVersion')
const viteHelpers = require('./lib/vite-helpers') // Add Vite helpers
// Removed proxy middleware require

function createHttpServer (expressApp) { // Pass app instance
  if (config.useSSL) {
    const ca = (function () {
      let i, len
      const results = []
      for (i = 0, len = config.sslCAPath.length; i < len; i++) {
        results.push(fs.readFileSync(config.sslCAPath[i], 'utf8'))
      }
      return results
    })()
    const options = {
      key: fs.readFileSync(config.sslKeyPath, 'utf8'),
      cert: fs.readFileSync(config.sslCertPath, 'utf8'),
      ca: ca,
      dhparam: fs.readFileSync(config.dhParamPath, 'utf8'),
      requestCert: false,
      rejectUnauthorized: false
    }
    return require('https').createServer(options, expressApp) // Use passed app
  } else {
    return require('http').createServer(expressApp) // Use passed app
  }
}

let io = null // Declare io in the top-level scope

// Wrap main setup in an async function to await Vite
async function initializeApp () {
  const app = express() // Create app instance inside async function
  // Removed inner io declaration

  // Create and add Vite middleware first in development
  let viteServer = null
  if (process.env.NODE_ENV !== 'production') {
    logger.info('Setting up Vite in development mode...')
    try {
      const vite = require('vite')
      viteServer = await vite.createServer({
        server: {
          middlewareMode: true,
          fs: {
            strict: true, // Strict file serving
            allow: [__dirname] // Only allow serving from the project root
          }
        },
        appType: 'custom',
        root: __dirname,
        base: '/.vite/' // Set custom base path for Vite assets
      })

      // Only use Vite middleware for paths that start with /.vite/
      app.use((req, res, next) => {
        if (req.path.startsWith('/.vite/')) {
          return viteServer.middlewares(req, res, next)
        }
        next()
      })

      logger.info('Vite middleware enabled for /.vite/ path only.')
    } catch (e) {
      logger.error('Failed to create Vite server:', e)
      process.exit(1)
    }
  }

  const server = createHttpServer(app) // Create server *after* potential Vite setup

  // Attach Vite HMR to the HTTP server
  if (viteServer) {
    viteServer.httpServer = server
  }

  // --- Start of original middleware setup ---

  // API and process monitoring with Prometheus for Node.js micro-service
  app.use(apiMetrics({
    metricsPath: '/metrics/router',
    excludeRoutes: ['/metrics/codimd']
  }))

  // logger
  app.use(morgan('combined', {
    stream: logger.stream
  }))

  // socket io
  io = require('socket.io')(server) // Initialize io here
  io.engine.ws = new (require('ws').Server)({
    noServer: true,
    perMessageDeflate: false
  })

  // assign socket io to realtime
  realtime.io = io

  // methodOverride
  app.use(methodOverride('_method'))

  // session store
  var sessionStore = new SequelizeStore({
    db: models.sequelize
  })

  // HSTS, Referrer Policy, CSP, i18n, cookieParser, static files...
  // (Keep all existing middleware setup here)
  if (config.hsts.enable) {
    app.use(helmet.hsts({
      maxAge: config.hsts.maxAgeSeconds,
      includeSubdomains: config.hsts.includeSubdomains,
      preload: config.hsts.preload
    }))
  } else if (config.useSSL) {
    logger.info('Consider enabling HSTS for extra security:')
    logger.info('https://en.wikipedia.org/wiki/HTTP_Strict_Transport_Security')
  }

  app.use(
    helmet.referrerPolicy({
      policy: 'same-origin'
    })
  )

  app.use(csp.addNonceToLocals)

  if (config.csp.enable) {
    app.use(helmet.contentSecurityPolicy({
      directives: csp.computeDirectives()
    }))
  } else {
    logger.info('Content-Security-Policy is disabled. This may be a security risk.')
  }

  i18n.configure({
    locales: ['en', 'zh-CN', 'zh-TW', 'fr', 'de', 'ja', 'es', 'ca', 'el', 'pt', 'it', 'tr', 'ru', 'nl', 'hr', 'pl', 'uk', 'hi', 'sv', 'eo', 'da', 'ko', 'id', 'sr'],
    cookie: 'locale',
    directory: path.join(__dirname, '/locales'),
    updateFiles: config.updateI18nFiles
  })

  app.use(cookieParser())

  app.use(i18n.init)

  // routes without sessions
  app.use('/', express.static(path.join(__dirname, '/public'), { maxAge: config.staticCacheTime, index: false }))
  app.use('/docs', express.static(path.resolve(__dirname, config.docsPath), { maxAge: config.staticCacheTime }))
  app.use('/uploads', express.static(path.resolve(__dirname, config.uploadsPath), { maxAge: config.staticCacheTime }))
  app.use('/default.md', express.static(path.resolve(__dirname, config.defaultNotePath), { maxAge: config.staticCacheTime }))
  app.use(require('./lib/metrics').router)

  // session
  app.use(session({
    name: config.sessionName,
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: true,
    rolling: true,
    cookie: {
      maxAge: config.sessionLife
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

  app.use(require('./lib/middleware/tooBusy'))
  app.use(flash())
  app.use(passport.initialize())
  app.use(passport.session())
  app.use(require('./lib/middleware/checkURIValid'))
  app.use(require('./lib/middleware/redirectWithoutTrailingSlashes'))
  app.use(require('./lib/middleware/codiMDVersion'))

  if (config.autoVersionCheck && process.env.NODE_ENV === Environment.production) {
    checkVersion(app)
    app.use(versionCheckMiddleware)
  }

  // routes need sessions
  app.set('views', config.viewPath)
  app.engine('ejs', ejs.renderFile)
  app.set('view engine', 'ejs')
  app.locals.useCDN = config.useCDN
  app.locals.serverURL = config.serverURL
  app.locals.sourceURL = config.sourceURL
  app.locals.privacyPolicyURL = config.privacyPolicyURL
  app.locals.allowAnonymous = config.allowAnonymous
  app.locals.allowAnonymousEdits = config.allowAnonymousEdits
  app.locals.permission = config.permission
  app.locals.allowPDFExport = config.allowPDFExport
  app.locals.authProviders = {
    facebook: config.isFacebookEnable,
    twitter: config.isTwitterEnable,
    github: config.isGitHubEnable,
    bitbucket: config.isBitbucketEnable,
    gitlab: config.isGitLabEnable,
    mattermost: config.isMattermostEnable,
    dropbox: config.isDropboxEnable,
    google: config.isGoogleEnable,
    ldap: config.isLDAPEnable,
    ldapProviderName: config.ldap.providerName,
    saml: config.isSAMLEnable,
    oauth2: config.isOAuth2Enable,
    oauth2ProviderName: config.oauth2.providerName,
    openID: config.isOpenIDEnable,
    email: config.isEmailEnable,
    allowEmailRegister: config.allowEmailRegister
  }
  app.locals.versionInfo = {
    latest: true,
    versionItem: null
  }
  app.locals.viteAssets = viteHelpers.getViteAssets
  app.locals.generateTags = viteHelpers.generateTags
  app.locals.generateCssOrderFixer = viteHelpers.generateCssOrderFixer
  app.locals.enableDropBoxSave = config.isDropboxEnable
  app.locals.enableGitHubGist = config.isGitHubEnable
  app.locals.enableGitlabSnippets = config.isGitlabSnippetsEnable

  app.use(require('./lib/routes').router)

  app.get('*', function (req, res) {
    response.errorNotFound(req, res)
  })

  // socket.io secure & auth
  io.use(realtime.secure)
  io.use(passportSocketIo.authorize({
    cookieParser: cookieParser,
    key: config.sessionName,
    secret: config.sessionSecret,
    store: sessionStore,
    success: realtime.onAuthorizeSuccess,
    fail: realtime.onAuthorizeFail
  }))
  io.set('heartbeat interval', config.heartbeatInterval)
  io.set('heartbeat timeout', config.heartbeatTimeout)
  io.sockets.on('connection', realtime.connection)

  // --- End of original middleware setup ---

  // sync db first
  await models.sequelize.sync()

  // check if realtime is ready
  if (!realtime.isReady()) {
    throw new Error('Realtime is not ready after db synced')
  }

  // Check revisions before starting listen
  await new Promise((resolve, reject) => {
    models.Revision.checkAllNotesRevision(function (err, notes) {
      if (err) return reject(err)
      resolve()
    })
  })

  // Now start listening
  startListen(server) // Pass server instance
}

// listen (modified to accept server instance)
function startListen (httpServer) {
  var address
  var listenCallback = function () {
    var schema = config.useSSL ? 'HTTPS' : 'HTTP'
    logger.info('%s Server listening at %s', schema, address)
    realtime.maintenance = false
  }

  if (config.path) {
    address = config.path
    httpServer.listen(config.path, listenCallback) // Use passed server
  } else {
    address = config.host + ':' + config.port
    httpServer.listen(config.port, config.host, listenCallback) // Use passed server
  }
}

// Call the async initialization function
initializeApp().catch(err => {
  logger.error('Application initialization failed:')
  logger.error(err.stack)
  logger.error('Process will exit now.')
  process.exit(1)
})

// log uncaught exception
process.on('uncaughtException', function (err) {
  logger.error('An uncaught exception has occured.')
  logger.error(err)
  console.error(err)
  logger.error('Process will exit now.')
  process.exit(1)
})

// install exit handler
function handleTermSignals () {
  logger.info('CodiMD has been killed by signal, try to exit gracefully...')
  realtime.maintenance = true
  realtime.terminate()
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
  setTimeout(() => {
    process.exit(1)
  }, 5000)
}
process.on('SIGINT', handleTermSignals)
process.on('SIGTERM', handleTermSignals)
process.on('SIGQUIT', handleTermSignals)
