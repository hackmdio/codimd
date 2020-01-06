'use strict'

const config = require('../config')

module.exports = function (req, res, next) {
  res.set({
    'CodiMD-Version': config.version
  })
  return next()
}
