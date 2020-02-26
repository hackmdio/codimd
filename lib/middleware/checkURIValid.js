'use strict'

const logger = require('../logger')
const response = require('../response')

module.exports = function (req, res, next) {
  try {
    decodeURIComponent(req.path)
  } catch (err) {
    logger.error(err)
    return response.errorBadRequest(req, res)
  }
  next()
}
