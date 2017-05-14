'use strict'

const Router = require('express').Router

const response = require('../response')
const models = require('../models')
const logger = require('../logger')

const UserRouter = module.exports = Router()

// get me info
UserRouter.get('/me', function (req, res) {
  if (req.isAuthenticated()) {
    models.User.findOne({
      where: {
        id: req.user.id
      }
    }).then(function (user) {
      if (!user) { return response.errorNotFound(res) }
      var profile = models.User.getProfile(user)
      res.send({
        status: 'ok',
        id: req.user.id,
        name: profile.name,
        photo: profile.photo
      })
    }).catch(function (err) {
      logger.error('read me failed: ' + err)
      return response.errorInternalError(res)
    })
  } else {
    res.send({
      status: 'forbidden'
    })
  }
})
