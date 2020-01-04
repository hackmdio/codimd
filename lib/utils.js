'use strict'
const fs = require('fs')
const path = require('path')
const bodyParser = require('body-parser')

exports.isSQLite = function isSQLite (sequelize) {
  return sequelize.options.dialect === 'sqlite'
}

exports.getImageMimeType = function getImageMimeType (imagePath) {
  const fileExtension = /[^.]+$/.exec(imagePath)

  switch (fileExtension[0]) {
    case 'bmp':
      return 'image/bmp'
    case 'gif':
      return 'image/gif'
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg'
    case 'png':
      return 'image/png'
    case 'tiff':
      return 'image/tiff'
    default:
      return undefined
  }
}

exports.isRevealTheme = function isRevealTheme (theme) {
  if (fs.existsSync(path.join(__dirname, '..', 'public', 'build', 'reveal.js', 'css', 'theme', theme + '.css'))) {
    return theme
  }
  return undefined
}

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
