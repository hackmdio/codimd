'use strict'

const Router = require('express').Router
const request = require('request')
const passport = require('passport')
const GithubStrategy = require('passport-github').Strategy
const { InternalOAuthError } = require('passport-oauth2')
const config = require('../../config')
const response = require('../../response')
const { setReturnToFromReferer, passportGeneralCallback } = require('../utils')
const { URL } = require('url')
const { promisify } = require('util')

const rp = promisify(request)

const githubAuth = module.exports = Router()

function githubUrl (path) {
  return config.github.enterpriseURL && new URL(path, config.github.enterpriseURL).toString()
}

passport.use(new GithubStrategy({
  scope: (config.github.organizations ?
    config.github.scopes.concat(['read:org']) : config.github.scope),
  clientID: config.github.clientID,
  clientSecret: config.github.clientSecret,
  callbackURL: config.serverURL + '/auth/github/callback',
  authorizationURL: githubUrl('login/oauth/authorize'),
  tokenURL: githubUrl('login/oauth/access_token'),
  userProfileURL: githubUrl('api/v3/user')
}, async (accessToken, refreshToken, profile, done) => {
  if (!config.github.organizations) {
    return passportGeneralCallback(accessToken, refreshToken, profile, done)
  }
  const { statusCode, body: data } = await rp({
    url: `https://api.github.com/user/orgs`,
    method: 'GET', json: true, timeout: 2000,
    headers: {
      'Authorization': `token ${accessToken}`,
      'User-Agent': 'nodejs-http'
    }
  })
  if (statusCode != 200) {
    return done(InternalOAuthError(
      `Failed to query organizations for user: ${profile.username}`
    ))
  }
  const orgs = data.map(({login}) => login)
  for (const org of orgs) {
    if (config.github.organizations.includes(org)) {
      return passportGeneralCallback(accessToken, refreshToken, profile, done)
    }
  }
  return done(InternalOAuthError(
    `User orgs not whitelisted: ${profile.username} (${orgs.join(',')})`
  ))
}))

githubAuth.get('/auth/github', function (req, res, next) {
  setReturnToFromReferer(req)
  passport.authenticate('github')(req, res, next)
})

githubAuth.get('/auth/github/callback',
  passport.authenticate('github', {
    successReturnToOrRedirect: config.serverURL + '/',
    failureRedirect: config.serverURL + '/'
  })
)

// github callback actions
githubAuth.get('/auth/github/callback/:noteId/:action', response.githubActions)
