'use strict'

const Router = require('express').Router

const config = require('../../config')
const logger = require('../../logger')

const authRouter = module.exports = Router()

if (config.facebook) authRouter.use('/', require('./facebook'))
if (config.twitter) authRouter.use('/', require('./twitter'))
if (config.github) authRouter.use('/', require('./github'))
if (config.gitlab) authRouter.use('/', require('./gitlab'))
if (config.dropbox) authRouter.use('/', require('./dropbox'))
if (config.google) authRouter.use('/', require('./google'))
if (config.ldap) authRouter.use('/', require('./ldap'))
if (config.email) authRouter.use('/', require('./email'))

// logout
authRouter.get('/logout', function (req, res) {
  if (config.debug && req.isAuthenticated()) {
    logger.debug('user logout: ' + req.user.id)
  }
  req.logout()
  res.redirect(config.serverurl + '/')
})
