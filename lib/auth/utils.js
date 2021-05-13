'use strict'

const models = require('../models')
const config = require('../config')
const logger = require('../logger')

exports.setReturnToFromReferer = function setReturnToFromReferer (req) {
  if (!req.session) req.session = {}

  var referer = req.get('referer')
  var nextURL
  if (referer) {
    try {
      var refererSearchParams = new URLSearchParams(new URL(referer).search)
      nextURL = refererSearchParams.get('next')
    } catch (err) {
      logger.warn(err)
    }
  }

  if (nextURL) {
    var isRelativeNextURL = nextURL.indexOf('://') === -1 && !nextURL.startsWith('//')
    if (isRelativeNextURL) {
      req.session.returnTo = (new URL(nextURL, config.serverURL)).toString()
    } else {
      req.session.returnTo = config.serverURL
    }
  } else {
    req.session.returnTo = referer
  }
}

exports.passportGeneralCallback = function callback (accessToken, refreshToken, profile, done) {
  var stringifiedProfile = JSON.stringify(profile)
  models.User.findOrCreate({
    where: {
      profileid: profile.id.toString()
    },
    defaults: {
      profile: stringifiedProfile,
      accessToken: accessToken,
      refreshToken: refreshToken
    }
  }).spread(function (user, created) {
    if (user) {
      var needSave = false
      if (user.profile !== stringifiedProfile) {
        user.profile = stringifiedProfile
        needSave = true
      }
      if (user.accessToken !== accessToken) {
        user.accessToken = accessToken
        needSave = true
      }
      if (user.refreshToken !== refreshToken) {
        user.refreshToken = refreshToken
        needSave = true
      }
      if (needSave) {
        user.save().then(function () {
          if (config.debug) { logger.info('user login: ' + user.id) }
          return done(null, user)
        })
      } else {
        if (config.debug) { logger.info('user login: ' + user.id) }
        return done(null, user)
      }
    }
  }).catch(function (err) {
    logger.error('auth callback failed: ' + err)
    return done(err, null)
  })
}
