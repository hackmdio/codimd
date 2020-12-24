'use strict'

const fs = require('fs')
const path = require('path')
const Router = require('express').Router
const formidable = require('formidable')

const readChunk = require('read-chunk')
const imageType = require('image-type')
const mime = require('mime-types')

const config = require('../config')
const logger = require('../logger')
const response = require('../response')

const imageRouter = module.exports = Router()

function checkImageValid (filepath) {
  const buffer = readChunk.sync(filepath, 0, 12)
  /** @type {{ ext: string, mime: string } | null} */
  const mimetypeFromBuf = imageType(buffer)
  const mimeTypeFromExt = mime.lookup(path.extname(filepath))

  return mimetypeFromBuf && config.allowedUploadMimeTypes.includes(mimetypeFromBuf.mime) &&
         mimeTypeFromExt && config.allowedUploadMimeTypes.includes(mimeTypeFromExt)
}

// upload image
imageRouter.post('/uploadimage', function (req, res) {
  var form = new formidable.IncomingForm()

  form.keepExtensions = true

  form.parse(req, function (err, fields, files) {
    if (err || !files.image || !files.image.path) {
      response.errorForbidden(req, res)
    } else {
      if (config.debug) {
        logger.info('SERVER received uploadimage: ' + JSON.stringify(files.image))
      }

      if (!checkImageValid(files.image.path)) {
        return response.errorForbidden(req, res)
      }

      const uploadProvider = require('./' + config.imageUploadType)
      uploadProvider.uploadImage(files.image.path, function (err, url) {
        // remove temporary upload file, and ignore any error
        fs.unlink(files.image.path, () => {})
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
