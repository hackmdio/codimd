'use strict'
// external modules
var fs = require('fs')
var path = require('path')

// configs
var env = process.env.NODE_ENV || 'development'
var config = require(path.join(__dirname, '..', 'config.json'))[env]
var debug = process.env.DEBUG ? (process.env.DEBUG === 'true') : ((typeof config.debug === 'boolean') ? config.debug : (env === 'development'))

// Create function that reads docker secrets but fails fast in case of a non docker environment
var handleDockerSecret = fs.existsSync('/run/secrets/') ? function (secret) {
  return fs.existsSync('/run/secrets/' + secret) ? fs.readFileSync('/run/secrets/' + secret) : null
} : function () {
  return null
}

// url
var domain = process.env.DOMAIN || process.env.HMD_DOMAIN || config.domain || ''
var urlpath = process.env.URL_PATH || process.env.HMD_URL_PATH || config.urlpath || ''
var port = process.env.PORT || process.env.HMD_PORT || config.port || 3000
var alloworigin = process.env.HMD_ALLOW_ORIGIN ? process.env.HMD_ALLOW_ORIGIN.split(',') : (config.alloworigin || ['localhost'])

var usessl = !!config.usessl
var protocolusessl = (usessl === true && typeof process.env.HMD_PROTOCOL_USESSL === 'undefined' && typeof config.protocolusessl === 'undefined')
     ? true : (process.env.HMD_PROTOCOL_USESSL ? (process.env.HMD_PROTOCOL_USESSL === 'true') : !!config.protocolusessl)
var urladdport = process.env.HMD_URL_ADDPORT ? (process.env.HMD_URL_ADDPORT === 'true') : !!config.urladdport

var usecdn = process.env.HMD_USECDN ? (process.env.HMD_USECDN === 'true') : ((typeof config.usecdn === 'boolean') ? config.usecdn : true)

var allowanonymous = process.env.HMD_ALLOW_ANONYMOUS ? (process.env.HMD_ALLOW_ANONYMOUS === 'true') : ((typeof config.allowanonymous === 'boolean') ? config.allowanonymous : true)

var allowfreeurl = process.env.HMD_ALLOW_FREEURL ? (process.env.HMD_ALLOW_FREEURL === 'true') : !!config.allowfreeurl

var permissions = ['editable', 'limited', 'locked', 'protected', 'private']
if (allowanonymous) {
  permissions.unshift('freely')
}

var defaultpermission = process.env.HMD_DEFAULT_PERMISSION || config.defaultpermission
defaultpermission = permissions.indexOf(defaultpermission) !== -1 ? defaultpermission : 'editable'

// db
var dburl = process.env.HMD_DB_URL || process.env.DATABASE_URL || config.dburl
var db = config.db || {}

// ssl path
var sslkeypath = (fs.existsSync('/run/secrets/key.pem') ? '/run/secrets/key.pem' : null) || config.sslkeypath || ''
var sslcertpath = (fs.existsSync('/run/secrets/cert.pem') ? '/run/secrets/cert.pem' : null) || config.sslcertpath || ''
var sslcapath = (fs.existsSync('/run/secrets/ca.pem') ? '/run/secrets/ca.pem' : null) || config.sslcapath || ''
var dhparampath = (fs.existsSync('/run/secrets/dhparam.pem') ? '/run/secrets/dhparam.pem' : null) || config.dhparampath || ''

// other path
var tmppath = config.tmppath || './tmp'
var defaultnotepath = config.defaultnotepath || './public/default.md'
var docspath = config.docspath || './public/docs'
var indexpath = config.indexpath || './public/views/index.ejs'
var hackmdpath = config.hackmdpath || './public/views/hackmd.ejs'
var errorpath = config.errorpath || './public/views/error.ejs'
var prettypath = config.prettypath || './public/views/pretty.ejs'
var slidepath = config.slidepath || './public/views/slide.ejs'

// session
var sessionname = config.sessionname || 'connect.sid'
var sessionsecret = handleDockerSecret('sessionsecret') || config.sessionsecret || 'secret'
var sessionlife = config.sessionlife || 14 * 24 * 60 * 60 * 1000 // 14 days

// static files
var staticcachetime = config.staticcachetime || 1 * 24 * 60 * 60 * 1000 // 1 day

// socket.io
var heartbeatinterval = config.heartbeatinterval || 5000
var heartbeattimeout = config.heartbeattimeout || 10000

// document
var documentmaxlength = config.documentmaxlength || 100000

// image upload setting, available options are imgur/s3/filesystem
var imageUploadType = process.env.HMD_IMAGE_UPLOAD_TYPE || config.imageUploadType || 'imgur'

config.s3 = config.s3 || {}
var s3 = {
  accessKeyId: handleDockerSecret('s3_acccessKeyId') || process.env.HMD_S3_ACCESS_KEY_ID || config.s3.accessKeyId,
  secretAccessKey: handleDockerSecret('s3_secretAccessKey') || process.env.HMD_S3_SECRET_ACCESS_KEY || config.s3.secretAccessKey,
  region: process.env.HMD_S3_REGION || config.s3.region
}
var s3bucket = process.env.HMD_S3_BUCKET || config.s3.bucket

// auth
var facebook = ((process.env.HMD_FACEBOOK_CLIENTID && process.env.HMD_FACEBOOK_CLIENTSECRET) || (fs.existsSync('/run/secrets/facebook_clientID') && fs.existsSync('/run/secrets/facebook_clientSecret'))) ? {
  clientID: handleDockerSecret('facebook_clientID') || process.env.HMD_FACEBOOK_CLIENTID,
  clientSecret: handleDockerSecret('facebook_clientSecret') || process.env.HMD_FACEBOOK_CLIENTSECRET
} : config.facebook || false
var twitter = ((process.env.HMD_TWITTER_CONSUMERKEY && process.env.HMD_TWITTER_CONSUMERSECRET) || (fs.existsSync('/run/secrets/twitter_consumerKey') && fs.existsSync('/run/secrets/twitter_consumerSecret'))) ? {
  consumerKey: handleDockerSecret('twitter_consumerKey') || process.env.HMD_TWITTER_CONSUMERKEY,
  consumerSecret: handleDockerSecret('twitter_consumerSecret') || process.env.HMD_TWITTER_CONSUMERSECRET
} : config.twitter || false
var github = ((process.env.HMD_GITHUB_CLIENTID && process.env.HMD_GITHUB_CLIENTSECRET) || (fs.existsSync('/run/secrets/github_clientID') && fs.existsSync('/run/secrets/github_clientSecret'))) ? {
  clientID: handleDockerSecret('github_clientID') || process.env.HMD_GITHUB_CLIENTID,
  clientSecret: handleDockerSecret('github_clientSecret') || process.env.HMD_GITHUB_CLIENTSECRET
} : config.github || false
var gitlab = ((process.env.HMD_GITLAB_CLIENTID && process.env.HMD_GITLAB_CLIENTSECRET) || (fs.existsSync('/run/secrets/gitlab_clientID') && fs.existsSync('/run/secrets/gitlab_clientSecret'))) ? {
  baseURL: process.env.HMD_GITLAB_BASEURL,
  clientID: handleDockerSecret('gitlab_clientID') || process.env.HMD_GITLAB_CLIENTID,
  clientSecret: handleDockerSecret('gitlab_clientSecret') || process.env.HMD_GITLAB_CLIENTSECRET
} : config.gitlab || false
var dropbox = ((process.env.HMD_DROPBOX_CLIENTID && process.env.HMD_DROPBOX_CLIENTSECRET) || (fs.existsSync('/run/secrets/dropbox_clientID') && fs.existsSync('/run/secrets/dropbox_clientSecret'))) ? {
  clientID: handleDockerSecret('dropbox_clientID') || process.env.HMD_DROPBOX_CLIENTID,
  clientSecret: handleDockerSecret('dropbox_clientSecret') || process.env.HMD_DROPBOX_CLIENTSECRET
} : (config.dropbox && config.dropbox.clientID && config.dropbox.clientSecret && config.dropbox) || false
var google = ((process.env.HMD_GOOGLE_CLIENTID && process.env.HMD_GOOGLE_CLIENTSECRET) ||
              (fs.existsSync('/run/secrets/google_clientID') && fs.existsSync('/run/secrets/google_clientSecret'))) ? {
                clientID: handleDockerSecret('google_clientID') || process.env.HMD_GOOGLE_CLIENTID,
                clientSecret: handleDockerSecret('google_clientSecret') || process.env.HMD_GOOGLE_CLIENTSECRET
              } : (config.google && config.google.clientID && config.google.clientSecret && config.google) || false
var ldap = config.ldap || ((
    process.env.HMD_LDAP_URL ||
    process.env.HMD_LDAP_BINDDN ||
    process.env.HMD_LDAP_BINDCREDENTIALS ||
    process.env.HMD_LDAP_TOKENSECRET ||
    process.env.HMD_LDAP_SEARCHBASE ||
    process.env.HMD_LDAP_SEARCHFILTER ||
    process.env.HMD_LDAP_SEARCHATTRIBUTES ||
    process.env.HMD_LDAP_TLS_CA ||
    process.env.HMD_LDAP_PROVIDERNAME
) ? {} : false)
if (process.env.HMD_LDAP_URL) { ldap.url = process.env.HMD_LDAP_URL }
if (process.env.HMD_LDAP_BINDDN) { ldap.bindDn = process.env.HMD_LDAP_BINDDN }
if (process.env.HMD_LDAP_BINDCREDENTIALS) { ldap.bindCredentials = process.env.HMD_LDAP_BINDCREDENTIALS }
if (process.env.HMD_LDAP_TOKENSECRET) { ldap.tokenSecret = process.env.HMD_LDAP_TOKENSECRET }
if (process.env.HMD_LDAP_SEARCHBASE) { ldap.searchBase = process.env.HMD_LDAP_SEARCHBASE }
if (process.env.HMD_LDAP_SEARCHFILTER) { ldap.searchFilter = process.env.HMD_LDAP_SEARCHFILTER }
if (process.env.HMD_LDAP_SEARCHATTRIBUTES) { ldap.searchAttributes = process.env.HMD_LDAP_SEARCHATTRIBUTES }
if (process.env.HMD_LDAP_TLS_CA) {
  var ca = {
    ca: process.env.HMD_LDAP_TLS_CA.split(',')
  }
  ldap.tlsOptions = ldap.tlsOptions ? Object.assign(ldap.tlsOptions, ca) : ca
  if (Array.isArray(ldap.tlsOptions.ca) && ldap.tlsOptions.ca.length > 0) {
    var i, len, results
    results = []
    for (i = 0, len = ldap.tlsOptions.ca.length; i < len; i++) {
      results.push(fs.readFileSync(ldap.tlsOptions.ca[i], 'utf8'))
    }
    ldap.tlsOptions.ca = results
  }
}
if (process.env.HMD_LDAP_PROVIDERNAME) {
  ldap.providerName = process.env.HMD_LDAP_PROVIDERNAME
}
var imgur = handleDockerSecret('imgur_clientid') || process.env.HMD_IMGUR_CLIENTID || config.imgur || false
var email = process.env.HMD_EMAIL ? (process.env.HMD_EMAIL === 'true') : !!config.email
var allowemailregister = process.env.HMD_ALLOW_EMAIL_REGISTER ? (process.env.HMD_ALLOW_EMAIL_REGISTER === 'true') : ((typeof config.allowemailregister === 'boolean') ? config.allowemailregister : true)

function getserverurl () {
  var url = ''
  if (domain) {
    var protocol = protocolusessl ? 'https://' : 'http://'
    url = protocol + domain
    if (urladdport && ((usessl && port !== 443) || (!usessl && port !== 80))) { url += ':' + port }
  }
  if (urlpath) { url += '/' + urlpath }
  return url
}

var version = '0.5.0'
var minimumCompatibleVersion = '0.5.0'
var maintenance = true
var cwd = path.join(__dirname, '..')

module.exports = {
  version: version,
  minimumCompatibleVersion: minimumCompatibleVersion,
  maintenance: maintenance,
  debug: debug,
  urlpath: urlpath,
  port: port,
  alloworigin: alloworigin,
  usessl: usessl,
  serverurl: getserverurl(),
  usecdn: usecdn,
  allowanonymous: allowanonymous,
  allowfreeurl: allowfreeurl,
  defaultpermission: defaultpermission,
  dburl: dburl,
  db: db,
  sslkeypath: path.join(cwd, sslkeypath),
  sslcertpath: path.join(cwd, sslcertpath),
  sslcapath: path.join(cwd, sslcapath),
  dhparampath: path.join(cwd, dhparampath),
  tmppath: path.join(cwd, tmppath),
  defaultnotepath: path.join(cwd, defaultnotepath),
  docspath: path.join(cwd, docspath),
  indexpath: path.join(cwd, indexpath),
  hackmdpath: path.join(cwd, hackmdpath),
  errorpath: path.join(cwd, errorpath),
  prettypath: path.join(cwd, prettypath),
  slidepath: path.join(cwd, slidepath),
  sessionname: sessionname,
  sessionsecret: sessionsecret,
  sessionlife: sessionlife,
  staticcachetime: staticcachetime,
  heartbeatinterval: heartbeatinterval,
  heartbeattimeout: heartbeattimeout,
  documentmaxlength: documentmaxlength,
  facebook: facebook,
  twitter: twitter,
  github: github,
  gitlab: gitlab,
  dropbox: dropbox,
  google: google,
  ldap: ldap,
  imgur: imgur,
  email: email,
  allowemailregister: allowemailregister,
  imageUploadType: imageUploadType,
  s3: s3,
  s3bucket: s3bucket
}
