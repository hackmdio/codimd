'use strict'
const fs = require('fs')
const path = require('path')

const config = require('../config')
const { getImageMimeType } = require('../utils')
const logger = require('../logger')

const AWS = require('aws-sdk')
const awsConfig = new AWS.Config(config.s3)
const s3 = new AWS.S3(awsConfig)

exports.uploadImage = function (imagePath, callback) {
  if (!imagePath || typeof imagePath !== 'string') {
    callback(new Error('Image path is missing or wrong'), null)
    return
  }

  if (!callback || typeof callback !== 'function') {
    logger.error('Callback has to be a function')
    return
  }

  fs.readFile(imagePath, function (err, buffer) {
    if (err) {
      callback(new Error(err), null)
      return
    }
    const params = {
      Bucket: config.s3bucket,
      Key: path.join('uploads', path.basename(imagePath)),
      Body: buffer,
      ACL: 'public-read'
    }

    const mimeType = getImageMimeType(imagePath)
    if (mimeType) { params.ContentType = mimeType }

    s3.putObject(params, function (err, data) {
      if (err) {
        callback(new Error(err), null)
        return
      }

      let s3Endpoint = 's3.amazonaws.com'
      if (config.s3.endpoint) {
        s3Endpoint = config.s3.endpoint
      } else if (config.s3.region && config.s3.region !== 'us-east-1') {
        s3Endpoint = `s3-${config.s3.region}.amazonaws.com`
      }
      callback(null, `https://${s3Endpoint}/${config.s3bucket}/${params.Key}`)
    })
  })
}
