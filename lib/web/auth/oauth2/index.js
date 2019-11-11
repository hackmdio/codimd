'use strict'

const Router = require('express').Router
const passport = require('passport')
const { Strategy, InternalOAuthError } = require('passport-oauth2')
const config = require('../../../config')
const { setReturnToFromReferer, passportGeneralCallback } = require('../utils')

const oauth2Auth = module.exports = Router()

class OAuth2CustomStrategy extends Strategy {
  constructor (options, verify) {
    options.customHeaders = options.customHeaders || {}
    super(options, verify)
    this.name = 'oauth2'
    this._userProfileURL = options.userProfileURL
    this._oauth2.useAuthorizationHeaderforGET(true)
  }

  userProfile (accessToken, done) {
    this._oauth2.get(this._userProfileURL, accessToken, function (err, body, res) {
      var json

      if (err) {
        return done(new InternalOAuthError('Failed to fetch user profile', err))
      }

      try {
        json = JSON.parse(body)
      } catch (ex) {
        return done(new Error('Failed to parse user profile'))
      }

      const profile = parseProfile(json)
      profile.provider = 'oauth2'

      done(null, profile)
    })
  }
}

function extractProfileAttribute (data, path) {
  // can handle stuff like `attrs[0].name`
  path = path.split('.')
  for (const segment of path) {
    const m = segment.match(/([\d\w]+)\[(.*)\]/)
    data = m ? data[m[1]][m[2]] : data[segment]
  }
  return data
}

function parseProfile (data) {
  const username = extractProfileAttribute(data, config.oauth2.userProfileUsernameAttr)
  const displayName = extractProfileAttribute(data, config.oauth2.userProfileDisplayNameAttr)
  const email = extractProfileAttribute(data, config.oauth2.userProfileEmailAttr)

  return {
    id: username,
    username: username,
    displayName: displayName,
    email: email
  }
}

OAuth2CustomStrategy.prototype.userProfile = function (accessToken, done) {
  this._oauth2.get(this._userProfileURL, accessToken, function (err, body, res) {
    var json

    if (err) {
      return done(new InternalOAuthError('Failed to fetch user profile', err))
    }

    try {
      json = JSON.parse(body)
    } catch (ex) {
      return done(new Error('Failed to parse user profile'))
    }

    const profile = parseProfile(json)
    profile.provider = 'oauth2'

    done(null, profile)
  })
}

passport.use(new OAuth2CustomStrategy({
  authorizationURL: config.oauth2.authorizationURL,
  tokenURL: config.oauth2.tokenURL,
  clientID: config.oauth2.clientID,
  clientSecret: config.oauth2.clientSecret,
  callbackURL: config.serverURL + '/auth/oauth2/callback',
  userProfileURL: config.oauth2.userProfileURL
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
