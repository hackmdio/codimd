'use strict'

const Router = require('express').Router

const {generateAvatar} = require('../letter-avatars')

const UserRouter = module.exports = Router()

UserRouter.get('/user/:username/avatar.svg', function (req, res, next) {
  res.setHeader('Content-Type', 'image/svg+xml')
  res.setHeader('Cache-Control', 'public, max-age=86400')
  res.send(generateAvatar(req.params.username))
})
