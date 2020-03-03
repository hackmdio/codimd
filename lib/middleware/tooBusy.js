'use strict'

const toobusy = require('toobusy-js')

const config = require('../config')
const response = require('../response')

toobusy.maxLag(config.responseMaxLag)

module.exports = function (req, res, next) {
  if (toobusy()) {
    response.errorServiceUnavailable(req, res)
  } else {
    next()
  }
}
