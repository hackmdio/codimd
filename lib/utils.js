'use strict'
const fs = require('fs')
const path = require('path')
const base64url = require('base64url')

exports.isSQLite = function isSQLite (sequelize) {
  return sequelize.options.dialect === 'sqlite'
}

exports.getImageMimeType = function getImageMimeType (imagePath) {
  var fileExtension = /[^.]+$/.exec(imagePath)

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

exports.encodeNoteId = function (id) {
  // remove dashes in UUID and encode in url-safe base64
  return base64url.encode(id.replace(/-/g, ''))
}

exports.decodeNoteId = function (encodedId) {
  // decode from url-safe base64
  let id = base64url.decode(encodedId)
  // add dashes between the UUID string parts
  let idParts = []
  idParts.push(id.substr(0, 8))
  idParts.push(id.substr(8, 4))
  idParts.push(id.substr(12, 4))
  idParts.push(id.substr(16, 4))
  idParts.push(id.substr(20, 12))
  return idParts.join('-')
}
