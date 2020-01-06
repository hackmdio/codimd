'use strict'

const config = require('../config')

module.exports = function (req, res, next) {
  if (req.method === 'GET' && req.path.substr(-1) === '/' && req.path.length > 1) {
    const queryString = req.url.slice(req.path.length)
    const urlPath = req.path.slice(0, -1)
    let serverURL = config.serverURL
    if (config.urlPath) {
      serverURL = serverURL.slice(0, -(config.urlPath.length + 1))
    }
    res.redirect(301, serverURL + urlPath + queryString)
  } else {
    next()
  }
}
