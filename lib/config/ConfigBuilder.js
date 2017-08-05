'use strict'

const fs = require('fs')
const path = require('path')
const {merge, cloneDeep} = require('lodash')
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

/**
 *
 * new Config().setEnv('test').setConfigFile().Build()
 * @class Config
 */
class ConfigBuilder {
  constructor(){
    this.configFilePath = path.join(appRootPath, 'config.json')
    this.env = process.env.NODE_ENV || Environment.development
  }
  SetEnv(env){
    if (Environment.hasOwnProperty(env))
      this.env = env
    return this
  }
  SetConfigFile(filePath){
    this.configFilePath = filePath
    this.fileConfig = fs.existsSync(this.configFilePath) ? require(this.configFilePath) : undefined
    return this
  }
  _loadConfig(){
    this.config = require('./default')
    merge(this.config, require('./defaultSSL'))
    merge(this.config, debugConfig)
    merge(this.config, packageConfig)
    if (this.fileConfig && this.fileConfig.hasOwnProperty(this.env))
      merge(this.config, this.fileConfig[this.env])
    merge(this.config, require('./oldEnvironment'))
    merge(this.config, require('./environment'))
    merge(this.config, require('./dockerSecret'))
  }
  _postLoadConfig(){
    // load LDAP CA
    if (this.config.ldap.tlsca) {
      let ca = this.config.ldap.tlsca.split(',')
      let caContent = []
      for (let i of ca) {
        if (fs.existsSync(i)) {
          caContent.push(fs.readFileSync(i, 'utf8'))
        }
      }
      let tlsOptions = {
        ca: caContent
      }
      this.config.ldap.tlsOptions = this.config.ldap.tlsOptions ? Object.assign(this.config.ldap.tlsOptions, tlsOptions) : tlsOptions
    }

    // Permission
    this.config.permission = Permission
    if (!this.config.allowanonymous) {
      delete this.config.permission.freely
    }
    if (!(this.config.defaultpermission in this.config.permission)) {
      this.config.defaultpermission = this.config.permission.editable
    }

    // cache result, cannot change config in runtime!!!
    this.config.isStandardHTTPsPort = (() =>  {
      return this.config.usessl && this.config.port === 443
    })()
    this.config.isStandardHTTPPort = (() => {
      return !this.config.usessl && this.config.port === 80
    })()

    // cache serverURL
    this.config.serverurl = (() => {
      var url = ''
      if (this.config.domain) {
        var protocol = this.config.protocolusessl ? 'https://' : 'http://'
        url = protocol + this.config.domain
        if (this.config.urladdport) {
          if (!this.config.isStandardHTTPPort || !this.config.isStandardHTTPsPort) {
            url += ':' + this.config.port
          }
        }
      }
      if (this.config.urlpath) {
        url += '/' + this.config.urlpath
      }
      return url
    })()

    this.config.Environment = Environment

    // auth method
    this.config.isFacebookEnable = this.config.facebook.clientID && this.config.facebook.clientSecret
    this.config.isGoogleEnable = this.config.google.clientID && this.config.google.clientSecret
    this.config.isDropboxEnable = this.config.dropbox.clientID && this.config.dropbox.clientSecret
    this.config.isTwitterEnable = this.config.twitter.consumerKey && this.config.twitter.consumerSecret
    this.config.isEmailEnable = this.config.email
    this.config.isGitHubEnable = this.config.github.clientID && this.config.github.clientSecret
    this.config.isGitLabEnable = this.config.gitlab.clientID && this.config.gitlab.clientSecret
    this.config.isLDAPEnable = this.config.ldap.url

    // generate correct path
    this.config.sslcapath = path.join(appRootPath, this.config.sslcapath)
    this.config.sslcertpath = path.join(appRootPath, this.config.sslcertpath)
    this.config.sslkeypath = path.join(appRootPath, this.config.sslkeypath)
    this.config.dhparampath = path.join(appRootPath, this.config.dhparampath)

    this.config.tmppath = path.join(appRootPath, this.config.tmppath)
    this.config.defaultnotepath = path.join(appRootPath, this.config.defaultnotepath)
    this.config.docspath = path.join(appRootPath, this.config.docspath)
    this.config.indexpath = path.join(appRootPath, this.config.indexpath)
    this.config.hackmdpath = path.join(appRootPath, this.config.hackmdpath)
    this.config.errorpath = path.join(appRootPath, this.config.errorpath)
    this.config.prettypath = path.join(appRootPath, this.config.prettypath)
    this.config.slidepath = path.join(appRootPath, this.config.slidepath)
  }
  Build(){
    this._loadConfig();
    this._postLoadConfig();
    let config = cloneDeep(this.config)
    return deepFreeze(config)
  }
}

module.exports = ConfigBuilder
