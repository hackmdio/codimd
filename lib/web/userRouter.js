'use strict'

const archiver = require('archiver')
const async = require('async')
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
    // let output = fs.createWriteStream(__dirname + '/example.zip');
    let archive = archiver('zip', {
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
        let list = []
        async.each(notes, function (note, callback) {
          let title
          let extension = ''
          do {
            title = note.title + extension
            extension++
          } while (list.indexOf(title) !== -1)

          list.push(title)
          logger.debug('Write: ' + title + '.md')
          archive.append(Buffer.from(note.content), { name: title + '.md', date: note.lastchangeAt })
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
