'use strict'
const fs = require('fs')
const path = require('path')

const config = require('../../config')
const {getImageMimeType} = require('../../utils')

const Minio = require('minio')
const minioClient = new Minio.Client({
  endPoint: config.minio.endPoint,
  port: config.minio.port,
  secure: config.minio.secure,
  accessKey: config.minio.accessKey,
  secretKey: config.minio.secretKey
})

exports.uploadImage = function (imagePath, callback) {
  if (!imagePath || typeof imagePath !== 'string') {
    callback(new Error('Image path is missing or wrong'), null)
    return
  }

  if (!callback || typeof callback !== 'function') {
    callback(new Error('Callback has to be a function'), null)
    return
  }

  fs.readFile(imagePath, function (err, buffer) {
    if (err) {
      callback(new Error(err), null)
      return
    }

    let key = path.join('uploads', path.basename(imagePath))
    let protocol = config.minio.secure ? 'https' : 'http'

    minioClient.putObject(config.s3bucket, key, buffer, buffer.size, getImageMimeType(imagePath), function (err, data) {
      if (err) {
        callback(new Error(err), null)
        return
      }
      callback(null, `${protocol}://${config.minio.endPoint}:${config.minio.port}/${config.s3bucket}/${key}`)
    })
  })
}
