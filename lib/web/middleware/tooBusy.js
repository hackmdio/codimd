'use strict'

const toobusy = require('toobusy-js')

const response = require('../../response')

module.exports = function (req, res, next) {
  if (toobusy()) {
    response.errorServiceUnavailable(res)
  } else {
    next()
  }
}
