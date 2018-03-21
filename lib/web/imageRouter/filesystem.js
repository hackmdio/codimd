'use strict'
const url = require('url')

const config = require('../../config')

exports.uploadImage = function (imagePath, callback) {
  if (!imagePath || typeof imagePath !== 'string') {
    callback(new Error('Image path is missing or wrong'), null)
    return
  }

  if (!callback || typeof callback !== 'function') {
    callback(new Error('Callback has to be a function'), null)
    return
  }

  callback(null, url.resolve(config.serverurl + '/', imagePath.match(/^public\/(.+$)/)[1]))
}
