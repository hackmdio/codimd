'use strict'

const crypto = require('crypto')
const fs = require('fs')
const URL = require('url').URL
const path = require('path')

const config = require('../config')
const logger = require('../logger')

/**
 * generate a random filename for uploaded image
 */
function randomFilename () {
  const buf = crypto.randomBytes(16)
  return `upload_${buf.toString('hex')}`
}

/**
 * pick a filename not exist in filesystem
 * maximum attempt 5 times
 */
function pickFilename (defaultFilename) {
  let retryCounter = 5
  let filename = defaultFilename
  const extname = path.extname(defaultFilename)
  while (retryCounter-- > 0) {
    if (fs.existsSync(path.join(config.uploadsPath, filename))) {
      filename = `${randomFilename()}${extname}`
      continue
    }
    return filename
  }
  throw new Error('file exists.')
}

exports.uploadImage = function (imagePath, callback) {
  if (!imagePath || typeof imagePath !== 'string') {
    callback(new Error('Image path is missing or wrong'), null)
    return
  }

  if (!callback || typeof callback !== 'function') {
    logger.error('Callback has to be a function')
    return
  }

  let filename = path.basename(imagePath)
  try {
    filename = pickFilename(path.basename(imagePath))
  } catch (e) {
    return callback(e, null)
  }

  try {
    fs.copyFileSync(imagePath, path.join(config.uploadsPath, filename))
  } catch (e) {
    return callback(e, null)
  }

  let url
  try {
    url = (new URL(filename, config.serverURL + '/uploads/')).href
  } catch (e) {
    url = config.serverURL + '/uploads/' + filename
  }

  callback(null, url)
}
