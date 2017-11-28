
'use strict'

const fs = require('fs')
const path = require('path')
const {merge} = require('lodash')
const deepFreeze = require('deep-freeze')
const {Environment, Permission} = require('./enum')

const appRootPath = path.join(__dirname, '../../')
const env = process.env.NODE_ENV || Environment.development
const debugConfig = {
  debug: (env === Environment.development)
}

const packageConfig = {
  version: '0.5.1',
  minimumCompatibleVersion: '0.5.0'
}

const configFilePath = path.join(__dirname, '../../config.json')
const fileConfig = fs.existsSync(configFilePath) ? require(configFilePath)[env] : undefined

let config = require('./default')
merge(config, require('./defaultSSL'))
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
if (!config.allowanonymous) {
  delete config.permission.freely
}
if (!(config.defaultpermission in config.permission)) {
  config.defaultpermission = config.permission.editable
}

// cache result, cannot change config in runtime!!!
config.isStandardHTTPsPort = (function isStandardHTTPsPort () {
  return config.usessl && config.port === 443
})()
config.isStandardHTTPPort = (function isStandardHTTPPort () {
  return !config.usessl && config.port === 80
})()

// cache serverURL
config.serverurl = (function getserverurl () {
  var url = ''
  if (config.domain) {
    var protocol = config.protocolusessl ? 'https://' : 'http://'
    url = protocol + config.domain
    if (config.urladdport) {
      if (!config.isStandardHTTPPort || !config.isStandardHTTPsPort) {
        url += ':' + config.port
      }
    }
  }
  if (config.urlpath) {
    url += '/' + config.urlpath
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
config.isPDFExportEnable = config.allowpdfexport

// generate correct path
config.sslcapath = (function () {
  var i, len, results
  results = []
  for (i = 0, len = config.sslcapath.length; i < len; i++) {
    results.push(path.resolve(appRootPath, config.sslcapath[i]))
  }
  return results
})()

config.sslcertpath = path.join(appRootPath, config.sslcertpath)
config.sslkeypath = path.join(appRootPath, config.sslkeypath)
config.dhparampath = path.join(appRootPath, config.dhparampath)

config.tmppath = path.join(appRootPath, config.tmppath)
config.defaultnotepath = path.join(appRootPath, config.defaultnotepath)
config.docspath = path.join(appRootPath, config.docspath)
config.indexpath = path.join(appRootPath, config.indexpath)
config.hackmdpath = path.join(appRootPath, config.hackmdpath)
config.errorpath = path.join(appRootPath, config.errorpath)
config.prettypath = path.join(appRootPath, config.prettypath)
config.slidepath = path.join(appRootPath, config.slidepath)

// make config readonly
config = deepFreeze(config)

module.exports = config
