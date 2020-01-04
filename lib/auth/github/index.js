'use strict'

const Router = require('express').Router
const passport = require('passport')
const GithubStrategy = require('passport-github').Strategy
const config = require('../../config')
const response = require('../../response')
const { setReturnToFromReferer, passportGeneralCallback } = require('../utils')
const { URL } = require('url')

const githubAuth = module.exports = Router()

function githubUrl (path) {
  return config.github.enterpriseURL && new URL(path, config.github.enterpriseURL).toString()
}

passport.use(new GithubStrategy({
  clientID: config.github.clientID,
  clientSecret: config.github.clientSecret,
  callbackURL: config.serverURL + '/auth/github/callback',
  authorizationURL: githubUrl('login/oauth/authorize'),
  tokenURL: githubUrl('login/oauth/access_token'),
  userProfileURL: githubUrl('api/v3/user')
}, passportGeneralCallback))

githubAuth.get('/auth/github', function (req, res, next) {
  setReturnToFromReferer(req)
  passport.authenticate('github')(req, res, next)
})

// github auth callback
githubAuth.get('/auth/github/callback',
  passport.authenticate('github', {
    successReturnToOrRedirect: config.serverURL + '/',
    failureRedirect: config.serverURL + '/'
  })
)

// github callback actions
githubAuth.get('/auth/github/callback/:noteId/:action', response.githubActions)
