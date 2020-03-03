'use strict'
const URL = require('url').URL
const path = require('path')

const config = require('../config')
const logger = require('../logger')

exports.uploadImage = function (imagePath, callback) {
  if (!imagePath || typeof imagePath !== 'string') {
    callback(new Error('Image path is missing or wrong'), null)
    return
  }

  if (!callback || typeof callback !== 'function') {
    logger.error('Callback has to be a function')
    return
  }

  let url
  try {
    url = (new URL(path.basename(imagePath), config.serverURL + '/uploads/')).href
  } catch (e) {
    url = config.serverURL + '/uploads/' + path.basename(imagePath)
  }

  callback(null, url)
}
