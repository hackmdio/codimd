'use strict'

const bodyParser = require('body-parser')

exports.wrap = innerHandler => (req, res, next) => innerHandler(req, res).catch(err => next(err))

// create application/x-www-form-urlencoded parser
exports.urlencodedParser = bodyParser.urlencoded({
  extended: false,
  limit: 1024 * 1024 * 10 // 10 mb
})

// create text/markdown parser
exports.markdownParser = bodyParser.text({
  inflate: true,
  type: ['text/plain', 'text/markdown'],
  limit: 1024 * 1024 * 10 // 10 mb
})
