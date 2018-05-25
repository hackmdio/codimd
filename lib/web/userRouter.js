'use strict'

const Router = require('express').Router

const response = require('../response')
const config = require('../config')
const models = require('../models')
const logger = require('../logger')
const {generateAvatar} = require('../letter-avatars')

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

// delete the currently authenticated user
UserRouter.get('/me/delete', function (req, res) {
  if (req.isAuthenticated()) {
    models.User.findOne({
      where: {
        id: req.user.id
      }
    }).then(function (user) {
      if (!user) { return response.errorNotFound(res) }
      user.destroy().then(function () {
        res.redirect(config.serverURL + '/')
      })
    }).catch(function (err) {
      logger.error('delete user failed: ' + err)
      return response.errorInternalError(res)
    })
  } else {
    res.send({
      status: 'forbidden'
    })
  }
})

UserRouter.get('/user/:username/avatar.svg', function (req, res, next) {
  res.setHeader('Content-Type', 'image/svg+xml')
  res.setHeader('Cache-Control', 'public, max-age=86400')
  res.send(generateAvatar(req.params.username))
})
