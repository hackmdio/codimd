'use strict'

const Router = require('express').Router
const passport = require('passport')
const BitbucketStrategy = require('passport-bitbucket-oauth2').Strategy
const config = require('../../config')
const { setReturnToFromReferer, passportGeneralCallback } = require('../utils')

const bitbucketAuth = module.exports = Router()

passport.use(new BitbucketStrategy({
  clientID: config.bitbucket.clientID,
  clientSecret: config.bitbucket.clientSecret,
  callbackURL: config.serverURL + '/auth/bitbucket/callback'
}, passportGeneralCallback))

bitbucketAuth.get('/auth/bitbucket', function (req, res, next) {
  setReturnToFromReferer(req)
  passport.authenticate('bitbucket')(req, res, next)
})

// bitbucket auth callback
bitbucketAuth.get('/auth/bitbucket/callback',
  passport.authenticate('bitbucket', {
    successReturnToOrRedirect: config.serverURL + '/',
    failureRedirect: config.serverURL + '/'
  })
)
