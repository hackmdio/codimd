'use strict'

const config = require('../config')

module.exports = function (req, res, next) {
  if (req.method === 'GET' && req.path.substr(-1) === '/' && req.path.length > 1) {
    // Don't redirect if this is the URL path itself (e.g., /codimd/)
    if (config.urlPath && req.path === `/${config.urlPath}/`) {
      next()
      return
    }

    const queryString = req.url.slice(req.path.length)
    const urlPath = req.path.slice(0, -1)
    res.redirect(301, urlPath + queryString)
  } else {
    next()
  }
}
