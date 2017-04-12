'use strict'

const Router = require('express').Router
const passport = require('passport')

const config = require('../../config')
const logger = require('../../logger')
const models = require('../../models')

const authRouter = module.exports = Router()

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

if (config.isFacebookEnable) authRouter.use(require('./facebook'))
if (config.isTwitterEnable) authRouter.use(require('./twitter'))
if (config.isGitHubEnable) authRouter.use(require('./github'))
if (config.isGitLabEnable) authRouter.use(require('./gitlab'))
if (config.isDropboxEnable) authRouter.use(require('./dropbox'))
if (config.isGoogleEnable) authRouter.use(require('./google'))
if (config.isLDAPEnable) authRouter.use(require('./ldap'))
if (config.isEmailEnable) authRouter.use(require('./email'))

// logout
authRouter.get('/logout', function (req, res) {
  if (config.debug && req.isAuthenticated()) {
    logger.debug('user logout: ' + req.user.id)
  }
  req.logout()
  res.redirect(config.serverurl + '/')
})
