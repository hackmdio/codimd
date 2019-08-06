'use strict'

const Router = require('express').Router
const passport = require('passport')
const GitlabStrategy = require('passport-gitlab2').Strategy
const config = require('../../../config')
const response = require('../../../response')
const { setReturnToFromReferer, passportGeneralCallback } = require('../utils')

const gitlabAuth = module.exports = Router()

passport.use(new GitlabStrategy({
  baseURL: config.gitlab.baseURL,
  clientID: config.gitlab.clientID,
  clientSecret: config.gitlab.clientSecret,
  scope: config.gitlab.scope,
  callbackURL: config.serverURL + '/auth/gitlab/callback'
}, passportGeneralCallback))

gitlabAuth.get('/auth/gitlab', function (req, res, next) {
  setReturnToFromReferer(req)
  passport.authenticate('gitlab')(req, res, next)
})

// gitlab auth callback
gitlabAuth.get('/auth/gitlab/callback',
  passport.authenticate('gitlab', {
    successReturnToOrRedirect: config.serverURL + '/',
    failureRedirect: config.serverURL + '/'
  })
)

if (!config.gitlab.scope || config.gitlab.scope === 'api') {
  // gitlab callback actions
  gitlabAuth.get('/auth/gitlab/callback/:noteId/:action', response.gitlabActions)
}
