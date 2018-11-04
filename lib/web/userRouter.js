'use strict'

const i18n = require('i18n')
const Router = require('express').Router

const { generateAvatar } = require('../letter-avatars')
const models = require('../models')
const response = require('../response')

const UserRouter = module.exports = Router()

UserRouter.get('/user/:username/avatar.svg', function (req, res, next) {
  res.setHeader('Content-Type', 'image/svg+xml')
  res.setHeader('Cache-Control', 'public, max-age=86400')
  res.send(generateAvatar(req.params.username))
})

UserRouter.get('/user/:username', function (req, res, next) {
  return models.User.findOne({
    where: {
      id: req.params.username
    }
  }).then(function (user) {
    if (!user) {
      return response.errorNotFound(res)
    }

    models.Note.findAll({
      where: {
        ownerId: user.id
      }
    }).then(function (notes) {
      res.render('user.ejs', {
        title: i18n.__('Profile for %s', user.name),
        notes: notes,
        contributions: [], // not yet implemented
        user: user
      })
    })
  }).catch(function (err) {
    console.error(err)
    return response.errorInternalError(res)
  })
})
