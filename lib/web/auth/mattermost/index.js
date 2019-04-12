'use strict'

const Router = require('express').Router
const passport = require('passport')
const Mattermost = require('mattermost')
const OAuthStrategy = require('passport-oauth2').Strategy
const config = require('../../../config')
const { setReturnToFromReferer, passportGeneralCallback } = require('../utils')

const mattermost = new Mattermost.Client()

let mattermostAuth = module.exports = Router()

let mattermostStrategy = new OAuthStrategy({
  authorizationURL: config.mattermost.baseURL + '/oauth/authorize',
  tokenURL: config.mattermost.baseURL + '/oauth/access_token',
  clientID: config.mattermost.clientID,
  clientSecret: config.mattermost.clientSecret,
  callbackURL: config.serverURL + '/auth/mattermost/callback'
}, passportGeneralCallback)

mattermostStrategy.userProfile = (accessToken, done) => {
  mattermost.setUrl(config.mattermost.baseURL)
  mattermost.token = accessToken
  mattermost.useHeaderToken()
  mattermost.getMe(
    (data) => {
      done(null, data)
    },
    (err) => {
      done(err)
    }
  )
}

passport.use(mattermostStrategy)

mattermostAuth.get('/auth/mattermost', function (req, res, next) {
  setReturnToFromReferer(req)
  passport.authenticate('oauth2')(req, res, next)
})

// mattermost auth callback
mattermostAuth.get('/auth/mattermost/callback',
  passport.authenticate('oauth2', {
    successReturnToOrRedirect: config.serverURL + '/',
    failureRedirect: config.serverURL + '/'
  })
)
