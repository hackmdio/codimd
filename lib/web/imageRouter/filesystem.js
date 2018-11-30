'use strict'
const url = require('url')
const path = require('path')

const config = require('../../config')
const logger = require('../../logger')

exports.uploadImage = function (imagePath, callback) {
  if (!imagePath || typeof imagePath !== 'string') {
    callback(new Error('Image path is missing or wrong'), null)
    return
  }

  if (!callback || typeof callback !== 'function') {
    logger.error('Callback has to be a function')
    return
  }

  const imgURL = new url.URL(config.serverURL + '/uploads/', path.basename(imagePath))
  callback(null, imgURL.toString())
}
