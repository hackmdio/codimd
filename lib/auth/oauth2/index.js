'use strict'

const Router = require('express').Router
const passport = require('passport')

const config = require('../../config')
const { setReturnToFromReferer, passportGeneralCallback } = require('../utils')
const { OAuth2CustomStrategy } = require('./strategy')

const oauth2Auth = module.exports = Router()

passport.use(new OAuth2CustomStrategy({
  authorizationURL: config.oauth2.authorizationURL,
  tokenURL: config.oauth2.tokenURL,
  clientID: config.oauth2.clientID,
  clientSecret: config.oauth2.clientSecret,
  callbackURL: config.serverURL + '/auth/oauth2/callback',
  userProfileURL: config.oauth2.userProfileURL,
  scope: config.oauth2.scope
}, passportGeneralCallback))

oauth2Auth.get('/auth/oauth2', function (req, res, next) {
  setReturnToFromReferer(req)
  passport.authenticate('oauth2')(req, res, next)
})

// github auth callback
oauth2Auth.get('/auth/oauth2/callback',
  passport.authenticate('oauth2', {
    successReturnToOrRedirect: config.serverURL + '/',
    failureRedirect: config.serverURL + '/'
  })
)
