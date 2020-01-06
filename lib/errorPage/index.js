'use strict'

const config = require('../config')
const { responseError } = require('../response')

exports.errorForbidden = (req, res) => {
  if (req.user) {
    return responseError(res, '403', 'Forbidden', 'oh no.')
  }

  req.flash('error', 'You are not allowed to access this page. Maybe try logging in?')
  res.redirect(config.serverURL + '/')
}

exports.errorNotFound = (req, res) => {
  responseError(res, '404', 'Not Found', 'oops.')
}

exports.errorInternalError = (req, res) => {
  responseError(res, '500', 'Internal Error', 'wtf.')
}
