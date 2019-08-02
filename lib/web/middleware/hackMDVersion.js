'use strict'

const config = require('../../config')

module.exports = function (req, res, next) {
  res.set({
    'HackMD-Version': config.version
  })
  return next()
}
