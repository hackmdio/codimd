'use strict'

const toobusy = require('toobusy-js')


const response = require('../../response')
const config = require('../../config')

toobusy.maxLag(config.tooBusyLag)

module.exports = function (req, res, next) {
  if (toobusy()) {
    response.errorServiceUnavailable(res)
  } else {
    next()
  }
}
