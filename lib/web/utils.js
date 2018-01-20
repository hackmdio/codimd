'use strict'

const bodyParser = require('body-parser')

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
