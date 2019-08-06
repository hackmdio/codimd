'use strict'

const archiver = require('archiver')
const async = require('async')
const Router = require('express').Router

const response = require('../response')
const config = require('../config')
const models = require('../models')
const logger = require('../logger')
const { generateAvatar } = require('../letter-avatars')

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
    res.status(401).send({
      status: 'forbidden'
    })
  }
})

// delete the currently authenticated user
UserRouter.get('/me/delete/:token?', function (req, res) {
  if (req.isAuthenticated()) {
    models.User.findOne({
      where: {
        id: req.user.id
      }
    }).then(function (user) {
      if (!user) {
        return response.errorNotFound(res)
      }
      if (user.deleteToken === req.params.token) {
        user.destroy().then(function () {
          res.redirect(config.serverURL + '/')
        })
      } else {
        return response.errorForbidden(res)
      }
    }).catch(function (err) {
      logger.error('delete user failed: ' + err)
      return response.errorInternalError(res)
    })
  } else {
    return response.errorForbidden(res)
  }
})

// export the data of the authenticated user
UserRouter.get('/me/export', function (req, res) {
  if (req.isAuthenticated()) {
    const archive = archiver('zip', {
      zlib: { level: 3 } // Sets the compression level.
    })
    res.setHeader('Content-Type', 'application/zip')
    res.attachment('archive.zip')
    archive.pipe(res)
    archive.on('error', function (err) {
      logger.error('export user data failed: ' + err)
      return response.errorInternalError(res)
    })
    models.User.findOne({
      where: {
        id: req.user.id
      }
    }).then(function (user) {
      models.Note.findAll({
        where: {
          ownerId: user.id
        }
      }).then(function (notes) {
        const filenames = {}
        async.each(notes, function (note, callback) {
          const basename = note.title.replace(/\//g, '-') // Prevent subdirectories
          let filename
          let suffix = 0
          do {
            const separator = suffix === 0 ? '' : '-'
            filename = basename + separator + suffix + '.md'
            suffix++
          } while (filenames[filename])
          filenames[filename] = true

          logger.debug('Write: ' + filename)
          archive.append(Buffer.from(note.content), { name: filename, date: note.lastchangeAt })
          callback(null, null)
        }, function (err) {
          if (err) {
            return response.errorInternalError(res)
          }

          archive.finalize()
        })
      })
    }).catch(function (err) {
      logger.error('export user data failed: ' + err)
      return response.errorInternalError(res)
    })
  } else {
    return response.errorForbidden(res)
  }
})

UserRouter.get('/user/:username/avatar.svg', function (req, res, next) {
  res.setHeader('Content-Type', 'image/svg+xml')
  res.setHeader('Cache-Control', 'public, max-age=86400')
  res.send(generateAvatar(req.params.username))
})
