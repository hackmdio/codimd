'use strict'

const Router = require('express').Router
const passport = require('passport')
const FacebookStrategy = require('passport-facebook').Strategy

const config = require('../../config')
const { setReturnToFromReferer, passportGeneralCallback } = require('../utils')

const facebookAuth = module.exports = Router()

passport.use(new FacebookStrategy({
  clientID: config.facebook.clientID,
  clientSecret: config.facebook.clientSecret,
  callbackURL: config.serverURL + '/auth/facebook/callback'
}, passportGeneralCallback))

facebookAuth.get('/auth/facebook', function (req, res, next) {
  setReturnToFromReferer(req)
  passport.authenticate('facebook')(req, res, next)
})

// facebook auth callback
facebookAuth.get('/auth/facebook/callback',
  passport.authenticate('facebook', {
    successReturnToOrRedirect: config.serverURL + '/',
    failureRedirect: config.serverURL + '/'
  })
)
