'use strict'

const models = require('../models')
const config = require('../config')
const logger = require('../logger')

exports.setReturnToFromReferer = function setReturnToFromReferer (req) {
  var referer = req.get('referer')
  if (!req.session) req.session = {}
  req.session.returnTo = referer
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
