
'use strict'

const fs = require('fs')
const path = require('path')
const {merge} = require('lodash')
const deepFreeze = require('deep-freeze')
const {Environment, Permission} = require('./enum')
const logger = require('../logger')

const appRootPath = path.join(__dirname, '../../')
const env = process.env.NODE_ENV || Environment.development
const debugConfig = {
  debug: (env === Environment.development)
}

// Get version string from package.json
const {version} = require(path.join(appRootPath, 'package.json'))

const packageConfig = {
  version: version,
  minimumCompatibleVersion: '0.5.0'
}

const configFilePath = path.join(appRootPath, 'config.json')
const fileConfig = fs.existsSync(configFilePath) ? require(configFilePath)[env] : undefined

let config = require('./default')
merge(config, require('./defaultSSL'))
merge(config, require('./oldDefault'))
merge(config, debugConfig)
merge(config, packageConfig)
merge(config, fileConfig)
merge(config, require('./oldEnvironment'))
merge(config, require('./environment'))
merge(config, require('./dockerSecret'))

// load LDAP CA
if (config.ldap.tlsca) {
  let ca = config.ldap.tlsca.split(',')
  let caContent = []
  for (let i of ca) {
    if (fs.existsSync(i)) {
      caContent.push(fs.readFileSync(i, 'utf8'))
    }
  }
  let tlsOptions = {
    ca: caContent
  }
  config.ldap.tlsOptions = config.ldap.tlsOptions ? Object.assign(config.ldap.tlsOptions, tlsOptions) : tlsOptions
}

// Permission
config.permission = Permission
if (!config.allowAnonymous && !config.allowAnonymousedits) {
  delete config.permission.freely
}
if (!(config.defaultPermission in config.permission)) {
  config.defaultPermission = config.permission.editable
}

// cache result, cannot change config in runtime!!!
config.isStandardHTTPsPort = (function isStandardHTTPsPort () {
  return config.useSSL && config.port === 443
})()
config.isStandardHTTPPort = (function isStandardHTTPPort () {
  return !config.useSSL && config.port === 80
})()

// cache serverURL
config.serverURL = (function getserverurl () {
  var url = ''
  if (config.domain) {
    var protocol = config.protocolUseSSL ? 'https://' : 'http://'
    url = protocol + config.domain
    if (config.urlAddPort) {
      if (!config.isStandardHTTPPort || !config.isStandardHTTPsPort) {
        url += ':' + config.port
      }
    }
  }
  if (config.urlPath) {
    url += '/' + config.urlPath
  }
  return url
})()

config.Environment = Environment

// auth method
config.isFacebookEnable = config.facebook.clientID && config.facebook.clientSecret
config.isGoogleEnable = config.google.clientID && config.google.clientSecret
config.isDropboxEnable = config.dropbox.clientID && config.dropbox.clientSecret
config.isTwitterEnable = config.twitter.consumerKey && config.twitter.consumerSecret
config.isEmailEnable = config.email
config.isGitHubEnable = config.github.clientID && config.github.clientSecret
config.isGitLabEnable = config.gitlab.clientID && config.gitlab.clientSecret
config.isMattermostEnable = config.mattermost.clientID && config.mattermost.clientSecret
config.isLDAPEnable = config.ldap.url
config.isSAMLEnable = config.saml.idpSsoUrl
config.isPDFExportEnable = config.allowPDFExport

// merge legacy values
let keys = Object.keys(config)
const uppercase = /[A-Z]/
for (let i = keys.length; i--;) {
  let lowercaseKey = keys[i].toLowerCase()
  // if the config contains uppercase letters
  // and a lowercase version of this setting exists
  // and the config with uppercase is not set
  // we set the new config using the old key.
  if (uppercase.test(keys[i]) &&
  config[lowercaseKey] !== undefined &&
  fileConfig[keys[i]] === undefined) {
    logger.warn('config.js contains deprecated lowercase setting for ' + keys[i] + '. Please change your config.js file to replace ' + lowercaseKey + ' with ' + keys[i])
    config[keys[i]] = config[lowercaseKey]
  }
}

// Validate upload upload providers
if (['filesystem', 's3', 'minio', 'imgur'].indexOf(config.imageUploadType) === -1) {
  logger.error('"imageuploadtype" is not correctly set. Please use "filesystem", "s3", "minio" or "imgur". Defaulting to "imgur"')
  config.imageUploadType = 'imgur'
}

// figure out mime types for image uploads
switch (config.imageUploadType) {
  case 'imgur':
    config.allowedUploadMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'image/gif'
    ]
    break
  default:
    config.allowedUploadMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'image/gif',
      'image/svg+xml'
    ]
}

// generate correct path
config.sslCAPath.forEach(function (capath, i, array) {
  array[i] = path.resolve(appRootPath, capath)
})

config.sslCertPath = path.join(appRootPath, config.sslCertPath)
config.sslKeyPath = path.join(appRootPath, config.sslKeyPath)
config.dhParamPath = path.join(appRootPath, config.dhParamPath)

config.tmpPath = path.join(appRootPath, config.tmpPath)
config.defaultNotePath = path.join(appRootPath, config.defaultNotePath)
config.docsPath = path.join(appRootPath, config.docsPath)
config.indexPath = path.join(appRootPath, config.indexPath)
config.hackmdPath = path.join(appRootPath, config.hackmdPath)
config.errorPath = path.join(appRootPath, config.errorPath)
config.prettyPath = path.join(appRootPath, config.prettyPath)
config.slidePath = path.join(appRootPath, config.slidePath)

// make config readonly
config = deepFreeze(config)

module.exports = config
