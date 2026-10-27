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
const sanitizeSvg = require('./sanitizeSvg')

const imageRouter = module.exports = Router()

const SVG_MAX_BYTES = 2 * 1024 * 1024

/**
 * SVG is plain XML without a magic number, so image-type can never detect it.
 * Sanitize it instead and replace the temporary upload with the clean version.
 */
function sanitizeSvgFile (filepath) {
  if (fs.statSync(filepath).size > SVG_MAX_BYTES) return false

  const sanitized = sanitizeSvg(fs.readFileSync(filepath, 'utf8'))
  if (!sanitized) return false

  fs.writeFileSync(filepath, sanitized)
  return true
}

/**
 * Check whether an uploaded file is an allowed image.
 * Uploaded SVG files are sanitized in place.
 */
function checkImageValid (filepath) {
  try {
    const mimeTypeFromExt = mime.lookup(path.extname(filepath))

    if (mimeTypeFromExt === 'image/svg+xml') {
      return config.allowedUploadMimeTypes.includes(mimeTypeFromExt) && sanitizeSvgFile(filepath)
    }

    const buffer = readChunk.sync(filepath, 0, 12)
    /** @type {{ ext: string, mime: string } | null} */
    const mimetypeFromBuf = imageType(buffer)

    return mimetypeFromBuf && config.allowedUploadMimeTypes.includes(mimetypeFromBuf.mime) &&
          mimeTypeFromExt && config.allowedUploadMimeTypes.includes(mimeTypeFromExt)
  } catch (err) {
    logger.error(err)
    return false
  }
}

// upload image
imageRouter.post('/uploadimage', function (req, res) {
  var form = new formidable.IncomingForm({
    keepExtensions: true
  })

  form.parse(req, function (err, fields, files) {
    if (err || !files.image || !files.image.filepath) {
      response.errorForbidden(req, res)
    } else {
      if (config.debug) {
        logger.info('SERVER received uploadimage: ' + JSON.stringify(files.image))
      }

      if (!checkImageValid(files.image.filepath)) {
        return response.errorForbidden(req, res)
      }

      const uploadProvider = require('./' + config.imageUploadType)
      uploadProvider.uploadImage(files.image.filepath, function (err, url) {
        // remove temporary upload file, and ignore any error
        fs.unlink(files.image.filepath, () => {})
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
