// app
// external modules
import fs from "fs";
import path from "path";

import express from "express";
import ejs from "ejs";
import passport from "passport";
import methodOverride from "method-override";
import cookieParser from "cookie-parser";
import session from "express-session";
import morgan from "morgan";
import helmet from "helmet";
import i18n from "i18n";
import flash from "connect-flash";
import {expressMiddleware as expressPrometheusMetricsMiddleware} from "prometheus-api-metrics";
import connectSessionSequelize from 'connect-session-sequelize'
import passportSocketIo from 'passport.socketio'
import SocketIo from 'socket.io'
import {Server as WsServer} from 'ws'
// core
import config from "./config";
import {logger} from "./logger";
import * as response from "./response";
import * as models from "./models";
import * as csp from "./csp";
import {Environment} from "./config/enum";

import {checkVersion, versionCheckMiddleware} from "./web/middleware/checkVersion";
import TooBusyMiddleware from './middleware/tooBusy'
import CheckURIValidMiddleware from './middleware/checkURIValid'
import RedirectWithoutTrailingSlashesMiddleware from './middleware/redirectWithoutTrailingSlashes'
import CodiMDVersionMiddleware from './middleware/codiMDVersion'

import {router as MetricsRouter} from './metrics'
import {router as MainRouter} from './routes'

import * as realtime from './realtime/realtime'

const SequelizeStore = connectSessionSequelize(session.Store)

function createHttpServer() {
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
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('https').createServer(options, app)
  } else {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('http').createServer(app)
  }
}

// server setup
const app = express()
const server = createHttpServer()

// API and process monitoring with Prometheus for Node.js micro-service
app.use(expressPrometheusMetricsMiddleware({
  metricsPath: '/metrics/router',
  excludeRoutes: ['/metrics/codimd']
}))

// logger
const morganLogType = config.env === config.Environment.development ? 'dev' : 'combined'
app.use(morgan(morganLogType, {
  stream: logger.morganLog,
}))

// socket io


const io = SocketIo(server)
io.engine.ws = new WsServer({
  noServer: true,
  perMessageDeflate: false
})

// others

// assign socket io to realtime
realtime.setSocketIo(io)

// methodOverride
app.use(methodOverride('_method'))

// session store
const sessionStore = new SequelizeStore({
  db: models.sequelize
})

// use hsts to tell https users stick to this
if (config.hsts.enable) {
  app.use(helmet.hsts({
    maxAge: config.hsts.maxAgeSeconds,
    includeSubDomains: config.hsts.includeSubdomains,
    preload: config.hsts.preload
  }))
} else if (config.useSSL) {
  logger.info('Consider enabling HSTS for extra security:')
  logger.info('https://en.wikipedia.org/wiki/HTTP_Strict_Transport_Security')
}

// Add referrer policy to improve privacy
app.use(
  helmet.referrerPolicy({
    policy: 'same-origin'
  })
)

// Generate a random nonce per request, for CSP with inline scripts
app.use(csp.addNonceToLocals)

// use Content-Security-Policy to limit XSS, dangerous plugins, etc.
// https://helmetjs.github.io/docs/csp/
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
  directory: path.join(__dirname, '../locales'),
  updateFiles: config.updateI18nFiles
})

app.use(cookieParser())

app.use(i18n.init)

// routes without sessions
// static files
app.use('/', express.static(path.join(__dirname, '../public'), {maxAge: config.staticCacheTime, index: false}))
app.use('/docs', express.static(path.resolve(__dirname, config.docsPath), {maxAge: config.staticCacheTime}))
app.use('/uploads', express.static(path.resolve(__dirname, config.uploadsPath), {maxAge: config.staticCacheTime}))
app.use('/default.md', express.static(path.resolve(__dirname, config.defaultNotePath), {maxAge: config.staticCacheTime}))
app.use(MetricsRouter)

// session
app.use(session({
  name: config.sessionName,
  secret: config.sessionSecret,
  resave: false, // don't save session if unmodified
  saveUninitialized: true, // always create session to ensure the origin
  rolling: true, // reset maxAge on every response
  cookie: {
    maxAge: config.sessionLife
  },
  store: sessionStore
}))

// session resumption
const tlsSessionStore = {}
server.on('newSession', function (id: Buffer, data, cb) {
  tlsSessionStore[id.toString('hex')] = data
  cb()
})
server.on('resumeSession', function (id: Buffer, cb) {
  cb(null, tlsSessionStore[id.toString('hex')] || null)
})

// middleware which blocks requests when we're too busy
app.use(TooBusyMiddleware)

app.use(flash())

// passport
app.use(passport.initialize())
app.use(passport.session())

// check uri is valid before going further
app.use(CheckURIValidMiddleware)
// redirect url without trailing slashes
app.use(RedirectWithoutTrailingSlashesMiddleware)
app.use(CodiMDVersionMiddleware)

if (config.autoVersionCheck && process.env.NODE_ENV === Environment.production) {
  checkVersion(app)
  app.use(versionCheckMiddleware)
}

// routes need sessions
// template files
app.set('views', config.viewPath)
// set render engine
app.engine('ejs', ejs.renderFile)
// set view engine
app.set('view engine', 'ejs')
// set generally available variables for all views
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

// Export/Import menu items
app.locals.enableDropBoxSave = config.isDropboxEnable
app.locals.enableGitHubGist = config.isGitHubEnable
app.locals.enableGitlabSnippets = config.isGitlabSnippetsEnable

app.use(MainRouter)

// response not found if no any route matxches
app.get('*', function (req, res) {
  response.errorNotFound(req, res)
})

// socket.io secure
io.use(realtime.secure)
// socket.io auth
io.use(passportSocketIo.authorize({
  cookieParser: cookieParser,
  key: config.sessionName,
  secret: config.sessionSecret,
  store: sessionStore,
  success: realtime.onAuthorizeSuccess,
  fail: realtime.onAuthorizeFail
}))
// socket.io heartbeat
io.set('heartbeat interval', config.heartbeatInterval)
io.set('heartbeat timeout', config.heartbeatTimeout)
// socket.io connection
io.sockets.on('connection', realtime.connection)

// listen
function startListen() {
  let address
  const listenCallback = function () {
    const schema = config.useSSL ? 'HTTPS' : 'HTTP'
    logger.info('%s Server listening at %s', schema, address)
    realtime.setMaintenance(false)
  }

  // use unix domain socket if 'path' is specified
  if (config.path) {
    address = config.path
    server.listen(config.path, listenCallback)
  } else {
    address = config.host + ':' + config.port
    server.listen(config.port, config.host, listenCallback)
  }
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
}).catch(err => {
  logger.error('Can\'t sync database')
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
function handleTermSignals() {
  logger.info('CodiMD has been killed by signal, try to exit gracefully...')
  realtime.setMaintenance(true)
  realtime.terminate()
  // disconnect all socket.io clients
  Object.keys(io.sockets.sockets).forEach(function (key) {
    const socket = io.sockets.sockets[key]
    // notify client server going into maintenance status
    socket.emit('maintenance')
    setTimeout(function () {
      socket.disconnect(true)
    }, 0)
  })
  const checkCleanTimer = setInterval(function () {
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
