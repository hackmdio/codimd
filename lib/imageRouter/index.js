'use strict'

const Router = require('express').Router
const formidable = require('formidable')

const config = require('../config')
const logger = require('../logger')
const response = require('../response')

const imageRouter = module.exports = Router()

// upload image
imageRouter.post('/uploadimage', function (req, res) {
  var form = new formidable.IncomingForm()

  form.keepExtensions = true

  if (config.imageUploadType === 'filesystem') {
    form.uploadDir = config.uploadsPath
  }

  form.parse(req, function (err, fields, files) {
    if (err || !files.image || !files.image.path) {
      response.errorForbidden(req, res)
    } else {
      if (config.debug) {
        logger.info('SERVER received uploadimage: ' + JSON.stringify(files.image))
      }

      const uploadProvider = require('./' + config.imageUploadType)
      uploadProvider.uploadImage(files.image.path, function (err, url) {
        if (err !== null) {
          logger.error(err)
          return res.status(500).end('upload image error')
        }
        res.send({
          link: url
        })
      })
    }
  })
})
