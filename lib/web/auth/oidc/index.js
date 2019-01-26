'use strict'

const Router = require('express').Router
const passport = require('passport')
const OidcStrategy = require('passport-openidconnect').Strategy
const config = require('../../../config')
const {setReturnToFromReferer, passportGeneralCallback} = require('../utils')

let oidcAuth = module.exports = Router()

passport.use('oidc' new OidcStrategy({
  issuer: config.oidc.issuer,
  authorizationURL: config.oidc.authorizationURL,
  tokenURL: config.oidc.tokenURL,
  userInfoURL: config.oidc.userInfoURL
  clientID: config.oidc.clientID,
  clientSecret: config.oidc.clientSecret,
  callbackURL: config.serverURL + '/auth/oidc/callback',
  scope: config.oidc.scope
}, passportGeneralCallback))

oidcAuth.get('/auth/oidc', function (req, res, next) {
  setReturnToFromReferer(req)
  passport.authenticate('oidc')(req, res, next)
})

oidcAuth.get('/auth/oidc/callback',
  passport.authenticate('oidc', {
    successReturnToOrRedirect: config.serverURL + '/',
    failureRedirect: config.serverURL + '/'
  })
)
