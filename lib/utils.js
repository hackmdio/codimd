'use strict'

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
