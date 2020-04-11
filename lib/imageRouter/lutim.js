'use strict'
const config = require('../config')
const logger = require('../logger')

const lutim = require('lutim')

exports.uploadImage = function (imagePath, callback) {
  if (!imagePath || typeof imagePath !== 'string') {
    callback(new Error('Image path is missing or wrong'), null)
    return
  }

  if (!callback || typeof callback !== 'function') {
    logger.error('Callback has to be a function')
    return
  }

  if (config.lutim && config.lutim.url) {
    lutim.setAPIUrl(config.lutim.url)
  }

  lutim.uploadImage(imagePath)
    .then(function (json) {
      if (config.debug) {
        logger.info('SERVER uploadimage success: ' + JSON.stringify(json))
      }
      callback(null, lutim.getAPIUrl() + json.msg.short)
    }).catch(function (err) {
      callback(new Error(err), null)
    })
}
